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

    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // 2. Buscar perfil del usuario
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .eq('user_id', userAuth.userId)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 403 });
    }

    // 3. Buscar incidente
    const { data: incidente, error: incError } = await supabaseAdmin
      .from('incidentes')
      .select('id, token, profile_id, status, expires_at')
      .eq('token', token)
      .maybeSingle();

    if (incError || !incidente) {
      return NextResponse.json({ error: 'Incidente no encontrado' }, { status: 404 });
    }

    // 4. Verifica que pertenezca al perfil del usuario (403 si no)
    if (incidente.profile_id !== profile.id) {
      return NextResponse.json({ error: 'No autorizado para cerrar este incidente' }, { status: 403 });
    }

    // 5. Verifica que esté activo (410 si no)
    const isExpired = new Date(incidente.expires_at) <= new Date();
    const isClosed = incidente.status === 'closed';
    if (isExpired || isClosed) {
      return NextResponse.json({ error: 'El incidente ya no está activo' }, { status: 410 });
    }

    // 6. Actualiza status = 'closed', closed_at = now(), expires_at = now()
    const nowIso = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from('incidentes')
      .update({
        status: 'closed',
        closed_at: nowIso,
        expires_at: nowIso,
      })
      .eq('id', incidente.id);

    if (updateError) {
      console.error('Error cerrando incidente:', updateError);
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }

    // 7. Notifica con notificarActualizacionIncidente, excluyendo el correo del rider
    const primerNombreRider = profile.full_name?.trim()
      ? profile.full_name.trim().split(/\s+/)[0]
      : 'El rider';

    const cuerpo = `${primerNombreRider} cerró la alerta. Ya no se comparte su ubicación.`;
    const smsTexto = `✅ ${primerNombreRider} está bien. ${cuerpo}`;

    await notificarActualizacionIncidente({
      profileId: profile.id,
      excluirEmail: userAuth.email,
      titulo: `✅ ${primerNombreRider} está bien`,
      cuerpo,
      smsTexto,
      emailAsunto: `✅ ${primerNombreRider} está bien — Alerta de emergencia cerrada`,
      emailTexto: cuerpo,
      data: {
        tipo: 'incidente_cerrado',
        incidentToken: incidente.token,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('incidentes/cerrar error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
