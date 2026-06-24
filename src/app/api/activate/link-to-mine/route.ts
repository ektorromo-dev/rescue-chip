import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { folio, profileId, userId } = body;

    if (!folio || !profileId || !userId) {
      return NextResponse.json(
        { success: false, error: "Datos incompletos." },
        { status: 400 }
      );
    }

    // Verificar que el chip existe y no está activado
    const { data: chip, error: chipError } = await supabaseAdmin
      .from("chips")
      .select("*")
      .ilike("folio", folio)
      .maybeSingle();

    if (chipError || !chip) {
      return NextResponse.json(
        { success: false, error: "Folio no encontrado." },
        { status: 404 }
      );
    }

    if (chip.activated === true || chip.status === "activado") {
      return NextResponse.json(
        { success: false, error: "Este folio ya fue activado." },
        { status: 400 }
      );
    }

    // Vincular chip al perfil existente
    const { error: updateError } = await supabaseAdmin
      .from("chips")
      .update({
        status: "activado",
        activated: true,
        activated_by: userId,
        owner_profile_id: profileId,
        perfil_compartido: true,
        activated_at: new Date().toISOString(),
      })
      .eq("id", chip.id);

    if (updateError) {
      console.error("Error vinculando chip:", updateError);
      return NextResponse.json(
        { success: false, error: "Error al vincular el chip." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error inesperado en link-to-mine:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
