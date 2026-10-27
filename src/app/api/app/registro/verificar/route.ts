import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashCodigo } from "@/lib/app-email";
import { validateAndFormatPhone } from "@/lib/phone-utils";
import { sincronizarInvitacionesPendientesPorEmail } from "@/lib/vinculos-sync";
import type { CountryCode } from "libphonenumber-js";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "datos_incompletos", mensaje: "Faltan datos requeridos." },
        { status: 400 }
      );
    }

    const {
      email: rawEmail,
      codigo,
      invitacionToken,
      password,
      nombre,
      telefono,
      pais,
      deviceId,
    } = body;

    // 1. Validaciones básicas de campos
    if (!rawEmail || typeof rawEmail !== "string") {
      return NextResponse.json(
        { error: "email_invalido", mensaje: "El correo electrónico es requerido." },
        { status: 400 }
      );
    }
    const email = rawEmail.trim().toLowerCase();

    if (!codigo && !invitacionToken) {
      return NextResponse.json(
        { error: "codigo_requerido", mensaje: "Debes ingresar el código o token de invitación." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "password_corta", mensaje: "La contraseña debe tener al menos 8 caracteres." },
        { status: 400 }
      );
    }

    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
      return NextResponse.json(
        { error: "nombre_invalido", mensaje: "El nombre es requerido." },
        { status: 400 }
      );
    }

    if (!pais || typeof pais !== "string") {
      return NextResponse.json(
        { error: "pais_invalido", mensaje: "El país es requerido." },
        { status: 400 }
      );
    }

    if (!deviceId || typeof deviceId !== "string" || !deviceId.trim()) {
      return NextResponse.json(
        { error: "dispositivo_invalido", mensaje: "El identificador de dispositivo es requerido." },
        { status: 400 }
      );
    }

    // 2. Validación de teléfono con libphonenumber
    const countryCode = pais.trim().toUpperCase() as CountryCode;
    const phoneVal = validateAndFormatPhone(String(telefono || ""), countryCode);
    if (!phoneVal.isValid || !phoneVal.formatted) {
      return NextResponse.json(
        { error: "telefono_invalido", mensaje: "El número de teléfono no es válido para el país seleccionado." },
        { status: 400 }
      );
    }
    const formattedPhone = phoneVal.formatted;

    const supabaseAdmin = createAdminClient();
    let codeRecordIdToMarkUsed: string | null = null;

    // 3. Validación de código o token de invitación
    if (codigo) {
      const { data: codeRecord } = await supabaseAdmin
        .from("app_email_codes")
        .select("id, code_hash, intentos, expires_at, used_at")
        .eq("email", email)
        .eq("proposito", "registro")
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

      codeRecordIdToMarkUsed = codeRecord.id;
    } else if (invitacionToken) {
      const { data: invite } = await supabaseAdmin
        .from("contact_invitations")
        .select("id, contact_email, status, expires_at")
        .eq("token", String(invitacionToken).trim())
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (
        !invite ||
        !invite.contact_email ||
        invite.contact_email.trim().toLowerCase() !== email
      ) {
        return NextResponse.json(
          { error: "invitacion_invalida", mensaje: "La invitación no es válida o ya expiró." },
          { status: 400 }
        );
      }
    }

    // 4. Crear el usuario en auth.users
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nombre: nombre.trim(),
        telefono: formattedPhone,
        pais: pais.trim().toUpperCase(),
      },
    });

    if (createError) {
      if (
        createError.message?.toLowerCase().includes("already registered") ||
        createError.message?.toLowerCase().includes("already exists") ||
        createError.message?.includes("ya_existe")
      ) {
        return NextResponse.json(
          { error: "ya_existe", mensaje: "Este correo ya tiene cuenta. Inicia sesión." },
          { status: 409 }
        );
      }
      console.error("[registro/verificar] Error creando usuario:", createError);
      return NextResponse.json(
        { error: "error_servidor", mensaje: createError.message || "Error al crear la cuenta." },
        { status: 500 }
      );
    }

    const createdUserId = newUser.user.id;

    // 5. Insertar en user_sessions
    await supabaseAdmin.from("user_sessions").insert({
      user_id: createdUserId,
      device_id: deviceId.trim(),
      device_info: "app-android",
      status: "verified",
      last_seen: new Date().toISOString(),
    });

    // 6. Marcar código como usado si aplica
    if (codeRecordIdToMarkUsed) {
      await supabaseAdmin
        .from("app_email_codes")
        .update({ used_at: new Date().toISOString() })
        .eq("id", codeRecordIdToMarkUsed);
    }

    // 7. Aceptar invitaciones pendientes existentes para este correo
    try {
      await sincronizarInvitacionesPendientesPorEmail(createdUserId, email);
    } catch (syncErr) {
      console.error("[registro/verificar] Error sincronizando invitaciones:", syncErr);
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[registro/verificar] Error inesperado:", err);
    return NextResponse.json(
      { error: "error_servidor", mensaje: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
