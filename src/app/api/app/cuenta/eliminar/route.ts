import { NextRequest, NextResponse } from "next/server";
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
    const userId = userAuth.userId;

    const body = await req.json().catch(() => null);
    if (body?.confirmacion !== "ELIMINAR") {
      return NextResponse.json(
        {
          error: "confirmacion_invalida",
          mensaje: 'Debes escribir exactamente "ELIMINAR" para confirmar la eliminación de tu cuenta.',
        },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // 1. Obtener los perfiles del usuario para extraer IDs y archivos de Storage
    const { data: userProfiles, error: fetchProfilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, photo_url, poliza_url")
      .eq("user_id", userId);

    if (fetchProfilesError) {
      console.error("[cuenta/eliminar] Error obteniendo perfiles:", fetchProfilesError);
      return NextResponse.json(
        { error: "error_servidor", mensaje: "Error al consultar los perfiles del usuario." },
        { status: 500 }
      );
    }

    const profileIds = (userProfiles || []).map((p) => p.id);

    // a) Desvincular chips asociados a esos perfiles
    if (profileIds.length > 0) {
      const { error: chipsUpdateErr } = await supabaseAdmin
        .from("chips")
        .update({
          owner_profile_id: null,
          activated: false,
          status: "disponible",
          activated_by: null,
          activated_at: null,
          perfil_compartido: null,
        })
        .in("owner_profile_id", profileIds);

      if (chipsUpdateErr) {
        console.error("[cuenta/eliminar] Error desvinculando chips por owner_profile_id:", chipsUpdateErr);
        return NextResponse.json(
          { error: "error_servidor", mensaje: "Error al liberar chips vinculados." },
          { status: 500 }
        );
      }
    }

    // b) Anonimizar incidentes de esos perfiles (profile_id = null)
    if (profileIds.length > 0) {
      const { error: incidentesErr } = await supabaseAdmin
        .from("incidentes")
        .update({ profile_id: null })
        .in("profile_id", profileIds);

      if (incidentesErr) {
        console.error("[cuenta/eliminar] Error anonimizando incidentes:", incidentesErr);
        return NextResponse.json(
          { error: "error_servidor", mensaje: "Error al anonimizar incidentes previos." },
          { status: 500 }
        );
      }
    }

    // c) Borrar rider_locations, vinculo_qr_tokens e invitaciones donde inviter_profile_id sea suyo
    if (profileIds.length > 0) {
      const { error: locationsErr } = await supabaseAdmin
        .from("rider_locations")
        .delete()
        .in("profile_id", profileIds);

      if (locationsErr) {
        console.error("[cuenta/eliminar] Error borrando rider_locations:", locationsErr);
        return NextResponse.json(
          { error: "error_servidor", mensaje: "Error al eliminar ubicaciones de rider." },
          { status: 500 }
        );
      }

      // vinculo_qr_tokens que referencian a los perfiles del rider
      const { error: qrErr } = await supabaseAdmin
        .from("vinculo_qr_tokens")
        .delete()
        .in("rider_profile_id", profileIds);

      if (qrErr) {
        console.warn("[cuenta/eliminar] Nota borrando vinculo_qr_tokens por rider_profile_id:", qrErr);
      }

      // contact_invitations emitidas por el rider
      const { error: invitesErr } = await supabaseAdmin
        .from("contact_invitations")
        .delete()
        .in("inviter_profile_id", profileIds);

      if (invitesErr) {
        console.error("[cuenta/eliminar] Error borrando contact_invitations emitidas:", invitesErr);
        return NextResponse.json(
          { error: "error_servidor", mensaje: "Error al eliminar invitaciones de contacto." },
          { status: 500 }
        );
      }

      // Borrar fotos y pólizas de Storage
      for (const p of userProfiles || []) {
        if (p.photo_url) {
          try {
            const photoPath = p.photo_url.split("/profile-photos/").pop();
            if (photoPath) {
              await supabaseAdmin.storage.from("profile-photos").remove([photoPath]);
            }
          } catch (stErr) {
            console.warn("[cuenta/eliminar] Error borrando foto de Storage:", stErr);
          }
        }
        if (p.poliza_url) {
          try {
            const polizaPath = p.poliza_url.includes("/polizas/")
              ? p.poliza_url.split("/polizas/").pop()
              : p.poliza_url;
            if (polizaPath) {
              await supabaseAdmin.storage.from("polizas").remove([polizaPath]);
            }
          } catch (stErr) {
            console.warn("[cuenta/eliminar] Error borrando póliza de Storage:", stErr);
          }
        }
      }
    }

    // vinculo_qr_tokens donde usado_por = userId
    await supabaseAdmin
      .from("vinculo_qr_tokens")
      .update({ usado_por: null })
      .eq("usado_por", userId);

    // d) contact_invitations donde linked_user_id = usuario -> status 'cancelled', linked_user_id = null
    const { error: cancelInvitesErr } = await supabaseAdmin
      .from("contact_invitations")
      .update({ status: "cancelled", linked_user_id: null })
      .eq("linked_user_id", userId);

    if (cancelInvitesErr) {
      console.error("[cuenta/eliminar] Error cancelando invitaciones recibidas:", cancelInvitesErr);
      return NextResponse.json(
        { error: "error_servidor", mensaje: "Error al actualizar vínculos de contacto." },
        { status: 500 }
      );
    }

    // e) Borrar user_push_tokens, user_sessions y app_email_codes del usuario
    await supabaseAdmin.from("user_push_tokens").delete().eq("user_id", userId);
    await supabaseAdmin.from("user_sessions").delete().eq("user_id", userId);
    await supabaseAdmin.from("app_email_codes").delete().eq("user_id", userId);

    // f) Borrar las filas de profiles del usuario
    const { error: deleteProfilesErr } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("user_id", userId);

    if (deleteProfilesErr) {
      console.error("[cuenta/eliminar] Error borrando profiles:", deleteProfilesErr);
      return NextResponse.json(
        { error: "error_servidor", mensaje: "Error al eliminar perfiles del usuario." },
        { status: 500 }
      );
    }

    // g) Borrar usuario de auth.users
    const { error: deleteAuthErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteAuthErr) {
      console.error("[cuenta/eliminar] Error borrando usuario de auth:", deleteAuthErr);
      return NextResponse.json(
        { error: "error_servidor", mensaje: "Error al eliminar usuario en autenticación." },
        { status: 500 }
      );
    }

    // h) Registrar en audit_logs la acción 'cuenta_eliminada' (sin datos médicos)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;

    await supabaseAdmin.from("audit_logs").insert({
      user_id: userId,
      action: "cuenta_eliminada",
      entity_type: "user",
      entity_id: userId,
      ip_address: ip,
      user_agent: req.headers.get("user-agent") || null,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[cuenta/eliminar] Error inesperado:", err);
    return NextResponse.json(
      { error: "error_servidor", mensaje: "Error interno del servidor al eliminar cuenta." },
      { status: 500 }
    );
  }
}
