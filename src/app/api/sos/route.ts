import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import twilio from "twilio";
import { rateLimitSendEmergency } from "@/lib/ratelimit";
import { formatStoredPhone } from "@/lib/phone-utils";
import { logAuditEvent } from "@/lib/audit";
import { intentarPush } from "@/lib/push-notify";

// Twilio Setup
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY requerido en /api/sos");
}
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

interface EmergencyContact {
    name?: string;
    phone?: string;
    email?: string;
    relationship?: string;
}

interface NotifyTarget {
    email?: string;
    phone?: string;
}

export async function POST(req: NextRequest) {
    try {
        // ── 1. AUTENTICACIÓN VÍA BEARER TOKEN ──
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const token = authHeader.replace("Bearer ", "").trim();
        if (!token) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // ── 2. RATE LIMITING ──
        const identifier = `sos:${user.id}`;
        const { success: rateLimitSuccess } = await rateLimitSendEmergency.limit(identifier);

        if (!rateLimitSuccess) {
            console.warn(`Rate limit excedido para SOS del usuario: ${user.id}`);
            return NextResponse.json(
                { error: "Límite de notificaciones de emergencia alcanzado para hoy." },
                { status: 429 }
            );
        }

        // ── 3. OBTENER PERFIL ──
        const { data: profileData, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("id, user_id, full_name, emergency_contacts, phone")
            .eq("user_id", user.id)
            .maybeSingle();

        if (profileError || !profileData) {
            return NextResponse.json({ error: "Perfil no encontrado" }, { status: 403 });
        }

        // ── 4. OBTENER CHIP ACTIVO ──
        const { data: chipData, error: chipError } = await supabaseAdmin
            .from("chips")
            .select("id, folio")
            .eq("owner_profile_id", profileData.id)
            .eq("activated", true)
            .limit(1)
            .maybeSingle();

        if (chipError || !chipData) {
            return NextResponse.json(
                { error: "No tienes un chip activo vinculado" },
                { status: 403 }
            );
        }

        // ── 5. BODY (LATITUD Y LONGITUD OPCIONALES) ──
        let latitud: number | null = null;
        let longitud: number | null = null;

        try {
            const body = await req.json();
            if (body.latitud !== undefined && body.latitud !== null && body.latitud !== "") {
                latitud = Number(body.latitud);
            }
            if (body.longitud !== undefined && body.longitud !== null && body.longitud !== "") {
                longitud = Number(body.longitud);
            }
        } catch {
            // Body vacío o no parseable como JSON es válido (coordenadas opcionales)
        }

        const ip_raw = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
            || req.headers.get("x-real-ip")
            || "127.0.0.1";
        const ip_address = ip_raw !== "127.0.0.1" ? ip_raw : "Desconocida";
        const user_agent = req.headers.get("user-agent") || "Desconocido";

        // ── 6. CREAR INCIDENTE DE EMERGENCIA ──
        const incidentToken = randomBytes(16).toString("hex");
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        let incidentUrl: string | null = null;

        const { error: incidentError } = await supabaseAdmin
            .from("incidentes")
            .insert({
                token: incidentToken,
                chip_folio: chipData.folio,
                chip_id: chipData.id,
                profile_id: profileData.id,
                latitud: latitud || null,
                longitud: longitud || null,
                ip_address,
                user_agent,
                expires_at: expiresAt,
                location_shared: !!(latitud && longitud),
            });

        if (incidentError) {
            console.error("[sos] Error creando incidente:", incidentError);
        } else {
            incidentUrl = `https://rescue-chip.com/emergencia/${incidentToken}`;
            console.log(`[sos] Incidente creado: ${incidentUrl}`);
        }

        await logAuditEvent({
            userId: user.id,
            action: "emergency_access",
            entityType: "chip",
            entityId: chipData.folio,
            ipAddress: ip_address,
            userAgent: user_agent,
            metadata: { latitud, longitud, incidentToken, trigger: "sos_app" },
        });

        // ── 7. LÓGICA DE NOTIFICACIONES (EMAIL, PUSH, SMS) ──
        const userName = profileData.full_name || "Usuario";
        const contacts: EmergencyContact[] = Array.isArray(profileData.emergency_contacts)
            ? (profileData.emergency_contacts as EmergencyContact[])
            : [];

        const contactEmails = contacts
            .filter((c) => c.email && typeof c.email === "string" && c.email.trim() !== "")
            .map((c) => (c.email as string).trim());

        // Email del dueño
        let ownerEmail: string | null = user.email || null;
        if (!ownerEmail && profileData.user_id) {
            const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(profileData.user_id);
            if (userData?.user?.email) {
                ownerEmail = userData.user.email;
            } else {
                console.error("[sos] No se pudo obtener el email del dueño via Auth Admin.", userError);
            }
        }

        const mapsLink = latitud && longitud
            ? `<a href="https://www.google.com/maps?q=${latitud},${longitud}">Ver Ubicación en Google Maps</a>`
            : "Ubicación GPS no proporcionada/detectada.";

        const fechaStr = new Date().toLocaleString("es-MX", {
            timeZone: "America/Mexico_City",
            dateStyle: "short",
            timeStyle: "short",
        });

        const emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #e11d48; border-radius: 10px;">
                <h2 style="color: #e11d48; margin-top: 0; text-align: center;">⚠️ ALERTA DE EMERGENCIA ⚠️</h2>
                <h3 style="color: #333; text-align: center;">El RescueChip de ${userName} activó una alerta SOS</h3>
                
                ${incidentUrl ? `
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${incidentUrl}" style="display: inline-block; background-color: #e11d48; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                        Ver instrucciones y datos médicos
                    </a>
                    <p style="color: #999; font-size: 12px; margin-top: 8px;">Enlace válido por 24 horas</p>
                </div>` : ""}

                <p style="font-size: 16px;">El dispositivo con folio <strong>${chipData.folio}</strong> perteneciente a <strong>${userName}</strong> activó una alerta de emergencia SOS desde la app.</p>
                
                <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <ul style="color: #991b1b; margin-bottom: 0;">
                        <li><strong>Tipo de Alerta:</strong> Botón SOS (Activado por el usuario)</li>
                        <li><strong>Fecha y Hora:</strong> ${fechaStr}</li>
                        <li><strong>Ubicación Aproximada:</strong> ${mapsLink}</li>
                        <li><strong>Dirección IP:</strong> ${ip_address}</li>
                        <li><strong>Dispositivo:</strong> ${user_agent}</li>
                    </ul>
                </div>
                
                <p style="color: #555; font-size: 14px; text-align: center;">Si NO te encuentras en una emergencia, por favor contacta inmediatamente a soporte:</p>
                <p style="text-align: center;"><a href="mailto:contacto@rescue-chip.com" style="color: #e11d48; font-weight: bold;">contacto@rescue-chip.com</a></p>
            </div>
        `;

        const allEmailsToNotify = ["contacto@rescue-chip.com"];
        if (ownerEmail) allEmailsToNotify.push(ownerEmail);
        if (contactEmails.length > 0) allEmailsToNotify.push(...contactEmails);

        // De-duplicate emails
        const uniqueEmails = Array.from(new Set(allEmailsToNotify));

        if (uniqueEmails.length > 0) {
            try {
                await transporter.sendMail({
                    from: "RescueChip <contacto@rescue-chip.com>",
                    replyTo: "contacto@rescue-chip.com",
                    to: uniqueEmails.join(", "),
                    subject: "⚠️ ALERTA: Un chip RescueChip activó una emergencia SOS",
                    html: emailHtml,
                });
                console.log(`[sos] Notificación de emergencia enviada a: ${uniqueEmails.join(", ")}`);
            } catch (mailError) {
                console.error("[sos] Error enviando email de emergencia:", mailError);
            }
        } else {
            console.log("[sos] No hay emails para notificar (ni de dueño ni de contactos).");
        }

        // --- PUSH PRIMERO, SMS SOLO SI FALLA PUSH ---
        const plainLocation = latitud && longitud
            ? `https://maps.google.com/?q=${latitud},${longitud}`
            : "No disponible";
        const textMessageBody = incidentUrl
            ? `⚠️ RESCUECHIP EMERGENCIA: ${userName} necesita ayuda. GPS: ${plainLocation}. Instrucciones: ${incidentUrl}`
            : `⚠️ RESCUECHIP EMERGENCIA: ${userName} necesita ayuda. GPS: ${plainLocation}. Llama al 911.`;

        const pushTitle = "⚠️ Alerta de Emergencia RescueChip";
        const pushData: Record<string, unknown> = { incidentUrl: incidentUrl || null, tipo: "emergencia" };

        const ownerPhones: string[] = [];
        if (user.phone) {
            ownerPhones.push(user.phone);
        } else if (profileData.user_id) {
            const { data: userData } = await supabaseAdmin.auth.admin.getUserById(profileData.user_id);
            if (userData?.user?.phone) {
                ownerPhones.push(userData.user.phone);
            }
        }
        if (ownerPhones.length === 0 && profileData.phone) {
            ownerPhones.push(profileData.phone);
        }

        const notifyTargets: NotifyTarget[] = [];

        if (ownerEmail || ownerPhones.length > 0) {
            notifyTargets.push({ email: ownerEmail || undefined, phone: ownerPhones[0] || undefined });
        }
        contacts.forEach((c) => {
            if ((c.phone && c.phone.trim() !== "") || (c.email && c.email.trim() !== "")) {
                notifyTargets.push({
                    email: c.email && c.email.trim() !== "" ? c.email.trim() : undefined,
                    phone: c.phone && c.phone.trim() !== "" ? c.phone.trim() : undefined,
                });
            }
        });

        const notificationPromises = notifyTargets.map(async (target) => {
            const pushSuccess = await intentarPush(
                { email: target.email, phone: target.phone },
                pushTitle,
                textMessageBody,
                pushData
            );

            if (pushSuccess) {
                console.log(`[sos Push] Enviado exitosamente a ${target.email || target.phone}`);
                return;
            }

            if (!target.phone) return;
            const formattedPhone = formatStoredPhone(target.phone);
            console.log(`[sos Twilio] Push falló, enviando SMS a: ${formattedPhone}`);
            try {
                await twilioClient.messages.create({
                    body: textMessageBody,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: formattedPhone,
                });
                console.log(`[sos Twilio SMS] Enviado exitosamente a ${formattedPhone}`);
            } catch (smsError: unknown) {
                const errMsg = smsError instanceof Error ? smsError.message : String(smsError);
                console.error(`[sos Twilio SMS Error] Falló el envío a ${formattedPhone}:`, errMsg);
            }
        });

        await Promise.all(notificationPromises);

        // Notificación push silenciosa omitida intencionalmente:
        // Quien presiona el botón SOS es el propio dueño desde su app, y el Modo Viaje
        // se activa localmente en el dispositivo.

        return NextResponse.json({ success: true, incidentToken });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Error interno del servidor";
        console.error("[sos] Error en /api/sos:", error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
