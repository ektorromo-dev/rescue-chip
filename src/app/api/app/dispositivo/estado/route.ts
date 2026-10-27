import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserFromRequest } from "@/lib/auth-request";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const userAuth = await getUserFromRequest(req);
    if (!userAuth) {
      return NextResponse.json(
        { error: "no_autorizado", mensaje: "No autorizado." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    const deviceId = body?.deviceId;

    if (!deviceId || typeof deviceId !== "string") {
      return NextResponse.json(
        { error: "dispositivo_invalido", mensaje: "El identificador de dispositivo es requerido." },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();
    const { data: session, error } = await supabaseAdmin
      .from("user_sessions")
      .select("status")
      .eq("user_id", userAuth.userId)
      .eq("device_id", deviceId.trim())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[dispositivo/estado] Error consultando user_sessions:", error);
      return NextResponse.json(
        { error: "error_servidor", mensaje: "Error al consultar estado de sesión." },
        { status: 500 }
      );
    }

    if (session?.status === "revoked") {
      return NextResponse.json({ verificado: false, revocado: true });
    }

    const verificado = session?.status === "verified";
    return NextResponse.json({ verificado });
  } catch (err: unknown) {
    console.error("[dispositivo/estado] Error inesperado:", err);
    return NextResponse.json(
      { error: "error_servidor", mensaje: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
