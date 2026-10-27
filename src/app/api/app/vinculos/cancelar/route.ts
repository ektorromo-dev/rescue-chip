import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserFromRequest } from "@/lib/auth-request";

export const dynamic = "force-dynamic";

interface ContactItem {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  [key: string]: unknown;
}

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
    const invitationId = body?.invitationId;

    if (!invitationId || typeof invitationId !== "string" || !invitationId.trim()) {
      return NextResponse.json(
        { error: "invitation_id_invalido", mensaje: "ID de invitación requerido." },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // 1. Obtener los perfiles del rider autenticado
    const { data: userProfiles } = await supabaseAdmin
      .from("profiles")
      .select("id, emergency_contacts")
      .eq("user_id", userAuth.userId);

    const profileIds = new Set((userProfiles || []).map((p) => p.id));

    // 2. Buscar la invitación
    const { data: invite, error: inviteErr } = await supabaseAdmin
      .from("contact_invitations")
      .select("id, inviter_profile_id, contact_email, contact_phone")
      .eq("id", invitationId.trim())
      .maybeSingle();

    if (inviteErr || !invite) {
      return NextResponse.json(
        { error: "invitacion_no_encontrada", mensaje: "Invitación no encontrada." },
        { status: 404 }
      );
    }

    // 3. Verificar que la invitación pertenezca a uno de sus perfiles
    if (!profileIds.has(invite.inviter_profile_id)) {
      return NextResponse.json(
        { error: "no_autorizado", mensaje: "No tienes permiso para cancelar esta invitación." },
        { status: 403 }
      );
    }

    // 4. Marcar status = 'cancelled' y linked_user_id = null
    const { error: cancelErr } = await supabaseAdmin
      .from("contact_invitations")
      .update({ status: "cancelled", linked_user_id: null })
      .eq("id", invite.id);

    if (cancelErr) {
      console.error("[vinculos/cancelar] Error cancelando invitación:", cancelErr);
      return NextResponse.json(
        { error: "error_servidor", mensaje: "Error al cancelar la invitación." },
        { status: 500 }
      );
    }

    // 5. Verificar si la invitación se creó por QR (existe vinculo_qr_tokens con invitation_id)
    const { data: qrMatch } = await supabaseAdmin
      .from("vinculo_qr_tokens")
      .select("id")
      .eq("invitation_id", invite.id)
      .maybeSingle();

    if (qrMatch) {
      // Quitar al contacto de profiles.emergency_contacts
      const profileToUpdate = (userProfiles || []).find((p) => p.id === invite.inviter_profile_id);
      if (profileToUpdate && Array.isArray(profileToUpdate.emergency_contacts)) {
        const currentContacts = profileToUpdate.emergency_contacts as ContactItem[];
        const targetEmail = (invite.contact_email || "").trim().toLowerCase();
        const targetPhone = (invite.contact_phone || "").trim();

        const filteredContacts = currentContacts.filter((c) => {
          const matchEmail =
            targetEmail && c.email && c.email.trim().toLowerCase() === targetEmail;
          const matchPhone = targetPhone && c.phone && c.phone.trim() === targetPhone;
          return !(matchEmail || matchPhone);
        });

        await supabaseAdmin
          .from("profiles")
          .update({ emergency_contacts: filteredContacts })
          .eq("id", profileToUpdate.id);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[vinculos/cancelar] Error inesperado:", err);
    return NextResponse.json(
      { error: "error_servidor", mensaje: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
