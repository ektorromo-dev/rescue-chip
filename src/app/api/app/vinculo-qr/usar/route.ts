import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserFromRequest } from "@/lib/auth-request";
import { procesarUsoVinculoQr } from "@/lib/vinculo-qr";

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
    const { token, deviceId } = body || {};

    if (!token || typeof token !== "string" || !token.trim()) {
      return NextResponse.json(
        { error: "token_invalido", mensaje: "El token es requerido." },
        { status: 400 }
      );
    }

    let userEmail = userAuth.email;
    if (!userEmail) {
      const supabaseAdmin = createAdminClient();
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userAuth.userId);
      userEmail = userData?.user?.email ?? "";
    }

    const result = await procesarUsoVinculoQr({
      token: token.trim(),
      userId: userAuth.userId,
      userEmail: userEmail || "",
      deviceId: deviceId ? String(deviceId).trim() : null,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, mensaje: result.mensaje },
        { status: result.statusHttp }
      );
    }

    return NextResponse.json({
      ok: true,
      ya_vinculado: result.ya_vinculado,
      rider_nombre: result.rider_nombre,
      rider_photo_url: result.rider_photo_url,
    });
  } catch (err: unknown) {
    console.error("[vinculo-qr/usar] Error inesperado:", err);
    return NextResponse.json(
      { error: "error_servidor", mensaje: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
