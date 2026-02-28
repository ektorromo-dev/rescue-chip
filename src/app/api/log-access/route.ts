import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import twilio from "twilio";
import { rateLimitSendEmergency } from "@/lib/ratelimit";

// Twilio Setup
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { chip_folio, tipo, latitud, longitud, session_token } = body;

        if (!chip_folio || !tipo || !session_token) {
            return NextResponse.json({ error: "Faltan datos requeridos." }, { status: 400 });
        }

        const ip_address = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "Desconocida";
        const user_agent = req.headers.get("user-agent") || "Desconocido";

        // 1. Insertar el log de acceso
        const { error: insertError } = await supabase
            .from("chip_accesos")
            .insert({
                chip_folio,
                tipo,
                latitud,
                longitud,
                ip_address,
                user_agent,
                session_token
            });

        if (insertError) {
            console.error("Error al registrar el acceso:", insertError);
            // No bloqueamos todo por fallar el log, pero advertimos
        }

        // 2. Si es emergencia, enviar notificación
        if (tipo === "emergencia") {
            // Evaluamos rate limit usando el chip_folio como identificador
            const { success: rateLimitSuccess } = await rateLimitSendEmergency.limit(chip_folio.toLowerCase());

            if (!rateLimitSuccess) {
                console.warn(`Rate limit excedido para emergencias del chip: ${chip_folio}`);
                return NextResponse.json({ error: "Límite de notificaciones de emergencia alcanzado para hoy." }, { status: 429 });
            }

            // Obtener el ID de usuario del dueño de este chip
            const { data: chipData } = await supabase
                .from("chips")
                .select("id")
                .ilike("folio", chip_folio)
                .single();

            if (chipData) {
                const { data: profileData } = await supabase
                    .from("profiles")
                    .select("user_id, full_name, emergency_contacts")
                    .eq("chip_id", chipData.id)
                    .single();

                if (profileData) {
                    const userName = profileData.full_name || 'Usuario';
                    const contacts = profileData.emergency_contacts || [];
                    const contactEmails = contacts
                        .filter((c: any) => c.email && c.email.trim() !== '')
                        .map((c: any) => c.email.trim());

                    // Buscar el email del DUEÑO en auth.users (requiere Service Role)
                    let ownerEmail = null;
                    if (profileData.user_id) {
                        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profileData.user_id);
                        if (userData && userData.user && userData.user.email) {
                            ownerEmail = userData.user.email;
                        } else {
                            console.error("No se pudo obtener el email del dueño del chip via Auth Admin.", userError);
                        }
                    }

                    const mapsLink = latitud && longitud
                        ? `<a href="https://www.google.com/maps?q=${latitud},${longitud}">Ver Ubicación en Google Maps</a>`
                        : "Ubicación GPS no proporcionada/detectada.";

                    const fechaStr = new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City", dateStyle: 'short', timeStyle: 'short' });

                    const emailHtml = `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #e11d48; border-radius: 10px;">
                            <h2 style="color: #e11d48; margin-top: 0; text-align: center;">⚠️ ALERTA DE EMERGENCIA ⚠️</h2>
                            <h3 style="color: #333; text-align: center;">El RescueChip de ${userName} fue escaneado</h3>
                            
                            <p style="font-size: 16px;">El dispositivo con folio <strong>${chip_folio}</strong> perteneciente a <strong>${userName}</strong> fue escaneado.</p>
                            
                            <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <ul style="color: #991b1b; margin-bottom: 0;">
                                    <li><strong>Tipo de Escaneo:</strong> Emergencia Real</li>
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

                    const allEmailsToNotify = [];
                    if (ownerEmail) allEmailsToNotify.push(ownerEmail);
                    if (contactEmails.length > 0) allEmailsToNotify.push(...contactEmails);

                    // De-duplicate emails
                    const uniqueEmails = Array.from(new Set(allEmailsToNotify));

                    if (uniqueEmails.length > 0) {
                        try {
                            await transporter.sendMail({
                                from: 'RescueChip <contacto@rescue-chip.com>',
                                replyTo: 'contacto@rescue-chip.com',
                                to: uniqueEmails.join(', '),
                                subject: "⚠️ ALERTA: Un chip RescueChip fue escaneado en una emergencia",
                                html: emailHtml,
                            });
                            console.log(`Notificación de emergencia enviada a: ${uniqueEmails.join(', ')}`);
                        } catch (mailError) {
                            console.error("Error enviando email de emergencia:", mailError);
                        }
                    } else {
                        console.log("No hay emails para notificar (ni de dueño ni de contactos).");
                    }

                    // --- TWILIO SMS & WHATSAPP INTEGRATION ---
                    // Helper function to format Mexican phone numbers robustly
                    const formatMexicanPhone = (phoneRaw: string): string => {
                        let phone = phoneRaw.replace(/\D/g, ""); // strip non-numeric
                        if (phone.length === 12 && phone.startsWith("52")) {
                            return `+${phone}`;
                        } else if (phone.length === 10) {
                            return `+52${phone}`; // Force country string
                        } else if (!phone.startsWith("+52")) {
                            return `+52${phone}`; // best effort fallback
                        }
                        return `+${phone}`;
                    };

                    const plainLocation = latitud && longitud
                        ? `https://maps.google.com/?q=${latitud},${longitud}`
                        : "No disponible";

                    // Shortened to < 160 characters for WhatsApp/SMS compatibility
                    const textMessageBody = `⚠️ RESCUECHIP EMERGENCIA: ${userName} necesita ayuda. GPS: ${plainLocation}. Llama al 911.`;

                    const ownerPhones = [];
                    // Extract owner phone if available
                    if (profileData.user_id) {
                        // Normally user phone is in profiles table, let's see if we have phone in auth.users
                        // Instead, profile data might contain a phone or general user profile.
                        // We will just process contacts array in the profile and user. phone if present.
                    }

                    // Extract contact phones
                    const contactPhones = contacts
                        .filter((c: any) => c.phone && c.phone.trim() !== '')
                        .map((c: any) => c.phone.trim());

                    // Find if profile has an owner phone directly natively? 
                    // No direct phone_number field retrieved earlier, 
                    // Let's rely on retrieving the Auth User's phone if configured:
                    if (profileData.user_id) {
                        const { data: userData } = await supabase.auth.admin.getUserById(profileData.user_id);
                        if (userData && userData.user && userData.user.phone) {
                            ownerPhones.push(userData.user.phone);
                        }
                    }

                    const allPhonesToNotify = Array.from(new Set([...ownerPhones, ...contactPhones]));

                    // Trigger notifications concurrently
                    const notificationPromises = allPhonesToNotify.map(async (rawPhone) => {
                        const formattedPhone = formatMexicanPhone(rawPhone);

                        console.log(`[Twilio Pre-Send Check] Procesando SMS para destino: ${formattedPhone}`);

                        // 1) SEND SMS
                        try {
                            await twilioClient.messages.create({
                                body: textMessageBody,
                                from: process.env.TWILIO_PHONE_NUMBER,
                                to: formattedPhone
                            });
                            console.log(`[Twilio SMS] Enviado exitosamente a ${formattedPhone}`);
                        } catch (smsError: any) {
                            console.error(`[Twilio SMS Error] Falló el envío a ${formattedPhone}:`, smsError.message);
                        }

                        // 2) SEND WHATSAPP
                        const waTo = `whatsapp:${formattedPhone}`;
                        console.log(`[Twilio Pre-Send Check] Procesando WhatsApp para destino: ${waTo}`);
                        try {
                            const waFrom = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";
                            await twilioClient.messages.create({
                                body: textMessageBody,
                                from: waFrom,
                                to: waTo
                            });
                            console.log(`[Twilio WA] Enviado exitosamente a ${waTo}`);
                        } catch (waError: any) {
                            console.error(`[Twilio WA Error] Falló el envío a ${waTo}:`, waError.message);
                        }
                    });

                    // Wait for all messages across all phones to finish attempting
                    await Promise.all(notificationPromises);
                }
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Error en log-access:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
