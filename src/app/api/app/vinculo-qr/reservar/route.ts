import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const { token, deviceId } = body || {};

    if (!token || typeof token !== "string" || !token.trim()) {
      return NextResponse.json(
        { error: "token_invalido", mensaje: "Token requerido." },
        { status: 400 }
      );
    }

    if (!deviceId || typeof deviceId !== "string" || !deviceId.trim()) {
      return NextResponse.json(
        { error: "dispositivo_invalido", mensaje: "Identificador de dispositivo requerido." },
        { status: 400 }
      );
    }

    const cleanToken = token.trim();
    const cleanDeviceId = deviceId.trim();
    const supabaseAdmin = createAdminClient();

    const { data: qrRecord, error } = await supabaseAdmin
      .from("vinculo_qr_tokens")
      .select("id, expires_at, reservado_device_id, reservado_hasta, usado_at")
      .eq("token", cleanToken)
      .maybeSingle();

    if (error || !qrRecord || qrRecord.usado_at) {
      return NextResponse.json(
        { error: "qr_vencido", mensaje: "Este código ya venció. Pídele al rider que genere uno nuevo." },
        { status: 410 }
      );
    }

    const now = new Date();

    const isReservedByOtherDevice = Boolean(
      qrRecord.reservado_device_id &&
        qrRecord.reservado_device_id !== cleanDeviceId &&
        qrRecord.reservado_hasta &&
        new Date(qrRecord.reservado_hasta) > now
    );

    if (isReservedByOtherDevice) {
      return NextResponse.json(
        { error: "qr_en_uso", mensaje: "Alguien más está usando este código. Pídele al rider que genere uno nuevo." },
        { status: 409 }
      );
    }

    const isVigente = new Date(qrRecord.expires_at) > now;
    const isReservedBySameDevice = Boolean(
      qrRecord.reservado_device_id &&
        qrRecord.reservado_device_id === cleanDeviceId &&
        qrRecord.reservado_hasta &&
        new Date(qrRecord.reservado_hasta) > now
    );

    if (!isVigente && !isReservedBySameDevice) {
      return NextResponse.json(
        { error: "qr_vencido", mensaje: "Este código ya venció. Pídele al rider que genere uno nuevo." },
        { status: 410 }
      );
    }

    const reservadoHasta = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const { error: updateErr } = await supabaseAdmin
      .from("vinculo_qr_tokens")
      .update({
        reservado_device_id: cleanDeviceId,
        reservado_hasta: reservadoHasta,
      })
      .eq("id", qrRecord.id);

    if (updateErr) {
      console.error("[vinculo-qr/reservar] Error actualizando reserva:", updateErr);
      return NextResponse.json(
        { error: "error_servidor", mensaje: "Error al reservar código QR." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      reservado_hasta: reservadoHasta,
    });
  } catch (err: unknown) {
    console.error("[vinculo-qr/reservar] Error inesperado:", err);
    return NextResponse.json(
      { error: "error_servidor", mensaje: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
