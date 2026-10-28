import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserFromRequest } from "@/lib/auth-request";
import { rateLimitAppChipEstado } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const FOLIO_REGEX = /^RSC-[A-Za-z0-9_-]{3,20}$/i;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

export async function GET(req: NextRequest) {
  try {
    // 1. Rate limiting: 20 por hora por IP
    const ip = getClientIp(req);
    const { success } = await rateLimitAppChipEstado.limit(`chip_estado:${ip}`);
    if (!success) {
      return NextResponse.json(
        {
          error: "demasiados_intentos",
          mensaje: "Demasiados intentos. Intenta más tarde.",
        },
        { status: 429 }
      );
    }

    // 2. Obtener y validar folio
    const folioParam = req.nextUrl.searchParams.get("folio");
    if (!folioParam || typeof folioParam !== "string") {
      return NextResponse.json(
        {
          error: "folio_invalido",
          mensaje: "El folio es requerido.",
        },
        { status: 400 }
      );
    }

    const cleanFolio = folioParam.trim().toUpperCase();
    if (!FOLIO_REGEX.test(cleanFolio)) {
      return NextResponse.json(
        {
          error: "folio_invalido",
          mensaje: "El formato del folio es inválido.",
        },
        { status: 400 }
      );
    }

    // 3. Bearer opcional
    const userAuth = await getUserFromRequest(req);
    const userId = userAuth?.userId ?? null;

    // 4. Buscar chip en base de datos
    const supabaseAdmin = createAdminClient();
    const { data: chip, error: chipError } = await supabaseAdmin
      .from("chips")
      .select("id, folio, status, activated, owner_profile_id")
      .ilike("folio", cleanFolio)
      .maybeSingle();

    if (chipError) {
      console.error("[app/chip/estado] Error consultando chip:", chipError);
      return NextResponse.json(
        {
          error: "error_servidor",
          mensaje: "Error interno al consultar el estado del chip.",
        },
        { status: 500 }
      );
    }

    if (!chip) {
      return NextResponse.json({
        folio: cleanFolio,
        existe: false,
        activado: false,
        es_mio: false,
      });
    }

    const isActivated =
      chip.activated === true ||
      String(chip.activated).toLowerCase() === "true" ||
      chip.status === "activado";

    let esMio = false;
    if (userId && chip.owner_profile_id) {
      const { data: ownerProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", chip.owner_profile_id)
        .eq("user_id", userId)
        .maybeSingle();

      if (ownerProfile) {
        esMio = true;
      }
    }

    return NextResponse.json({
      folio: chip.folio || cleanFolio,
      existe: true,
      activado: isActivated,
      es_mio: esMio,
    });
  } catch (err: unknown) {
    console.error("[app/chip/estado] Error inesperado:", err);
    return NextResponse.json(
      {
        error: "error_servidor",
        mensaje: "Error interno del servidor.",
      },
      { status: 500 }
    );
  }
}
