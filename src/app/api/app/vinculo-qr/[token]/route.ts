import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserFromRequest } from "@/lib/auth-request";
import { rateLimitAppVinculoQrIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ token: string }>;
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const ip = getClientIp(req);

    // 1. Rate limit: 30 por hora por IP
    const { success } = await rateLimitAppVinculoQrIp.limit(`qr_get:${ip}`);
    if (!success) {
      return NextResponse.json(
        { error: "demasiados_intentos", mensaje: "Demasiados intentos. Intenta más tarde." },
        { status: 429 }
      );
    }

    const { token } = await context.params;
    if (!token) {
      return NextResponse.json(
        { error: "token_invalido", mensaje: "Token requerido." },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // 2. Buscar token QR
    const { data: qrRecord, error: qrErr } = await supabaseAdmin
      .from("vinculo_qr_tokens")
      .select("*")
      .eq("token", token.trim())
      .maybeSingle();

    if (qrErr || !qrRecord) {
      return NextResponse.json(
        { error: "no_encontrado", mensaje: "Código QR no encontrado." },
        { status: 404 }
      );
    }

    // 3. Buscar perfil del rider
    const { data: riderProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, photo_url, user_id")
      .eq("id", qrRecord.rider_profile_id)
      .maybeSingle();

    const primerNombre =
      riderProfile?.full_name?.trim().split(/\s+/)[0] || riderProfile?.full_name || "Rider";

    // 4. Calcular estado
    const now = new Date();
    let estado: "vigente" | "reservado" | "usado" | "vencido" = "vencido";

    if (qrRecord.usado_at) {
      estado = "usado";
    } else if (qrRecord.reservado_hasta && new Date(qrRecord.reservado_hasta) > now) {
      estado = "reservado";
    } else if (new Date(qrRecord.expires_at) > now) {
      estado = "vigente";
    } else {
      estado = "vencido";
    }

    const responsePayload: Record<string, unknown> = {
      estado,
      rider: {
        primer_nombre: primerNombre,
        photo_url: riderProfile?.photo_url ?? null,
      },
    };

    // 5. Verificar si viene Bearer del dueño
    const userAuth = await getUserFromRequest(req);
    const userId = userAuth?.userId ?? null;

    if (userId && riderProfile && riderProfile.user_id === userId) {
      responsePayload.invitation_id = qrRecord.invitation_id ?? null;

      if (qrRecord.usado_at) {
        let usadoPorNombre: string | null = null;

        if (qrRecord.invitation_id) {
          const { data: invite } = await supabaseAdmin
            .from("contact_invitations")
            .select("contact_name")
            .eq("id", qrRecord.invitation_id)
            .maybeSingle();
          usadoPorNombre = invite?.contact_name ?? null;
        }

        if (!usadoPorNombre && qrRecord.usado_por) {
          const { data: contactUserData } = await supabaseAdmin.auth.admin.getUserById(
            qrRecord.usado_por
          );
          const meta = contactUserData?.user?.user_metadata || {};
          usadoPorNombre = meta.nombre || meta.full_name || null;
        }

        responsePayload.usado_por_nombre = usadoPorNombre || "Un contacto";
      }
    }

    return NextResponse.json(responsePayload);
  } catch (err: unknown) {
    console.error("[vinculo-qr/[token]] Error inesperado:", err);
    return NextResponse.json(
      { error: "error_servidor", mensaje: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
