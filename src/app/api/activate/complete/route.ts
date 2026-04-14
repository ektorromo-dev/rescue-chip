import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Inicializamos supabaseAdmin que saltará las políticas RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { folio, profileData, userId, consentIp } = body;

        if (!folio || !profileData || !userId) {
            return NextResponse.json({ success: false, error: "Datos incompletos para activación." }, { status: 400 });
        }

        // 1. Verificar que el chip con ese folio existe
        const { data: chip, error: chipError } = await supabaseAdmin
            .from('chips')
            .select('*')
            .ilike('folio', folio)
            .maybeSingle();

        if (chipError || !chip) {
            return NextResponse.json({ success: false, error: "Este folio no existe." }, { status: 404 });
        }

        if (chip.activated === true || String(chip.activated).toLowerCase() === 'true' || chip.status === 'activado') {
            return NextResponse.json({ success: false, error: "Este folio ya fue activado." }, { status: 400 });
        }

        // 2. Insert into profiles (El frontend ya envía la data sanitizada incluyendo el chip_id)
        const { data: insertedProfileData, error: profileInsertError } = await supabaseAdmin
            .from('profiles')
            .insert(profileData)
            .select()
            .single();

        if (profileInsertError) {
            console.error("Error insertando perfil:", profileInsertError);
            return NextResponse.json({ 
                success: false, 
                error: profileInsertError.message || "Fallo al guardar el perfil médico.",
                errorCode: profileInsertError.code // Para capturar el 23505 de registro doble en el frontend
            }, { status: 400 });
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
            
            // 4. Si el UPDATE falla: DELETE el profile recién creado (rollback)
            const { error: rollbackError } = await supabaseAdmin
                .from('profiles')
                .delete()
                .eq('id', insertedProfileData.id);

            if (rollbackError) {
                console.error("Error crítico durante rollback (perfil huérfano):", rollbackError);
            }
            
            return NextResponse.json({ 
                success: false, 
                error: "Error al activar el chip, se deshizo la creación del perfil." 
            }, { status: 500 });
        }

        // 5. Retornar success
        return NextResponse.json({ success: true, profileId: insertedProfileData.id });

    } catch (error: any) {
        console.error("Error inesperado en activate complete:", error);
        return NextResponse.json({ success: false, error: "Error interno del servidor." }, { status: 500 });
    }
}
