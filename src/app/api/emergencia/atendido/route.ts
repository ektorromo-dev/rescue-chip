import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth-request';
import { notificarActualizacionIncidente, resolverNombreActor } from '@/lib/incident-notify';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TOKEN_REGEX = /^[A-Za-z0-9_-]{8,64}$/;

export async function POST(req: NextRequest) {
  try {
    // 0. Bearer token opcional para identificar al actor
    const userAuth = await getUserFromRequest(req);
    const actorUserId = userAuth?.userId ?? null;
    const actorEmail = userAuth?.email ?? null;

    const body = await req.json();
    const { token } = body;

    // Validación del token con la misma regex que en-camino
    if (!token || typeof token !== 'string' || !TOKEN_REGEX.test(token)) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
    }

    // 1. Buscar incidente
    const { data: incidente, error: fetchError } = await supabaseAdmin
      .from('incidentes')
      .select('id, token, expires_at, status, profile_id, chip_folio, atendido, atendido_por')
      .eq('token', token)
      .maybeSingle();

    if (fetchError || !incidente) {
      return NextResponse.json({ error: 'Incidente no encontrado' }, { status: 404 });
    }

    // 2. 410 si venció o status = 'closed'
    const isExpired = new Date(incidente.expires_at) <= new Date();
    const isClosed = incidente.status === 'closed';
    if (isExpired || isClosed) {
      return NextResponse.json({ error: 'Incidente expirado o cerrado' }, { status: 410 });
    }

    // 3. Si ya estaba atendido = true → 200 { ok: true, atendido_por } SIN volver a notificar
    if (incidente.atendido) {
      return NextResponse.json({ ok: true, atendido_por: incidente.atendido_por });
    }

    // 4. Resolver nombre del actor
    const nombre = await resolverNombreActor(actorUserId, incidente.profile_id ?? '');

    // 5. Actualizar atendido = true, atendido_at = now(), atendido_por = nombre
    const { error: updateError } = await supabaseAdmin
      .from('incidentes')
      .update({
        atendido: true,
        atendido_at: new Date().toISOString(),
        atendido_por: nombre,
      })
      .eq('id', incidente.id);

    if (updateError) {
      console.error('Error actualizando incidente como atendido:', updateError);
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }

    // 6. Notificar con notificarActualizacionIncidente, excluyendo al actor
    if (incidente.profile_id) {
      let primerNombreRider = 'el rider';
      const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('id', incidente.profile_id)
        .maybeSingle();

      if (profileData?.full_name?.trim()) {
        primerNombreRider = profileData.full_name.trim().split(/\s+/)[0];
      }

      const cuerpo = `La alerta sigue activa hasta que ${primerNombreRider} la cierre.`;
      const mensajeSms = `✅ ${nombre} ya está con ${primerNombreRider}. ${cuerpo}`;

      await notificarActualizacionIncidente({
        profileId: incidente.profile_id,
        excluirEmail: actorEmail,
        titulo: `✅ ${nombre} ya está con ${primerNombreRider}`,
        cuerpo,
        smsTexto: mensajeSms,
        emailAsunto: `✅ ${nombre} ya está con ${primerNombreRider} — RescueChip`,
        emailTexto: `✅ ${nombre} ya está con ${primerNombreRider}. ${cuerpo}`,
        data: {
          tipo: 'incidente_actualizado',
          incidentToken: incidente.token,
        },
      });
    }

    return NextResponse.json({ ok: true, atendido_por: nombre });
  } catch (err: unknown) {
    console.error('atendido error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
