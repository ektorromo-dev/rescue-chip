import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateEmergencyContacts } from "@/lib/contact-validation";
import { getUserFromRequest } from "@/lib/auth-request";
import { syncContactInvitations, EmergencyContactItem } from "@/lib/contact-invitations";

// Inicializamos supabaseAdmin que saltará las políticas RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        // 0. Exigir Bearer token válido y tomar userId exclusivamente del token
        const userAuth = await getUserFromRequest(req);
        if (!userAuth) {
            return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
        }
        const userId = userAuth.userId;

        const body = await req.json();
        const { folio, profileData, consentIp, consentDatosSalud, origen } = body;

        if (!folio || !profileData) {
            return NextResponse.json({ success: false, error: "Datos incompletos para activación." }, { status: 400 });
        }

        // 1. Verificar que el chip con ese folio existe y está libre ('disponible' y activated = false)
        const { data: chip, error: chipError } = await supabaseAdmin
            .from('chips')
            .select('*')
            .ilike('folio', folio)
            .maybeSingle();

        if (chipError || !chip) {
            return NextResponse.json({ success: false, error: "Este folio no existe." }, { status: 404 });
        }

        if (chip.activated === true || String(chip.activated).toLowerCase() === 'true' || chip.status === 'activado') {
            return NextResponse.json({ success: false, error: "El chip no está disponible para activación." }, { status: 409 });
        }

        // 2. Verifica si el usuario ya tiene un perfil existente
        const { data: existingProfiles, error: existingProfileError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1);

        const existingProfile = existingProfiles && existingProfiles.length > 0 
            ? existingProfiles[0] 
            : null;

        if (existingProfileError) {
            console.error("Error verificando perfil existente:", existingProfileError);
            return NextResponse.json({ 
                success: false, 
                error: "Error al verificar perfil existente." 
            }, { status: 500 });
        }

        let insertedProfileData: { id: string };

        if (existingProfile) {
            // Reutiliza el perfil existente en lugar de crear uno nuevo
            insertedProfileData = existingProfile;
        } else {
            // a) Asignar SIEMPRE chip_id del chip actual
            profileData.chip_id = chip.id;

            // 1. IP de consentimiento: si no viene en body, tomar x-forwarded-for o x-real-ip
            const reqIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
            const finalConsentIp = consentIp !== undefined ? consentIp : (profileData.consent_ip ?? reqIp);

            // 2. Consentimiento de datos de salud
            const hasConsentSalud = consentDatosSalud === true || profileData.consentDatosSalud === true || profileData.consent_datos_salud === true;
            const consentDatosSaludAt = hasConsentSalud
                ? (profileData.consent_datos_salud_at || new Date().toISOString())
                : (profileData.consent_datos_salud_at ?? null);

            // 3. Origen app -> consent_version
            const consentVersion = (origen === "app" || profileData.origen === "app")
                ? "v2.0-app"
                : (profileData.consent_version || "v1.0");

            const consentTimestamp = profileData.consent_timestamp || new Date().toISOString();

            // b) Construir el objeto a insertar SOLO con los campos permitidos
            const ALLOWED_PROFILE_FIELDS = [
                "full_name",
                "phone",
                "whatsapp_opted_in",
                "country",
                "sexo",
                "blood_type",
                "age",
                "location",
                "is_motorcyclist",
                "photo_url",
                "allergies",
                "medical_conditions",
                "important_medications",
                "organ_donor",
                "medical_system",
                "sistema_medico",
                "nss",
                "numero_afiliacion",
                "clinica_asignada",
                "curp_seguro",
                "aseguradora",
                "numero_poliza",
                "tipo_seguro",
                "nombre_asegurado",
                "vigencia_poliza",
                "telefono_aseguradora",
                "poliza_url",
                "hospital_name",
                "google_maps_link",
                "additional_notes",
                "insurance_provider",
                "policy_number",
                "emergency_contacts",
                "plan",
            ] as const;

            const profileToInsert: Record<string, unknown> = {};
            for (const field of ALLOWED_PROFILE_FIELDS) {
                if (field in profileData && profileData[field] !== undefined) {
                    profileToInsert[field] = profileData[field];
                }
            }

            // Campos asignados por el servidor
            profileToInsert.user_id = userId;
            profileToInsert.chip_id = chip.id;
            profileToInsert.consent_ip = finalConsentIp;
            profileToInsert.consent_timestamp = consentTimestamp;
            profileToInsert.consent_version = consentVersion;
            if (consentDatosSaludAt) {
                profileToInsert.consent_datos_salud_at = consentDatosSaludAt;
            }

            // Validar contactos de emergencia para perfil nuevo
            const contacts = profileToInsert.emergency_contacts;
            if (!Array.isArray(contacts)) {
                return NextResponse.json({ success: false, error: "Formato de contactos de emergencia inválido." }, { status: 400 });
            }
            const contactValidation = validateEmergencyContacts(contacts, {
                requireEmail: true,
                country: typeof profileToInsert.country === "string" ? profileToInsert.country : undefined,
            });
            if (!contactValidation.ok) {
                return NextResponse.json({ success: false, error: contactValidation.error }, { status: 400 });
            }

            // Crea un perfil nuevo solo si el usuario no tenía ninguno
            const { data: newProfileData, error: profileInsertError } = await supabaseAdmin
                .from('profiles')
                .insert(profileToInsert)
                .select()
                .single();

            if (profileInsertError) {
                console.error("Error insertando perfil:", profileInsertError);
                return NextResponse.json({ 
                    success: false, 
                    error: profileInsertError.message || "Fallo al guardar el perfil médico.",
                    errorCode: profileInsertError.code
                }, { status: 400 });
            }
            insertedProfileData = newProfileData;
        }

        // 3. Update chips SET activated=true, owner_profile_id=profile.id
        const { error: activateError } = await supabaseAdmin
            .from('chips')
            .update({
                status: 'activado',
                activated: true,
                activated_by: userId,
                owner_profile_id: insertedProfileData.id,
                activated_at: new Date().toISOString()
            })
            .eq('id', chip.id);

        if (activateError) {
            console.error("Error activando chip, iniciando rollback:", activateError);
            
            // 4. Si el UPDATE falla: DELETE el profile SOLO si fue recién creado (rollback)
            if (!existingProfile) {
                const { error: rollbackError } = await supabaseAdmin
                    .from('profiles')
                    .delete()
                    .eq('id', insertedProfileData.id);
                if (rollbackError) {
                    console.error("Error crítico durante rollback (perfil huérfano):", rollbackError);
                }
            }
            
            return NextResponse.json({ 
                success: false, 
                error: "Error al activar el chip, se deshizo la creación del perfil." 
            }, { status: 500 });
        }

        // 5. Si es perfil nuevo y se activó con éxito, sincronizar invitaciones a contactos
        if (!existingProfile) {
            try {
                const riderName = profileData?.full_name || "Rider";
                const contacts = Array.isArray(profileData?.emergency_contacts)
                    ? (profileData.emergency_contacts as EmergencyContactItem[])
                    : [];
                await syncContactInvitations(insertedProfileData.id, riderName, contacts);
            } catch (invErr: unknown) {
                console.error("[activate/complete] Error sincronizando invitaciones de contacto:", invErr);
            }
        }

        // 6. Retornar success
        return NextResponse.json({ success: true, profileId: insertedProfileData.id });

    } catch (error: unknown) {
        console.error("Error inesperado en activate complete:", error);
        return NextResponse.json({ success: false, error: "Error interno del servidor." }, { status: 500 });
    }
}
