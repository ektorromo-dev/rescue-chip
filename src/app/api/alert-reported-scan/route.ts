import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { generateScanReportPdfBuffer } from "@/components/ReportedScanPdf";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const { folio } = body;

        if (!folio || typeof folio !== "string") {
            return NextResponse.json({ error: "Folio requerido." }, { status: 400 });
        }

        const cleanFolio = folio.trim().toUpperCase();

        // 1. Validar contra base de datos usando Service Role
        const supabaseAdmin = createAdminClient();
        const { data: chip, error: chipError } = await supabaseAdmin
            .from("chips")
            .select("*")
            .ilike("folio", cleanFolio)
            .maybeSingle();

        if (chipError || !chip) {
            console.warn(`[alert-reported-scan] Chip no encontrado: ${cleanFolio}`);
            return NextResponse.json({ error: "Chip no encontrado." }, { status: 404 });
        }

        if (chip.status !== "reportado") {
            console.warn(`[alert-reported-scan] El chip ${cleanFolio} no tiene status='reportado' (status actual: ${chip.status})`);
            return NextResponse.json({ error: "El chip no está reportado." }, { status: 400 });
        }

        // 2. Obtener la IP y User Agent del escaneo (mismo patrón que /api/log-access)
        const ip_raw = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
            || req.headers.get("x-real-ip")
            || "127.0.0.1";
        const ip_address = ip_raw !== "127.0.0.1" ? ip_raw : "Desconocida";
        const user_agent = req.headers.get("user-agent") || "Desconocido";

        // 3. Obtener el email del dueño a través de reported_by_user_id
        let ownerEmail: string | null = null;
        const ownerUserId = chip.reported_by_user_id || chip.activated_by;

        if (ownerUserId) {
            try {
                const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(ownerUserId);
                if (userData && userData.user && userData.user.email) {
                    ownerEmail = userData.user.email;
                } else if (userError) {
                    console.error("[alert-reported-scan] Error obteniendo usuario dueño:", userError);
                }
            } catch (authErr) {
                console.error("[alert-reported-scan] Excepción obteniendo email del dueño:", authErr);
            }
        }

        const fechaStr = new Date().toLocaleString("es-MX", {
            timeZone: "America/Mexico_City",
            dateStyle: "full",
            timeStyle: "medium",
        });

        // 4. Cargar logo en base64 para el PDF
        let logoBase64: string | null = null;
        try {
            const logoPath = path.join(process.cwd(), "public", "icon-512.png");
            if (fs.existsSync(logoPath)) {
                const fileBuffer = fs.readFileSync(logoPath);
                logoBase64 = `data:image/png;base64,${fileBuffer.toString("base64")}`;
            }
        } catch (logoErr) {
            console.warn("[alert-reported-scan] No se pudo leer logo para PDF:", logoErr);
        }

        // 5. Generar PDF con @react-pdf/renderer
        let pdfBuffer: Buffer | null = null;
        try {
            pdfBuffer = await generateScanReportPdfBuffer({
                folio: cleanFolio,
                fechaStr,
                ipAddress: ip_address,
                userAgent: user_agent,
                ownerEmail,
                logoBase64,
            });
        } catch (pdfErr) {
            console.error("[alert-reported-scan] Error generando PDF:", pdfErr);
        }

        // 6. Configurar Nodemailer
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const attachments = pdfBuffer
            ? [
                  {
                      filename: `Reporte-Escaneo-${cleanFolio}.pdf`,
                      content: pdfBuffer,
                      contentType: "application/pdf",
                  },
              ]
            : [];

        // Correo A: A contacto@rescue-chip.com
        const adminEmailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #E8231A; border-radius: 10px;">
                <h2 style="color: #E8231A; margin-top: 0; text-align: center;">🚨 ALERTA DE SEGURIDAD 🚨</h2>
                <h3 style="color: #333; text-align: center;">Chip Reportado fue Escaneado</h3>
                <p style="font-size: 16px;">El dispositivo con folio <strong>${cleanFolio}</strong>, previamente reportado como robado/extraviado, acaba de ser escaneado.</p>
                
                <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <ul style="color: #991b1b; margin-bottom: 0;">
                        <li><strong>Folio:</strong> ${cleanFolio}</li>
                        <li><strong>Fecha y Hora:</strong> ${fechaStr}</li>
                        <li><strong>Dirección IP:</strong> ${ip_address}</li>
                        <li><strong>Dispositivo / User-Agent:</strong> ${user_agent}</li>
                        <li><strong>Email del Dueño:</strong> ${ownerEmail || "No disponible"}</li>
                    </ul>
                </div>
                
                <p style="color: #555; font-size: 14px;">Se adjunta a este correo el reporte técnico en formato PDF con la evidencia del escaneo.</p>
                <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">RescueChip Sistema de Seguridad Automatizado</p>
            </div>
        `;

        try {
            await transporter.sendMail({
                from: "RescueChip <contacto@rescue-chip.com>",
                replyTo: "contacto@rescue-chip.com",
                to: "contacto@rescue-chip.com",
                subject: `🚨 ALERTA: Chip reportado fue escaneado (${cleanFolio})`,
                html: adminEmailHtml,
                attachments,
            });
            console.log(`[alert-reported-scan] Correo de alerta enviado a contacto@rescue-chip.com para ${cleanFolio}`);
        } catch (adminMailErr) {
            console.error("[alert-reported-scan] Error enviando correo a admin:", adminMailErr);
        }

        // Correo B: Al email del dueño si fue encontrado
        if (ownerEmail) {
            const ownerEmailHtml = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #E8231A; border-radius: 10px;">
                    <h2 style="color: #E8231A; margin-top: 0; text-align: center;">🚨 ALERTA DE SEGURIDAD 🚨</h2>
                    <h3 style="color: #333; text-align: center;">Alguien escaneó tu RescueChip reportado</h3>
                    <p style="font-size: 16px;">Hola. Te informamos que tu dispositivo RescueChip con folio <strong>${cleanFolio}</strong>, el cual diste de baja y marcaste como robado/extraviado, fue escaneado recientemente.</p>
                    
                    <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <ul style="color: #991b1b; margin-bottom: 0;">
                            <li><strong>Folio:</strong> ${cleanFolio}</li>
                            <li><strong>Fecha y Hora:</strong> ${fechaStr}</li>
                            <li><strong>Dirección IP del Escaneo:</strong> ${ip_address}</li>
                            <li><strong>Dispositivo detectado:</strong> ${user_agent}</li>
                        </ul>
                    </div>
                    
                    <p style="color: #555; font-size: 14px; line-height: 1.6;">
                        <strong>Tus datos médicos se mantuvieron completamente protegidos</strong> y no fueron mostrados a quien escaneó el chip. La persona vio un aviso indicando que el chip fue reportado como robado y se le proporcionó nuestro contacto para regresarlo.
                    </p>
                    
                    <p style="color: #555; font-size: 14px; line-height: 1.6;">
                        Adjuntamos a este correo el reporte técnico en PDF con los detalles del escaneo como evidencia. Si la persona se comunica a nuestro correo para devolverlo, te notificaremos de inmediato.
                    </p>
                    
                    <p style="color: #555; font-size: 13px; text-align: center; margin-top: 24px;">
                        Equipo de Seguridad RescueChip — <a href="mailto:contacto@rescue-chip.com" style="color: #E8231A; font-weight: bold;">contacto@rescue-chip.com</a>
                    </p>
                </div>
            `;

            try {
                await transporter.sendMail({
                    from: "RescueChip <contacto@rescue-chip.com>",
                    replyTo: "contacto@rescue-chip.com",
                    to: ownerEmail,
                    subject: `🚨 AVISO: Tu RescueChip reportado (${cleanFolio}) fue escaneado`,
                    html: ownerEmailHtml,
                    attachments,
                });
                console.log(`[alert-reported-scan] Correo de alerta enviado al dueño (${ownerEmail}) para ${cleanFolio}`);
            } catch (ownerMailErr) {
                console.error("[alert-reported-scan] Error enviando correo al dueño:", ownerMailErr);
            }
        }

        // 7. Responder siempre éxito al cliente
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[alert-reported-scan] Error interno inesperado:", err);
        // Retornar success para no romper el flujo del escáner
        return NextResponse.json({ success: false, error: "Error interno procesando alerta." }, { status: 500 });
    }
}
