import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return NextResponse.json(
        { error: "no_autorizado", mensaje: "Encabezado de autorización ausente o inválido." },
        { status: 401 }
      );
    }

    const bearerToken = authHeader.substring(7).trim();
    const supabaseAdmin = createAdminClient();
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(bearerToken);

    if (authError || !authData?.user) {
      return NextResponse.json(
        { error: "no_autorizado", mensaje: "Sesión inválida o expirada." },
        { status: 401 }
      );
    }

    const userId = authData.user.id;
    let body: { token?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "cuerpo_invalido", mensaje: "El cuerpo de la solicitud no es un JSON válido." },
        { status: 400 }
      );
    }

    const token = body.token?.trim();
    if (!token) {
      return NextResponse.json(
        { error: "token_requerido", mensaje: "El token de invitación es obligatorio." },
        { status: 400 }
      );
    }

    const { data: invitation, error: fetchErr } = await supabaseAdmin
      .from("contact_invitations")
      .select("id, inviter_profile_id, status, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (fetchErr || !invitation) {
      return NextResponse.json(
        { error: "invitacion_no_encontrada", mensaje: "Invitación no encontrada." },
        { status: 404 }
      );
    }

    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: "invitacion_invalida", mensaje: "Esta invitación ya no está disponible." },
        { status: 410 }
      );
    }

    const now = new Date();
    if (invitation.expires_at && new Date(invitation.expires_at) < now) {
      await supabaseAdmin
        .from("contact_invitations")
        .update({ status: "expired" })
        .eq("id", invitation.id);

      return NextResponse.json(
        { error: "invitacion_expirada", mensaje: "Esta invitación ya expiró." },
        { status: 410 }
      );
    }

    let riderNombre = "Rider";
    if (invitation.inviter_profile_id) {
      const { data: riderProfile } = await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("id", invitation.inviter_profile_id)
        .maybeSingle();

      if (riderProfile?.full_name?.trim()) {
        riderNombre = riderProfile.full_name.trim();
      }
    }

    const { error: updateErr } = await supabaseAdmin
      .from("contact_invitations")
      .update({
        status: "accepted",
        linked_user_id: userId,
        accepted_at: now.toISOString(),
      })
      .eq("id", invitation.id);

    if (updateErr) {
      console.error("[api/app/invitacion/aceptar] Error actualizando invitación:", updateErr);
      return NextResponse.json(
        { error: "error_servidor", mensaje: "Error al aceptar la invitación." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      rider_nombre: riderNombre,
    });
  } catch (err) {
    console.error("[api/app/invitacion/aceptar] Error inesperado:", err);
    return NextResponse.json(
      { error: "error_servidor", mensaje: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
