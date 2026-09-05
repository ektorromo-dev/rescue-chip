'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export async function aceptarInvitacion(token: string, userId: string) {
  if (!token || !userId) {
    throw new Error('Token o usuario inválido.');
  }

  const supabase = createAdminClient();

  // Validar que la invitación siga pending antes de aceptar (evita 
  // condiciones de carrera o reintentos maliciosos)
  const { data: invitation, error: fetchError } = await supabase
    .from('contact_invitations')
    .select('id, status, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (fetchError || !invitation) {
    throw new Error('Invitación no encontrada.');
  }

  if (invitation.status !== 'pending') {
    throw new Error('Esta invitación ya no está disponible.');
  }

  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    throw new Error('Esta invitación ya expiró.');
  }

  const { error: updateError } = await supabase
    .from('contact_invitations')
    .update({
      status: 'accepted',
      linked_user_id: userId,
      accepted_at: new Date().toISOString(),
    })
    .eq('token', token);

  if (updateError) {
    throw new Error('Error al confirmar la vinculación: ' + updateError.message);
  }

  return { success: true };
}
