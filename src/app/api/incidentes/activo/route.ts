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

    // 2. Buscar TODOS los perfiles del usuario
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', userAuth.userId);

    if (profileError || !profiles || profiles.length === 0) {
      return NextResponse.json({ incidente: null, activos: 0 });
    }

    const profileIds = profiles.map((p) => p.id);

    // 3. Regresar incidentes activos con expires_at > now() y status distinto de 'closed'
    const nowIso = new Date().toISOString();
    const { data: incidentes, error: incError } = await supabaseAdmin
      .from('incidentes')
      .select('token, created_at, expires_at, familiar_en_camino, familiar_en_camino_at, en_camino_por, atendido, atendido_at, atendido_por, status')
      .in('profile_id', profileIds)
      .gt('expires_at', nowIso)
      .neq('status', 'closed')
      .order('created_at', { ascending: false });

    if (incError || !incidentes || incidentes.length === 0) {
      return NextResponse.json({ incidente: null, activos: 0 });
    }

    const masReciente = incidentes[0];

    // Calcular valores más recientes entre TODOS los incidentes activos
    let familiarEnCamino = false;
    let enCaminoPor: string | null = null;
    let latestEnCaminoTime = -1;

    let atendido = false;
    let atendidoAt: string | null = null;
    let atendidoPor: string | null = null;
    let latestAtendidoTime = -1;

    for (const inc of incidentes) {
      if (inc.familiar_en_camino || inc.en_camino_por) {
        familiarEnCamino = true;
        const timeStr = inc.familiar_en_camino_at || inc.created_at;
        const timeVal = timeStr ? new Date(timeStr).getTime() : 0;
        if (timeVal >= latestEnCaminoTime) {
          latestEnCaminoTime = timeVal;
          enCaminoPor = inc.en_camino_por ?? null;
        }
      }

      if (inc.atendido || inc.atendido_por) {
        atendido = true;
        const timeStr = inc.atendido_at || inc.created_at;
        const timeVal = timeStr ? new Date(timeStr).getTime() : 0;
        if (timeVal >= latestAtendidoTime) {
          latestAtendidoTime = timeVal;
          atendidoAt = inc.atendido_at ?? null;
          atendidoPor = inc.atendido_por ?? null;
        }
      }
    }

    return NextResponse.json({
      activos: incidentes.length,
      incidente: {
        token: masReciente.token,
        created_at: masReciente.created_at,
        expires_at: masReciente.expires_at,
        familiar_en_camino: familiarEnCamino,
        en_camino_por: enCaminoPor,
        atendido,
        atendido_at: atendidoAt,
        atendido_por: atendidoPor,
      },
    });
  } catch (err: unknown) {
    console.error('incidentes/activo error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
