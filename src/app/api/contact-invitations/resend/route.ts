import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { INVITATIONS_ENABLED, sendInvitationEmail, ContactInvitationRecord } from '@/lib/contact-invitations';

export async function POST(req: NextRequest) {
  try {
    // 0. Interruptor de invitaciones
    if (!INVITATIONS_ENABLED) {
      return NextResponse.json(
        { error: 'Vinculación no disponible todavía' },
        { status: 403 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // 1. Validar Bearer token en el header "authorization" (mismo patrón que profile/update)
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Buscar el perfil del usuario autenticado
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 403 });
    }

    // 3. Body: { invitationId: string }
    const rawBody: unknown = await req.json().catch(() => ({}));
    const body =
      typeof rawBody === 'object' && rawBody !== null
        ? (rawBody as Record<string, unknown>)
        : {};

    const invitationId = typeof body.invitationId === 'string' ? body.invitationId.trim() : '';
    if (!invitationId) {
      return NextResponse.json({ error: 'ID de invitación requerido' }, { status: 400 });
    }

    // 4. Buscar la invitación
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('contact_invitations')
      .select('*')
      .eq('id', invitationId)
      .maybeSingle<ContactInvitationRecord>();

    if (inviteError || !invitation) {
      return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 });
    }

    // 5. Validar que la invitación pertenece al perfil del usuario autenticado
    if (invitation.inviter_profile_id !== profile.id) {
      return NextResponse.json(
        { error: 'No autorizado para gestionar esta invitación' },
        { status: 403 }
      );
    }

    // 6. Si status es 'accepted' → 400 "Ya aceptada"
    if (invitation.status === 'accepted') {
      return NextResponse.json({ error: 'Ya aceptada' }, { status: 400 });
    }

    // 7. Si está vencida o cancelada → regenerar token, status = 'pending', expires_at = now + 7 días
    const isExpired =
      invitation.status === 'expired' ||
      (Boolean(invitation.expires_at) && new Date(invitation.expires_at!) < new Date());
    const isCancelled = invitation.status === 'cancelled';

    let activeToken = invitation.token;

    if (isExpired || isCancelled) {
      activeToken = randomBytes(16).toString('hex');
      const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { error: updateError } = await supabaseAdmin
        .from('contact_invitations')
        .update({
          token: activeToken,
          status: 'pending',
          expires_at: newExpiresAt,
          linked_user_id: null,
        })
        .eq('id', invitation.id);

      if (updateError) {
        console.error('[contact-invitations-resend] Error regenerando invitación:', updateError);
        return NextResponse.json(
          { error: 'Error al actualizar la invitación: ' + updateError.message },
          { status: 500 }
        );
      }
    }

    // 8. Si tiene email → reenviar correo
    if (invitation.contact_email && invitation.contact_email.trim() !== '') {
      await sendInvitationEmail(invitation.id);
    }

    // 9. Responder con link
    const link = `https://rescue-chip.com/vincular/${activeToken}`;
    return NextResponse.json({ ok: true, link });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[contact-invitations-resend] Error inesperado:', message);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
