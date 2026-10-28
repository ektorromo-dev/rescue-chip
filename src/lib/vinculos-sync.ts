import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Busca invitaciones pendientes vigentes para el email dado,
 * excluyendo perfiles donde el rider sea el mismo usuario,
 * y las marca como aceptadas vinculando el user_id.
 */
export async function sincronizarInvitacionesPendientesPorEmail(
  userId: string,
  email: string
): Promise<number> {
  const supabaseAdmin = createAdminClient();
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Obtener perfiles del usuario para no aceptar auto-invitaciones
  const { data: userProfiles } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("user_id", userId);

  const ownProfileIds = new Set((userProfiles || []).map((p) => p.id));

  // 2. Buscar invitaciones 'pending' vigentes
  const { data: invites, error } = await supabaseAdmin
    .from("contact_invitations")
    .select("id, inviter_profile_id, contact_email")
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString());

  if (error || !invites) {
    console.error("[vinculos-sync] Error consultando invitaciones:", error);
    return 0;
  }

  const matchingInvites = invites.filter(
    (inv) =>
      inv.contact_email &&
      inv.contact_email.trim().toLowerCase() === normalizedEmail &&
      !ownProfileIds.has(inv.inviter_profile_id)
  );

  if (matchingInvites.length === 0) {
    return 0;
  }

  const idsToUpdate = matchingInvites.map((inv) => inv.id);
  const now = new Date().toISOString();

  const { error: updateError } = await supabaseAdmin
    .from("contact_invitations")
    .update({
      status: "accepted",
      linked_user_id: userId,
      accepted_at: now,
    })
    .in("id", idsToUpdate);

  if (updateError) {
    console.error("[vinculos-sync] Error actualizando invitaciones:", updateError);
    return 0;
  }

  return idsToUpdate.length;
}
