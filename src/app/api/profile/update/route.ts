import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeProfileInput } from "@/app/actions/sanitize";
import { logAuditEvent } from "@/lib/audit";

const ALLOWED_FIELDS = [
    "full_name",
    "location",
    "age",
    "blood_type",
    "allergies",
    "medical_conditions",
    "important_medications",
    "emergency_contacts",
    "organ_donor",
    "is_motorcyclist",
    "additional_notes",
    "hospital_name",
    "google_maps_link",
    "medical_system",
    "aseguradora",
    "numero_poliza",
    "tipo_seguro",
    "nombre_asegurado",
    "vigencia_poliza",
    "telefono_aseguradora",
    "nss",
    "numero_afiliacion",
    "clinica_asignada",
    "curp_seguro",
] as const;

interface EmergencyContactItem {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    [key: string]: unknown;
}

function generarTokenInvitacion(): string {
    return randomBytes(16).toString("hex");
}

export async function POST(req: NextRequest) {
    try {
        const supabaseAdmin = createAdminClient();

        // 1. Validar Bearer token en el header "authorization"
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

        // 2. Buscar el perfil del usuario
        const { data: profile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (profileError || !profile) {
            return NextResponse.json({ error: "Perfil no encontrado" }, { status: 403 });
        }

        // 3. Recibir el body como JSON
        const rawBody: unknown = await req.json();
        const body = typeof rawBody === "object" && rawBody !== null
            ? (rawBody as Record<string, unknown>)
            : {};

        // 4. Filtrar el body a SOLO los campos permitidos
        const filteredData: Record<string, unknown> = {};
        for (const field of ALLOWED_FIELDS) {
            if (field in body && body[field] !== undefined) {
                filteredData[field] = body[field];
            }
        }

        // 5. Sanitizar datos filtrados
        const sanitizedData = await sanitizeProfileInput(filteredData);

        // 6. Actualizar perfil en Supabase
        const { error: updateError } = await supabaseAdmin
            .from("profiles")
            .update(sanitizedData)
            .eq("id", profile.id);

        if (updateError) {
            throw new Error("Error en BD al guardar: " + updateError.message);
        }

        // 7. Generar invitaciones de contacto automáticamente si hay contactos
        if (sanitizedData.emergency_contacts && Array.isArray(sanitizedData.emergency_contacts)) {
            for (const contacto of sanitizedData.emergency_contacts as EmergencyContactItem[]) {
                try {
                    const phone = contacto.phone ? String(contacto.phone).trim() : null;
                    const email = contacto.email ? String(contacto.email).trim() : null;

                    if (!phone && !email) continue;

                    const contactName = contacto.name ? String(contacto.name).trim() : null;
                    let checkQuery = supabaseAdmin
                        .from("contact_invitations")
                        .select("id")
                        .eq("inviter_profile_id", profile.id)
                        .eq("contact_name", contactName);

                    if (phone && email) {
                        checkQuery = checkQuery.or(`contact_phone.eq.${phone},contact_email.eq.${email}`);
                    } else if (phone) {
                        checkQuery = checkQuery.eq("contact_phone", phone);
                    } else if (email) {
                        checkQuery = checkQuery.eq("contact_email", email);
                    }

                    const { data: existingInvites, error: checkError } = await checkQuery.limit(1);

                    if (checkError) {
                        console.error("[contact-invitations] Error verificando invitación existente:", checkError);
                        continue;
                    }

                    if (!existingInvites || existingInvites.length === 0) {
                        const { error: inviteError } = await supabaseAdmin
                            .from("contact_invitations")
                            .insert({
                                inviter_profile_id: profile.id,
                                contact_name: contacto.name,
                                contact_phone: contacto.phone || null,
                                contact_email: contacto.email || null,
                                token: generarTokenInvitacion(),
                            });

                        if (inviteError) {
                            console.error("[contact-invitations] Error creando invitación:", inviteError);
                        }
                    }
                } catch (inviteLoopErr) {
                    console.error("[contact-invitations] Error procesando invitación de contacto:", inviteLoopErr);
                }
            }
        }

        // 8. Registrar evento de auditoría
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "127.0.0.1";
        const userAgent = req.headers.get("user-agent") || "Unknown";

        await logAuditEvent({
            userId: user.id,
            action: "profile_update",
            entityType: "profile",
            entityId: profile.id,
            ipAddress: ip,
            userAgent: userAgent,
            metadata: { updatedFields: Object.keys(sanitizedData) },
        });

        // 9. Responder éxito
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        // 10. Manejo de error 500
        const message = error instanceof Error ? error.message : "Error interno del servidor";
        console.error("[profile/update] Error:", error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
