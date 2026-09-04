import { NextRequest, NextResponse } from "next/server";
import { processReportedChipScanAlert } from "@/lib/alert-reported-scan";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const { folio } = body;

        if (!folio || typeof folio !== "string") {
            return NextResponse.json({ error: "Folio requerido." }, { status: 400 });
        }

        const ip_raw = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
            || req.headers.get("x-real-ip")
            || "127.0.0.1";
        const user_agent = req.headers.get("user-agent") || "Desconocido";

        const result = await processReportedChipScanAlert({
            folio,
            ipAddress: ip_raw,
            userAgent: user_agent,
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error || "Error procesando alerta." }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[alert-reported-scan/route] Error inesperado:", err);
        return NextResponse.json({ error: "Error interno en el servidor." }, { status: 500 });
    }
}
