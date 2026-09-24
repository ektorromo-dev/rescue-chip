import { createClient } from "@supabase/supabase-js";
import { formatStoredPhone } from "@/lib/phone-utils";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function buscarUserIdPorEmail(email: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.rpc("get_user_id_by_email", {
    lookup_email: email,
  });
  if (error) {
    console.error("[push-notify] Error en get_user_id_by_email:", error);
    return null;
  }
  return data ?? null;
}

async function buscarUserIdPorTelefono(rawPhone: string): Promise<string | null> {
  const formatted = formatStoredPhone(rawPhone);
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("user_id")
    .eq("phone", formatted)
    .maybeSingle();
  return data?.user_id ?? null;
}

async function obtenerPushToken(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("user_push_tokens")
    .select("expo_push_token")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.expo_push_token ?? null;
}

async function enviarPush(
  token: string,
  title: string,
  body: string,
  data: Record<string, unknown>
): Promise<boolean> {
  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ to: token, title, body, data, priority: "high" }),
    });
    const result = await res.json();
    return result?.data?.status === "ok";
  } catch (err) {
    console.error("[push-notify] Error enviando push:", err);
    return false;
  }
}

async function enviarPushSilenciosa(
  token: string,
  data: Record<string, unknown>
): Promise<boolean> {
  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        to: token,
        data,
        priority: "high",
        _contentAvailable: true,
      }),
    });
    const result = await res.json();
    return result?.data?.status === "ok";
  } catch (err) {
    console.error("[push-notify] Error enviando push silenciosa:", err);
    return false;
  }
}

async function buscarUserIdPorInvitacion(
  inviterProfileId: string,
  contacto: { email?: string; phone?: string }
): Promise<string | null> {
  try {
    const rawEmail = contacto.email ? contacto.email.trim() : null;
    const rawPhone = contacto.phone ? contacto.phone.trim() : null;

    if (!rawEmail && !rawPhone) return null;

    let query = supabaseAdmin
      .from("contact_invitations")
      .select("linked_user_id")
      .eq("inviter_profile_id", inviterProfileId)
      .eq("status", "accepted")
      .not("linked_user_id", "is", null);

    const orConditions: string[] = [];

    if (rawEmail) {
      orConditions.push(`contact_email.eq.${rawEmail}`);
    }

    if (rawPhone) {
      const formattedPhone = formatStoredPhone(rawPhone);
      orConditions.push(`contact_phone.eq.${rawPhone}`);
      if (formattedPhone !== rawPhone) {
        orConditions.push(`contact_phone.eq.${formattedPhone}`);
      }
    }

    if (orConditions.length > 0) {
      query = query.or(orConditions.join(","));
    }

    const { data, error } = await query.limit(1).maybeSingle();
    if (error) {
      console.error("[push-notify] Error buscando userId en contact_invitations:", error);
      return null;
    }

    return data?.linked_user_id ?? null;
  } catch (err) {
    console.error("[push-notify] Excepción en buscarUserIdPorInvitacion:", err);
    return null;
  }
}

export async function intentarPush(
  contacto: { email?: string; phone?: string },
  titulo: string,
  cuerpo: string,
  data: Record<string, unknown>,
  inviterProfileId?: string
): Promise<boolean> {
  let userId: string | null = null;

  if (inviterProfileId) {
    userId = await buscarUserIdPorInvitacion(inviterProfileId, contacto);
  }

  if (!userId && contacto.email && contacto.email.trim() !== "") {
    userId = await buscarUserIdPorEmail(contacto.email.trim());
  }
  if (!userId && contacto.phone && contacto.phone.trim() !== "") {
    userId = await buscarUserIdPorTelefono(contacto.phone.trim());
  }
  if (!userId) return false;

  const token = await obtenerPushToken(userId);
  if (!token) return false;

  return enviarPush(token, titulo, cuerpo, data);
}

export async function intentarPushSilenciosa(
  contacto: { email?: string; phone?: string },
  data: Record<string, unknown>,
  inviterProfileId?: string
): Promise<boolean> {
  let userId: string | null = null;

  if (inviterProfileId) {
    userId = await buscarUserIdPorInvitacion(inviterProfileId, contacto);
  }

  if (!userId && contacto.email && contacto.email.trim() !== "") {
    userId = await buscarUserIdPorEmail(contacto.email.trim());
  }
  if (!userId && contacto.phone && contacto.phone.trim() !== "") {
    userId = await buscarUserIdPorTelefono(contacto.phone.trim());
  }
  if (!userId) return false;

  const token = await obtenerPushToken(userId);
  if (!token) return false;

  return enviarPushSilenciosa(token, data);
}

export async function intentarPushPorPerfil(
  profileId: string,
  data: Record<string, unknown>
): Promise<boolean> {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("user_id")
    .eq("id", profileId)
    .maybeSingle();

  if (error || !profile?.user_id) return false;

  const token = await obtenerPushToken(profile.user_id);
  if (!token) return false;

  return enviarPushSilenciosa(token, data);
}
