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

    if (!token || typeof token !== 'string' || !TOKEN_REGEX.test(token)) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
    }

    // 1. Buscar incidente
    const { data: incidente, error: fetchError } = await supabaseAdmin
      .from('incidentes')
      .select('id, token, expires_at, status, profile_id, chip_folio, familiar_en_camino, en_camino_por')
      .eq('token', token)
      .maybeSingle();

    if (fetchError || !incidente) {
      return NextResponse.json({ error: 'Incidente no encontrado' }, { status: 404 });
    }

    // 2. 410 si el incidente venció (expires_at <= now) o status = 'closed'
    const isExpired = new Date(incidente.expires_at) <= new Date();
    const isClosed = incidente.status === 'closed';
    if (isExpired || isClosed) {
      return NextResponse.json({ error: 'Incidente expirado o cerrado' }, { status: 410 });
    }

    // Resolver nombre del actor
    const nombre = await resolverNombreActor(actorUserId, incidente.profile_id ?? '');

    // Si ya se marcó antes, retornar sin volver a notificar (evitar spam)
    if (incidente.familiar_en_camino) {
      return NextResponse.json({
        ok: true,
        already: true,
        en_camino_por: incidente.en_camino_por || nombre,
      });
    }

    // 3. Guardar en_camino_por (solo si está vacío), familiar_en_camino y familiar_en_camino_at
    const enCaminoPor = incidente.en_camino_por || nombre;
    const { error: updateError } = await supabaseAdmin
      .from('incidentes')
      .update({
        familiar_en_camino: true,
        familiar_en_camino_at: new Date().toISOString(),
        en_camino_por: enCaminoPor,
      })
      .eq('id', incidente.id);

    if (updateError) {
      console.error('Error actualizando incidente:', updateError);
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }

    // 4. Notificar a contactos y accidentado con notificarActualizacionIncidente, excluyendo al actor
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

      const mensaje = `${nombre} va en camino con ${primerNombreRider}.`;
      await notificarActualizacionIncidente({
        profileId: incidente.profile_id,
        excluirEmail: actorEmail,
        titulo: `🚗 ${nombre} va en camino`,
        cuerpo: mensaje,
        smsTexto: mensaje,
        emailAsunto: `🚗 ${nombre} va en camino — RescueChip`,
        emailTexto: mensaje,
        data: {
          tipo: 'incidente_actualizado',
          incidentToken: incidente.token,
        },
      });
    }

    return NextResponse.json({ ok: true, en_camino_por: enCaminoPor });
  } catch (err: unknown) {
    console.error('en-camino error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
