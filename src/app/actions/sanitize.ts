'use server';

import sanitizeHtml from 'sanitize-html';
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { logAuditEvent } from "@/lib/audit";
import { randomBytes } from 'crypto';

function generarTokenInvitacion(): string {
    return randomBytes(16).toString('hex');
}

export async function updateProfileSafe(profileId: string, data: Record<string, any>) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("Autenticación inválida o sesión expirada.");
    }

    // VALIDACIÓN EXPLÍCITA DE OWNERSHIP EN EL SERVIDOR
    const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', profileId)
        .single();

    if (profileCheckError || !existingProfile) {
        throw new Error("El perfil no existe.");
    }

    if (existingProfile.user_id !== user.id) {
        throw new Error("Violación de seguridad: No tienes permisos para modificar este perfil.");
    }

    // Generar objeto sanitizado
    const sanitizedData = await sanitizeProfileInput(data);

    // Actualizar directamente desde el servidor
    const { error: updateError } = await supabase
        .from('profiles')
        .update(sanitizedData)
        .eq('id', profileId);

    if (updateError) {
        throw new Error("Error en BD al guardar: " + updateError.message);
    }

    // Generar invitaciones de contacto automáticamente si hay contactos nuevos
    if (sanitizedData.emergency_contacts && Array.isArray(sanitizedData.emergency_contacts)) {
        for (const contacto of sanitizedData.emergency_contacts) {
            try {
                const phone = contacto.phone ? String(contacto.phone).trim() : null;
                const email = contacto.email ? String(contacto.email).trim() : null;

                if (!phone && !email) continue;

                const contactName = contacto.name ? String(contacto.name).trim() : null;
                let checkQuery = supabase
                    .from('contact_invitations')
                    .select('id')
                    .eq('inviter_profile_id', profileId)
                    .eq('contact_name', contactName);

                if (phone && email) {
                    checkQuery = checkQuery.or(`contact_phone.eq.${phone},contact_email.eq.${email}`);
                } else if (phone) {
                    checkQuery = checkQuery.eq('contact_phone', phone);
                } else if (email) {
                    checkQuery = checkQuery.eq('contact_email', email);
                }

                const { data: existingInvites, error: checkError } = await checkQuery.limit(1);

                if (checkError) {
                    console.error('[contact-invitations] Error verificando invitación existente:', checkError);
                    continue;
                }

                if (!existingInvites || existingInvites.length === 0) {
                    const { error: inviteError } = await supabase
                        .from('contact_invitations')
                        .insert({
                            inviter_profile_id: profileId,
                            contact_name: contacto.name,
                            contact_phone: contacto.phone || null,
                            contact_email: contacto.email || null,
                            token: generarTokenInvitacion(),
                        });

                    if (inviteError) {
                        console.error('[contact-invitations] Error creando invitación:', inviteError);
                    }
                }
            } catch (inviteLoopErr) {
                console.error('[contact-invitations] Error procesando invitación de contacto:', inviteLoopErr);
            }
        }
    }

    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || headersList.get('x-real-ip') || '127.0.0.1';
    const userAgent = headersList.get('user-agent') || 'Unknown';

    await logAuditEvent({
        userId: user.id,
        action: 'profile_update',
        entityType: 'profile',
        entityId: profileId,
        ipAddress: ip,
        userAgent: userAgent,
        metadata: { updatedFields: Object.keys(sanitizedData) }
    });

    return { success: true };
}

export async function sanitizeProfileInput(data: Record<string, any>) {
    const cleanData: Record<string, any> = {};

    // Configuración estricta de sanitize-html: Nada de tags permitidos (texto plano)
    const sanitizeOpts = {
        allowedTags: [],
        allowedAttributes: {}
    };

    // Helper para truncar a un máximo
    const cleanAndTruncate = (value: any, maxLength: number) => {
        if (!value || typeof value !== 'string') return value;
        const sanitized = sanitizeHtml(value, sanitizeOpts);
        return sanitized.substring(0, maxLength).trim();
    };

    // Procesamos todos los campos de texto típicos de un perfil
    // Limites lógicos
    if (data.full_name !== undefined) cleanData.full_name = cleanAndTruncate(data.full_name, 100);
    if (data.blood_type !== undefined) cleanData.blood_type = cleanAndTruncate(data.blood_type, 20);
    if (data.allergies !== undefined) cleanData.allergies = cleanAndTruncate(data.allergies, 500);
    if (data.medications !== undefined) cleanData.medications = cleanAndTruncate(data.medications, 500);
    if (data.chronic_conditions !== undefined) cleanData.chronic_conditions = cleanAndTruncate(data.chronic_conditions, 500);
    if (data.additional_notes !== undefined) cleanData.additional_notes = cleanAndTruncate(data.additional_notes, 1000);
    if (data.google_maps_link !== undefined) cleanData.google_maps_link = cleanAndTruncate(data.google_maps_link, 300);
    if (data.nss !== undefined) cleanData.nss = cleanAndTruncate(data.nss, 50);

    // Iteramos los contactos de emergencia sanitizando strings
    if (Array.isArray(data.emergency_contacts)) {
        cleanData.emergency_contacts = data.emergency_contacts.map(contact => ({
            name: cleanAndTruncate(contact.name, 100),
            phone: cleanAndTruncate(contact.phone, 20),
            email: cleanAndTruncate(contact.email, 100)
        }));
    }

    // Copiamos el resto de valores numéricos/booleanos intactos
    for (const key in data) {
        if (!(key in cleanData)) {
            // Re-chequeo rápido por si se coló un string
            if (typeof data[key] === 'string') {
                cleanData[key] = cleanAndTruncate(data[key], 1000); // fallback genérico
            } else {
                cleanData[key] = data[key];
            }
        }
    }

    return cleanData;
}

export async function sanitizePlainText(value: string | undefined | null, maxLength = 100): Promise<string> {
    if (!value || typeof value !== 'string') return '';
    const sanitized = sanitizeHtml(value, {
        allowedTags: [],
        allowedAttributes: {}
    });
    return sanitized.substring(0, maxLength).trim();
}
