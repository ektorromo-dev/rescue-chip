import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitActivate } from "@/lib/ratelimit";

export async function GET(request: NextRequest) {
    // 1. PRIMERO rate limiting
    const folio = request.nextUrl.searchParams.get('folio');
    if (folio) {
        const identifier = `activate:${folio.trim()}`;
        const { success } = await rateLimitActivate.limit(identifier);
        if (!success) {
            return NextResponse.json({ error: 'Limite de solicitudes alcanzado. Intenta en 1 hora.' }, { status: 429 });
        }
    } else {
        return NextResponse.json({ error: 'No se envió un folio válido.' }, { status: 400 });
    }

    // 2. DESPUÉS validar si el folio existe en la base de datos
    // Usa service role porque la policy "Allow public read access to chips" fue eliminada por seguridad.
    const supabase = createAdminClient();
    const cleanFolio = folio.trim();

    const { data: chip, error: chipError } = await supabase
        .from('chips')
        .select('*')
        .ilike('folio', cleanFolio)
        .maybeSingle();

    if (chipError || !chip) {
        return NextResponse.json({ error: "Este folio no es válido o ya fue activado." }, { status: 404 });
    }

    const isActivatedStr = chip.status === 'activado';
    const isActivatedBool = chip.activated === true || String(chip.activated).toLowerCase() === 'true';

    if ((isActivatedStr && isActivatedBool) || (chip.status !== 'disponible' && chip.status !== 'vendido')) {
        return NextResponse.json({ 
            error: "Este folio no es válido o ya fue activado.",
            alreadyActivated: chip.activated === true,
            folio: chip.folio
        }, { status: 400 });
    }

    return NextResponse.json({ success: true, chip });
}
