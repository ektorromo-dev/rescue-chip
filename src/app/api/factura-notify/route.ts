import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            nombre_fiscal,
            rfc,
            regimen_fiscal,
            uso_cfdi,
            codigo_postal_fiscal,
            email_factura,
            whatsapp_factura,
            paquete,
            monto
        } = body;

        // 1. Guardar en Supabase
        const { data, error } = await supabase
            .from("factura_requests")
            .insert({
                nombre_fiscal,
                rfc,
                regimen_fiscal,
                uso_cfdi,
                codigo_postal_fiscal,
                email_factura,
                whatsapp_factura,
                paquete,
                monto,
                status: "pendiente"
            })
            .select("id")
            .single();

        if (error) {
            console.error("Error insertando factura_request: ", error);
            return NextResponse.json({ error: "No se pudo guardar la solicitud de factura." }, { status: 500 });
        }

        // 2. Enviar Email de Notificación
        const notifyEmail = process.env.NOTIFY_EMAIL || "chiprescue2025@gmail.com";
        const emailHtml = `
            <h2>Nueva Solicitud de Factura - RescueChip</h2>
            <p>Se ha recibido una nueva solicitud de facturación al completar un proceso en la tienda.</p>
            <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse;">
                <tr><td><strong>ID Registro:</strong></td><td>${data?.id}</td></tr>
                <tr><td><strong>Paquete Comprado:</strong></td><td>${paquete}</td></tr>
                <tr><td><strong>Monto a Facturar:</strong></td><td>$${monto} MXN</td></tr>
                <tr><td><strong>Nombre / Razón Social:</strong></td><td>${nombre_fiscal}</td></tr>
                <tr><td><strong>RFC:</strong></td><td>${rfc}</td></tr>
                <tr><td><strong>Régimen Fiscal:</strong></td><td>${regimen_fiscal}</td></tr>
                <tr><td><strong>Uso de CFDI:</strong></td><td>${uso_cfdi}</td></tr>
                <tr><td><strong>C.P. Fiscal:</strong></td><td>${codigo_postal_fiscal}</td></tr>
                <tr><td><strong>Email Cliente:</strong></td><td>${email_factura}</td></tr>
                <tr><td><strong>WhatsApp Cliente:</strong></td><td>${whatsapp_factura}</td></tr>
            </table>
            <p>Por favor genere la factura y envíela al correo del cliente en las próximas 72 horas hábiles.</p>
        `;

        await transporter.sendMail({
            from: `"RescueChip Facturación" <${process.env.SMTP_USER}>`,
            to: notifyEmail,
            subject: "Nueva solicitud de factura - RescueChip",
            html: emailHtml,
        });

        // Retornamos el id asignado para que el frontend lo pueda usar (ej. para inyectar session_id luego, 
        // aunque stripe se hace después, podríamos actualizar el session_id luego o pasarlo en metadata).
        return NextResponse.json({ success: true, factura_id: data?.id });

    } catch (error: any) {
        console.error("Error en factura-notify:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
