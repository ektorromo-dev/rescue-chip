import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
    }

    // Buscar incidente
    const { data: incidente, error: fetchError } = await supabaseAdmin
      .from('incidentes')
      .select('id, expires_at')
      .eq('token', token)
      .single();

    if (fetchError || !incidente) {
      return NextResponse.json({ error: 'Incidente no encontrado' }, { status: 404 });
    }

    // Verificar que no haya expirado
    if (new Date(incidente.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Incidente expirado' }, { status: 410 });
    }

    // Marcar que un familiar va en camino
    const { error: updateError } = await supabaseAdmin
      .from('incidentes')
      .update({
        familiar_en_camino: true,
        familiar_en_camino_at: new Date().toISOString(),
      })
      .eq('id', incidente.id);

    if (updateError) {
      console.error('Error actualizando incidente:', updateError);
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('en-camino error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
