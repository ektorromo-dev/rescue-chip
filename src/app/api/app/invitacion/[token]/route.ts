import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitAppInvitacionIp } from "@/lib/ratelimit";

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const { success: allowed } = await rateLimitAppInvitacionIp.limit(`invitacion_get:${ip}`);
    if (!allowed) {
      return NextResponse.json(
        {
          error: "limite_excedido",
          mensaje: "Demasiadas consultas de invitación. Intenta más tarde.",
        },
        { status: 429 }
      );
    }

    const { token } = await params;
    if (!token || typeof token !== "string" || !token.trim()) {
      return NextResponse.json(
        { error: "token_invalido", mensaje: "Token de invitación inválido." },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();
    const { data: invitation, error } = await supabaseAdmin
      .from("contact_invitations")
      .select("id, inviter_profile_id, contact_name, contact_email, status, expires_at")
      .eq("token", token.trim())
      .maybeSingle();

    if (error || !invitation) {
      return NextResponse.json(
        { error: "invitacion_no_encontrada", mensaje: "Invitación no encontrada." },
        { status: 404 }
      );
    }

    let estado = invitation.status as "pending" | "accepted" | "expired" | "cancelled";
    const now = new Date();
    if (estado === "pending" && invitation.expires_at && new Date(invitation.expires_at) < now) {
      estado = "expired";
    }

    let primerNombre = "Rider";
    let photoUrl: string | null = null;

    if (invitation.inviter_profile_id) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("full_name, photo_url")
        .eq("id", invitation.inviter_profile_id)
        .maybeSingle();

      if (profile) {
        if (profile.full_name && profile.full_name.trim()) {
          primerNombre = profile.full_name.trim().split(/\s+/)[0] || profile.full_name.trim();
        }
        photoUrl = profile.photo_url ?? null;
      }
    }

    return NextResponse.json({
      estado,
      rider: {
        primer_nombre: primerNombre,
        photo_url: photoUrl,
      },
      contact_email: invitation.contact_email ?? null,
      contact_name: invitation.contact_name ?? null,
    });
  } catch (err) {
    console.error("[api/app/invitacion/[token]] Error inesperado:", err);
    return NextResponse.json(
      { error: "error_servidor", mensaje: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
