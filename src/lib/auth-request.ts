import { createAdminClient } from "@/lib/supabase/admin";

export async function getUserFromRequest(
  req: Request
): Promise<{ userId: string; email: string | null } | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return null;
  }

  try {
    const supabaseAdmin = createAdminClient();
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email ?? null,
    };
  } catch (err: unknown) {
    console.error("[auth-request] Error validando Bearer token:", err);
    return null;
  }
}
