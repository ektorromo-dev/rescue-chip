import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sanitizePlainText } from "@/app/actions/sanitize";
import { validateAndFormatPhone } from "@/lib/phone-utils";
import type { CountryCode } from "libphonenumber-js";
import { KIT_RIDER_PDF_URL } from "@/lib/constants";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface LeadRequestBody {
    nombre?: unknown;
    whatsapp?: unknown;
    countryCode?: unknown;
    acepta_marketing?: unknown;
    origen?: unknown;
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as LeadRequestBody;
        const { nombre, whatsapp, countryCode, acepta_marketing, origen } = body;

        // 1. Validar y sanitizar nombre
        if (typeof nombre !== "string" || !nombre.trim()) {
            return NextResponse.json(
                { success: false, error: "El nombre es obligatorio." },
                { status: 400 }
            );
        }
        const cleanNombre = await sanitizePlainText(nombre, 100);
        if (!cleanNombre) {
            return NextResponse.json(
                { success: false, error: "Por favor ingresa un nombre válido." },
                { status: 400 }
            );
        }

        // 2. Validar y formatear teléfono/whatsapp
        if (typeof whatsapp !== "string" || !whatsapp.trim()) {
            return NextResponse.json(
                { success: false, error: "El número de WhatsApp es obligatorio." },
                { status: 400 }
            );
        }
        const validCountry: CountryCode =
            typeof countryCode === "string" && countryCode.length === 2
                ? (countryCode.toUpperCase() as CountryCode)
                : "MX";

        const phoneValidation = validateAndFormatPhone(whatsapp, validCountry);
        if (!phoneValidation.isValid || !phoneValidation.formatted) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        phoneValidation.error ||
                        "Número de WhatsApp inválido para el país seleccionado.",
                },
                { status: 400 }
            );
        }

        // 3. Validar consentimiento
        if (acepta_marketing !== true) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Debes aceptar recibir información por WhatsApp o correo para continuar.",
                },
                { status: 400 }
            );
        }

        // 4. Sanitizar origen (desde URL searchParams o body)
        const urlOrigen = req.nextUrl.searchParams.get("origen");
        const rawOrigen = typeof origen === "string" && origen.trim() ? origen : urlOrigen;
        const cleanOrigen = rawOrigen ? await sanitizePlainText(rawOrigen, 50) : "direct";

        // 5. Insertar lead en la base de datos
        const { error: insertError } = await supabaseAdmin
            .from("recursos_leads")
            .insert({
                nombre: cleanNombre,
                whatsapp: phoneValidation.formatted,
                acepta_marketing: true,
                recurso: "kit-rider-manual",
                origen: cleanOrigen || "direct",
            });

        if (insertError) {
            console.error("Error al registrar lead de kit-rider:", insertError);
            return NextResponse.json(
                {
                    success: false,
                    error: "No se pudo registrar la solicitud. Intenta de nuevo.",
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            pdfUrl: KIT_RIDER_PDF_URL,
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Error interno del servidor";
        console.error("Error inesperado en lead endpoint:", error);
        return NextResponse.json(
            { success: false, error: msg },
            { status: 500 }
        );
    }
}
