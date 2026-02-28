'use server';

import sanitizeHtml from 'sanitize-html';
import { createClient } from "@/lib/supabase/server";

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
    if (data.blood_type !== undefined) cleanData.blood_type = cleanAndTruncate(data.blood_type, 10);
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
