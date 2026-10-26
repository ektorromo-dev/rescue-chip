import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/auth-request';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 1. Bearer obligatorio
    const userAuth = await getUserFromRequest(req);
    if (!userAuth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();

    // 2. Buscar perfil del usuario
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', userAuth.userId)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ incidente: null });
    }

    // 3. Regresar el incidente más reciente con expires_at > now() y status distinto de 'closed'
    const nowIso = new Date().toISOString();
    const { data: incidente, error: incError } = await supabaseAdmin
      .from('incidentes')
      .select('token, created_at, expires_at, familiar_en_camino, en_camino_por, atendido, atendido_at, atendido_por, status')
      .eq('profile_id', profile.id)
      .gt('expires_at', nowIso)
      .neq('status', 'closed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (incError || !incidente) {
      return NextResponse.json({ incidente: null });
    }

    return NextResponse.json({
      incidente: {
        token: incidente.token,
        created_at: incidente.created_at,
        expires_at: incidente.expires_at,
        familiar_en_camino: incidente.familiar_en_camino ?? false,
        en_camino_por: incidente.en_camino_por ?? null,
        atendido: incidente.atendido ?? false,
        atendido_at: incidente.atendido_at ?? null,
        atendido_por: incidente.atendido_por ?? null,
      },
    });
  } catch (err: unknown) {
    console.error('incidentes/activo error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
