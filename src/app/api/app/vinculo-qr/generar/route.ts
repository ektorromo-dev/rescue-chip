import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserFromRequest } from "@/lib/auth-request";

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

    const supabaseAdmin = createAdminClient();

    // 1. Obtener perfil de rider del usuario
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", userAuth.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (profileErr || !profile) {
      return NextResponse.json(
        { error: "sin_perfil_rider", mensaje: "Debes tener un perfil registrado para generar un código QR." },
        { status: 403 }
      );
    }

    // 2. Marcar como vencidos los tokens anteriores sin usar de este perfil
    const nowIso = new Date().toISOString();
    await supabaseAdmin
      .from("vinculo_qr_tokens")
      .update({ expires_at: nowIso })
      .eq("rider_profile_id", profile.id)
      .is("usado_at", null)
      .gt("expires_at", nowIso);

    // 3. Generar nuevo token que expira en 10 minutos
    const token = randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: insertErr } = await supabaseAdmin
      .from("vinculo_qr_tokens")
      .insert({
        rider_profile_id: profile.id,
        token,
        expires_at: expiresAt,
      });

    if (insertErr) {
      console.error("[vinculo-qr/generar] Error guardando token QR:", insertErr);
      return NextResponse.json(
        { error: "error_servidor", mensaje: "Error al generar código QR." },
        { status: 500 }
      );
    }

    const url = `https://www.rescue-chip.com/vincular/qr/${token}`;

    return NextResponse.json({
      token,
      expires_at: expiresAt,
      url,
    });
  } catch (err: unknown) {
    console.error("[vinculo-qr/generar] Error inesperado:", err);
    return NextResponse.json(
      { error: "error_servidor", mensaje: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
