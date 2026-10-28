import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/auth-request';
import { notificarActualizacionIncidente } from '@/lib/incident-notify';

export async function POST(req: NextRequest) {
  try {
    // 1. Bearer obligatorio
    const userAuth = await getUserFromRequest(req);
    if (!userAuth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === 'string' && body.token.trim() ? body.token.trim() : null;

    const supabaseAdmin = createAdminClient();

    // 2. Buscar TODOS los perfiles del usuario
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .eq('user_id', userAuth.userId);

    if (profileError || !profiles || profiles.length === 0) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 403 });
    }

    const profileIds = profiles.map((p) => p.id);

    // 3. Si viene token, verifica que pertenezca a sus perfiles (403 si no)
    if (token) {
      const { data: incidenteToken, error: incError } = await supabaseAdmin
        .from('incidentes')
        .select('id, profile_id')
        .eq('token', token)
        .maybeSingle();

      if (incError || !incidenteToken || !profileIds.includes(incidenteToken.profile_id)) {
        return NextResponse.json({ error: 'No autorizado para cerrar este incidente' }, { status: 403 });
      }
    }

    // 4. Buscar TODOS sus incidentes activos: expires_at > now() y status != 'closed'
    const nowIso = new Date().toISOString();
    const { data: incidentesActivos, error: incActivosError } = await supabaseAdmin
      .from('incidentes')
      .select('id, token, profile_id, created_at')
      .in('profile_id', profileIds)
      .gt('expires_at', nowIso)
      .neq('status', 'closed')
      .order('created_at', { ascending: false });

    if (incActivosError) {
      console.error('Error buscando incidentes activos:', incActivosError);
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }

    // Si no hay ninguno activo, responde 200 { ok: true, cerradas: 0 }
    if (!incidentesActivos || incidentesActivos.length === 0) {
      return NextResponse.json({ ok: true, cerradas: 0 });
    }

    // 5. Cierra TODOS sus incidentes activos
    const idsToClose = incidentesActivos.map((inc) => inc.id);
    const { error: updateError } = await supabaseAdmin
      .from('incidentes')
      .update({
        status: 'closed',
        closed_at: nowIso,
        expires_at: nowIso,
      })
      .in('id', idsToClose);

    if (updateError) {
      console.error('Error cerrando incidentes:', updateError);
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }

    // 6. Notifica UNA sola vez con notificarActualizacionIncidente (usa el token del más reciente que se cerró)
    const masReciente = incidentesActivos[0];
    const perfilAsociado = profiles.find((p) => p.id === masReciente.profile_id) || profiles[0];
    const primerNombreRider = perfilAsociado.full_name?.trim()
      ? perfilAsociado.full_name.trim().split(/\s+/)[0]
      : 'El rider';

    const cuerpo = `${primerNombreRider} cerró la alerta. Ya no se comparte su ubicación.`;
    const smsTexto = `✅ ${primerNombreRider} está bien. ${cuerpo}`;

    await notificarActualizacionIncidente({
      profileId: perfilAsociado.id,
      excluirEmail: userAuth.email,
      titulo: `✅ ${primerNombreRider} está bien`,
      cuerpo,
      smsTexto,
      emailAsunto: `✅ ${primerNombreRider} está bien — Alerta de emergencia cerrada`,
      emailTexto: cuerpo,
      data: {
        tipo: 'incidente_cerrado',
        incidentToken: masReciente.token,
      },
    });

    return NextResponse.json({ ok: true, cerradas: incidentesActivos.length });
  } catch (err: unknown) {
    console.error('incidentes/cerrar error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
