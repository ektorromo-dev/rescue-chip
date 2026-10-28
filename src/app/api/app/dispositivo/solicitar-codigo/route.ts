import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserFromRequest } from "@/lib/auth-request";
import { rateLimitAppDispositivoUser } from "@/lib/ratelimit";
import {
  generarCodigo6Digitos,
  hashCodigo,
  enviarCodigoVerificacionEmail,
} from "@/lib/app-email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const userAuth = await getUserFromRequest(req);
    if (!userAuth || !userAuth.userId) {
      return NextResponse.json(
        { error: "no_autorizado", mensaje: "No autorizado." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    const deviceId = body?.deviceId;

    if (!deviceId || typeof deviceId !== "string" || !deviceId.trim()) {
      return NextResponse.json(
        { error: "dispositivo_invalido", mensaje: "El identificador de dispositivo es requerido." },
        { status: 400 }
      );
    }

    // 1. Rate limit: 5 por hora por usuario
    const userLimit = await rateLimitAppDispositivoUser.limit(`disp_user:${userAuth.userId}`);
    if (!userLimit.success) {
      return NextResponse.json(
        { error: "demasiados_intentos", mensaje: "Demasiadas solicitudes de código. Intenta más tarde." },
        { status: 429 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Obtener correo del usuario si no vino en el token
    let email = userAuth.email;
    if (!email) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userAuth.userId);
      email = userData?.user?.email ?? null;
    }

    if (!email) {
      return NextResponse.json(
        { error: "email_no_encontrado", mensaje: "No se encontró el correo del usuario." },
        { status: 404 }
      );
    }

    // 2. Invalidar códigos anteriores de este usuario, dispositivo y propósito
    const nowIso = new Date().toISOString();
    await supabaseAdmin
      .from("app_email_codes")
      .update({ used_at: nowIso })
      .eq("user_id", userAuth.userId)
      .eq("proposito", "dispositivo")
      .is("used_at", null);

    // 3. Generar código y guardar hash
    const codigo = generarCodigo6Digitos();
    const codeHash = hashCodigo(codigo);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: insertError } = await supabaseAdmin
      .from("app_email_codes")
      .insert({
        email,
        user_id: userAuth.userId,
        device_id: deviceId.trim(),
        proposito: "dispositivo",
        code_hash: codeHash,
        expires_at: expiresAt,
        intentos: 0,
      });

    if (insertError) {
      console.error("[dispositivo/solicitar-codigo] Error insertando código:", insertError);
      return NextResponse.json(
        { error: "error_servidor", mensaje: "Error al generar código." },
        { status: 500 }
      );
    }

    // 4. Enviar correo al usuario
    await enviarCodigoVerificacionEmail(email, codigo, "dispositivo");

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[dispositivo/solicitar-codigo] Error inesperado:", err);
    return NextResponse.json(
      { error: "error_servidor", mensaje: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
