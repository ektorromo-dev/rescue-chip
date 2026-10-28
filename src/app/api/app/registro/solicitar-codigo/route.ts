import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  rateLimitAppRegistroEmail,
  rateLimitAppRegistroIp,
} from "@/lib/ratelimit";
import {
  generarCodigo6Digitos,
  hashCodigo,
  enviarCodigoVerificacionEmail,
} from "@/lib/app-email";

export const dynamic = "force-dynamic";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // 1. Rate limit por IP (10 por hora)
    const ipLimit = await rateLimitAppRegistroIp.limit(`reg_ip:${ip}`);
    if (!ipLimit.success) {
      return NextResponse.json(
        {
          error: "demasiados_intentos",
          mensaje: "Demasiados intentos desde esta red. Intenta más tarde.",
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    const rawEmail = body?.email;

    if (!rawEmail || typeof rawEmail !== "string") {
      return NextResponse.json(
        {
          error: "email_invalido",
          mensaje: "El correo electrónico es requerido.",
        },
        { status: 400 }
      );
    }

    const email = rawEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        {
          error: "email_invalido",
          mensaje: "El formato del correo electrónico es inválido.",
        },
        { status: 400 }
      );
    }

    // 2. Rate limit por email (5 por hora)
    const emailLimit = await rateLimitAppRegistroEmail.limit(`reg_email:${email}`);
    if (!emailLimit.success) {
      return NextResponse.json(
        {
          error: "demasiados_intentos",
          mensaje: "Demasiados intentos para este correo. Intenta más tarde.",
        },
        { status: 429 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // 3. Verificar si el usuario ya existe con RPC get_user_id_by_email
    const { data: existingUserId, error: rpcError } = await supabaseAdmin.rpc(
      "get_user_id_by_email",
      { lookup_email: email }
    );

    if (rpcError) {
      console.error("[registro/solicitar-codigo] Error RPC:", rpcError);
    }

    if (existingUserId) {
      return NextResponse.json(
        {
          error: "ya_existe",
          mensaje: "Este correo ya tiene cuenta. Inicia sesión.",
        },
        { status: 409 }
      );
    }

    // 4. Invalidar códigos anteriores sin usar de este email y propósito
    const nowIso = new Date().toISOString();
    await supabaseAdmin
      .from("app_email_codes")
      .update({ used_at: nowIso })
      .eq("email", email)
      .eq("proposito", "registro")
      .is("used_at", null);

    // 5. Generar código y guardar hash
    const codigo = generarCodigo6Digitos();
    const codeHash = hashCodigo(codigo);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: insertError } = await supabaseAdmin
      .from("app_email_codes")
      .insert({
        email,
        proposito: "registro",
        code_hash: codeHash,
        expires_at: expiresAt,
        intentos: 0,
      });

    if (insertError) {
      console.error("[registro/solicitar-codigo] Error insertando código:", insertError);
      return NextResponse.json(
        {
          error: "error_servidor",
          mensaje: "Error al generar el código de verificación.",
        },
        { status: 500 }
      );
    }

    // 6. Enviar correo
    const emailSent = await enviarCodigoVerificacionEmail(email, codigo, "registro");
    if (!emailSent) {
      console.error("[registro/solicitar-codigo] No se pudo enviar el correo a:", email);
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[registro/solicitar-codigo] Error inesperado:", err);
    return NextResponse.json(
      {
        error: "error_servidor",
        mensaje: "Error interno del servidor.",
      },
      { status: 500 }
    );
  }
}
