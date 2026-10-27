import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserFromRequest } from "@/lib/auth-request";
import { hashCodigo } from "@/lib/app-email";

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
    const { deviceId, codigo } = body || {};

    if (!deviceId || typeof deviceId !== "string" || !deviceId.trim()) {
      return NextResponse.json(
        { error: "dispositivo_invalido", mensaje: "El identificador de dispositivo es requerido." },
        { status: 400 }
      );
    }

    if (!codigo || typeof codigo !== "string" || !codigo.trim()) {
      return NextResponse.json(
        { error: "codigo_requerido", mensaje: "El código de verificación es requerido." },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // 1. Buscar código vigente
    const { data: codeRecord } = await supabaseAdmin
      .from("app_email_codes")
      .select("id, code_hash, intentos, expires_at, used_at")
      .eq("user_id", userAuth.userId)
      .eq("device_id", deviceId.trim())
      .eq("proposito", "dispositivo")
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!codeRecord) {
      return NextResponse.json(
        { error: "codigo_vencido", mensaje: "El código ha vencido o no existe. Pide un código nuevo." },
        { status: 400 }
      );
    }

    // 2. Verificar hash
    const hashInput = hashCodigo(String(codigo));
    if (hashInput !== codeRecord.code_hash) {
      const nuevosIntentos = (codeRecord.intentos || 0) + 1;
      if (nuevosIntentos >= 5) {
        await supabaseAdmin
          .from("app_email_codes")
          .update({ intentos: nuevosIntentos, used_at: new Date().toISOString() })
          .eq("id", codeRecord.id);

        return NextResponse.json(
          { error: "codigo_bloqueado", mensaje: "Código bloqueado por demasiados intentos. Pide un código nuevo." },
          { status: 400 }
        );
      }

      await supabaseAdmin
        .from("app_email_codes")
        .update({ intentos: nuevosIntentos })
        .eq("id", codeRecord.id);

      return NextResponse.json(
        { error: "codigo_incorrecto", mensaje: `Código incorrecto. Te quedan ${5 - nuevosIntentos} intentos.` },
        { status: 400 }
      );
    }

    // 3. Marcar código como usado
    await supabaseAdmin
      .from("app_email_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", codeRecord.id);

    // 4. Upsert en user_sessions (user_id + device_id)
    const { data: existingSession } = await supabaseAdmin
      .from("user_sessions")
      .select("id")
      .eq("user_id", userAuth.userId)
      .eq("device_id", deviceId.trim())
      .maybeSingle();

    if (existingSession) {
      await supabaseAdmin
        .from("user_sessions")
        .update({
          status: "verified",
          device_info: "app-android",
          last_seen: new Date().toISOString(),
        })
        .eq("id", existingSession.id);
    } else {
      await supabaseAdmin.from("user_sessions").insert({
        user_id: userAuth.userId,
        device_id: deviceId.trim(),
        device_info: "app-android",
        status: "verified",
        last_seen: new Date().toISOString(),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[dispositivo/verificar] Error inesperado:", err);
    return NextResponse.json(
      { error: "error_servidor", mensaje: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
