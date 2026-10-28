import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { intentarPush } from "@/lib/push-notify";

export const MAX_EMERGENCY_CONTACTS = 3;

export interface UsarVinculoQrParams {
  token: string;
  userId: string;
  userEmail: string;
  deviceId?: string | null;
  contactNameOverride?: string | null;
  contactPhoneOverride?: string | null;
}

export interface UsarVinculoQrResult {
  ok: boolean;
  statusHttp: number;
  error?: string;
  mensaje?: string;
  ya_vinculado?: boolean;
  rider_nombre?: string;
  rider_photo_url?: string | null;
}

interface ContactItem {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  [key: string]: unknown;
}

export async function procesarUsoVinculoQr({
  token,
  userId,
  userEmail,
  deviceId,
  contactNameOverride,
  contactPhoneOverride,
}: UsarVinculoQrParams): Promise<UsarVinculoQrResult> {
  const supabaseAdmin = createAdminClient();

  // 1. Buscar token en vinculo_qr_tokens
  const { data: qrRecord, error: qrErr } = await supabaseAdmin
    .from("vinculo_qr_tokens")
    .select("*")
    .eq("token", token.trim())
    .maybeSingle();

  if (qrErr || !qrRecord) {
    return {
      ok: false,
      statusHttp: 410,
      error: "qr_vencido",
      mensaje: "Este código ya venció. Pídele al rider que genere uno nuevo.",
    };
  }

  // 2. Validar que no esté usado y que esté vigente o reservado para este deviceId
  const now = new Date();
  if (qrRecord.usado_at) {
    return {
      ok: false,
      statusHttp: 410,
      error: "qr_vencido",
      mensaje: "Este código ya fue utilizado.",
    };
  }

  const expiresAt = new Date(qrRecord.expires_at);
  const reservadoHasta = qrRecord.reservado_hasta ? new Date(qrRecord.reservado_hasta) : null;
  const isExpired = expiresAt <= now;
  const isReservedForThisDevice = Boolean(
    deviceId &&
      qrRecord.reservado_device_id &&
      qrRecord.reservado_device_id === deviceId &&
      reservadoHasta &&
      reservadoHasta > now
  );

  if (isExpired && !isReservedForThisDevice) {
    return {
      ok: false,
      statusHttp: 410,
      error: "qr_vencido",
      mensaje: "Este código ya venció. Pídele al rider que genere uno nuevo.",
    };
  }

  // 3. Buscar perfil del rider
  const { data: riderProfile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, photo_url, emergency_contacts, user_id")
    .eq("id", qrRecord.rider_profile_id)
    .maybeSingle();

  if (profileErr || !riderProfile) {
    return {
      ok: false,
      statusHttp: 404,
      error: "rider_no_encontrado",
      mensaje: "El perfil del rider no fue encontrado.",
    };
  }

  // 4. No puedes ser tu propio contacto
  if (riderProfile.user_id === userId) {
    return {
      ok: false,
      statusHttp: 400,
      error: "mismo_usuario",
      mensaje: "No puedes ser tu propio contacto.",
    };
  }

  const riderNombre = riderProfile.full_name || "Rider";

  // 5. Verificar si ya existe contact_invitations aceptada para ese rider y ese usuario
  const { data: existingInvite } = await supabaseAdmin
    .from("contact_invitations")
    .select("id")
    .eq("inviter_profile_id", riderProfile.id)
    .eq("linked_user_id", userId)
    .eq("status", "accepted")
    .maybeSingle();

  if (existingInvite) {
    await supabaseAdmin
      .from("vinculo_qr_tokens")
      .update({
        usado_at: new Date().toISOString(),
        usado_por: userId,
        invitation_id: existingInvite.id,
      })
      .eq("id", qrRecord.id);

    return {
      ok: true,
      statusHttp: 200,
      ya_vinculado: true,
      rider_nombre: riderNombre,
      rider_photo_url: riderProfile.photo_url ?? null,
    };
  }

  // 6. Datos del contacto: nombre y teléfono desde user_metadata o perfil propio
  const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(userId);
  const userMeta = authUserData?.user?.user_metadata || {};
  let contactName = (userMeta.nombre || userMeta.full_name || contactNameOverride || "").toString().trim();
  let contactPhone = (userMeta.telefono || userMeta.phone || contactPhoneOverride || "").toString().trim();

  if (!contactName || !contactPhone) {
    const { data: ownProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, phone")
      .eq("user_id", userId)
      .maybeSingle();

    if (ownProfile) {
      if (!contactName && ownProfile.full_name) {
        contactName = ownProfile.full_name.trim();
      }
      if (!contactPhone && ownProfile.phone) {
        contactPhone = ownProfile.phone.trim();
      }
    }
  }

  if (!contactName) {
    contactName = userEmail.split("@")[0] || "Contacto";
  }

  // Si se proporcionaron datos override y no estaban en user_metadata, sincronizar user_metadata
  if ((contactNameOverride && !userMeta.nombre) || (contactPhoneOverride && !userMeta.telefono)) {
    try {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...userMeta,
          nombre: userMeta.nombre || contactName,
          telefono: userMeta.telefono || contactPhone,
          full_name: userMeta.full_name || contactName,
          phone: userMeta.phone || contactPhone,
        },
      });
    } catch (metaErr) {
      console.warn("[vinculo-qr] No se pudo actualizar user_metadata:", metaErr);
    }
  }

  // 7. Límite de contactos en riderProfile.emergency_contacts
  const rawContacts = Array.isArray(riderProfile.emergency_contacts)
    ? (riderProfile.emergency_contacts as ContactItem[])
    : [];

  const normalizedUserEmail = userEmail.trim().toLowerCase();
  const yaEstaEnLista = rawContacts.some((c) => {
    const emailMatch =
      c?.email && typeof c.email === "string" && c.email.trim().toLowerCase() === normalizedUserEmail;
    const phoneMatch =
      contactPhone &&
      c?.phone &&
      typeof c.phone === "string" &&
      c.phone.trim() === contactPhone.trim();
    return emailMatch || phoneMatch;
  });

  if (!yaEstaEnLista && rawContacts.length >= MAX_EMERGENCY_CONTACTS) {
    return {
      ok: false,
      statusHttp: 409,
      error: "limite_contactos",
      mensaje: `${riderNombre} ya tiene el máximo de contactos de emergencia.`,
    };
  }

  // 8. Agregar contacto al final de emergency_contacts si no está ya
  if (!yaEstaEnLista) {
    const updatedContacts = [
      ...rawContacts,
      {
        name: contactName,
        phone: contactPhone || null,
        email: normalizedUserEmail,
      },
    ];

    const { error: updateContactsErr } = await supabaseAdmin
      .from("profiles")
      .update({ emergency_contacts: updatedContacts })
      .eq("id", riderProfile.id);

    if (updateContactsErr) {
      console.error("[vinculo-qr] Error agregando contacto a emergency_contacts:", updateContactsErr);
      return {
        ok: false,
        statusHttp: 500,
        error: "error_servidor",
        mensaje: "Error al actualizar la lista de contactos del rider.",
      };
    }
  }

  // 9. Crear contact_invitations aceptada
  const newInviteToken = randomBytes(16).toString("hex");
  const nowIso = new Date().toISOString();

  const { data: newInvite, error: insertInviteErr } = await supabaseAdmin
    .from("contact_invitations")
    .insert({
      inviter_profile_id: riderProfile.id,
      contact_name: contactName,
      contact_phone: contactPhone || null,
      contact_email: normalizedUserEmail,
      token: newInviteToken,
      status: "accepted",
      linked_user_id: userId,
      accepted_at: nowIso,
      expires_at: nowIso,
    })
    .select("id")
    .single();

  if (insertInviteErr || !newInvite) {
    console.error("[vinculo-qr] Error insertando contact_invitations:", insertInviteErr);
    return {
      ok: false,
      statusHttp: 500,
      error: "error_servidor",
      mensaje: "Error al registrar el vínculo de contacto.",
    };
  }

  // 10. Marcar vinculo_qr_tokens como usado
  await supabaseAdmin
    .from("vinculo_qr_tokens")
    .update({
      usado_at: nowIso,
      usado_por: userId,
      invitation_id: newInvite.id,
    })
    .eq("id", qrRecord.id);

  // 11. Notificar al rider con push
  if (riderProfile.user_id) {
    try {
      const { data: riderUserData } = await supabaseAdmin.auth.admin.getUserById(
        riderProfile.user_id
      );
      const riderEmail = riderUserData?.user?.email ?? undefined;
      const primerNombreContacto = contactName.split(/\s+/)[0] || contactName;

      await intentarPush(
        { email: riderEmail },
        `✅ ${primerNombreContacto} es tu contacto de emergencia`,
        "Ya recibirá tus alertas. Puedes deshacerlo en la pestaña QR.",
        { tipo: "contacto_vinculado" },
        riderProfile.id
      );
    } catch (pushErr) {
      console.error("[vinculo-qr] Error enviando push al rider:", pushErr);
    }
  }

  return {
    ok: true,
    statusHttp: 200,
    rider_nombre: riderNombre,
    rider_photo_url: riderProfile.photo_url ?? null,
  };
}
