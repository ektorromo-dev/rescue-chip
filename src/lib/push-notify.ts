import { createClient } from "@supabase/supabase-js";
import { formatStoredPhone } from "@/lib/phone-utils";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function buscarUserIdPorEmail(email: string): Promise<string | null> {
  console.log("[push-notify][DEBUG] buscando por email:", email);
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    console.log("[push-notify][DEBUG] status respuesta admin/users:", res.status);
    const data = await res.json();
    console.log("[push-notify][DEBUG] data completa:", JSON.stringify(data));
    if (!res.ok) return null;
    console.log("[push-notify][DEBUG] userId encontrado:", data?.users?.[0]?.id ?? "NINGUNO");
    return data?.users?.[0]?.id ?? null;
  } catch (err) {
    console.error("[push-notify] Error buscando por email:", err);
    return null;
  }
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
  console.log("[push-notify][DEBUG] buscando token para userId:", userId);
  const { data } = await supabaseAdmin
    .from("user_push_tokens")
    .select("expo_push_token")
    .eq("user_id", userId)
    .maybeSingle();
  console.log("[push-notify][DEBUG] token encontrado:", data?.expo_push_token ?? "NINGUNO");
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

export async function intentarPush(
  contacto: { email?: string; phone?: string },
  titulo: string,
  cuerpo: string,
  data: Record<string, unknown>
): Promise<boolean> {
  let userId: string | null = null;

  if (contacto.email && contacto.email.trim() !== "") {
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
