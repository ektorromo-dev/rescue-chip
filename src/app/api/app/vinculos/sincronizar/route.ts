import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserFromRequest } from "@/lib/auth-request";
import { sincronizarInvitacionesPendientesPorEmail } from "@/lib/vinculos-sync";

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

    const aceptadas = await sincronizarInvitacionesPendientesPorEmail(
      userAuth.userId,
      email
    );

    return NextResponse.json({ aceptadas });
  } catch (err: unknown) {
    console.error("[vinculos/sincronizar] Error inesperado:", err);
    return NextResponse.json(
      { error: "error_servidor", mensaje: "Error interno al sincronizar vínculos." },
      { status: 500 }
    );
  }
}
