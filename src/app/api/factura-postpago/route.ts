import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY requerido en /api/factura-postpago');
}
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req: NextRequest) {
  try {
    const {
      session_id,
      rfc,
      nombre_fiscal,
      regimen_fiscal,
      uso_cfdi,
      codigo_postal_fiscal,
      email_factura,
      whatsapp_factura,
    } = await req.json();

    if (!session_id || !rfc || !nombre_fiscal || !regimen_fiscal || !codigo_postal_fiscal || !email_factura || !whatsapp_factura) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    // Buscar la orden por session_id
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, paquete, monto")
      .eq("session_id", session_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    // Guardar solicitud de factura
    const { data: factura, error: facturaError } = await supabase
      .from("factura_requests")
      .insert([{
        session_id,
        rfc,
        nombre_fiscal,
        regimen_fiscal,
        uso_cfdi,
        codigo_postal_fiscal,
        email_factura,
        whatsapp_factura,
        paquete: order.paquete,
        monto: order.monto,
      }])
      .select("id")
      .single();

    if (facturaError) {
      console.error("Error guardando factura:", facturaError);
      return NextResponse.json({ error: "Error guardando datos fiscales" }, { status: 500 });
    }

    // Marcar orden como requiere factura
    await supabase
      .from("orders")
      .update({ requiere_factura: true, factura_id: factura.id })
      .eq("id", order.id);

    // Enviar email de notificación al admin
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: "RescueChip <contacto@rescue-chip.com>",
      replyTo: "contacto@rescue-chip.com",
      to: process.env.NOTIFY_EMAIL || "chiprescue2025@gmail.com",
      subject: `Solicitud de Factura - Orden ${order.id}`,
      html: `
        <h2>Solicitud de Factura 📋</h2>
        <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse;">
          <tr><td><strong>RFC:</strong></td><td>${rfc}</td></tr>
          <tr><td><strong>Razón Social:</strong></td><td>${nombre_fiscal}</td></tr>
          <tr><td><strong>Régimen:</strong></td><td>${regimen_fiscal}</td></tr>
          <tr><td><strong>Uso CFDI:</strong></td><td>${uso_cfdi}</td></tr>
          <tr><td><strong>CP Fiscal:</strong></td><td>${codigo_postal_fiscal}</td></tr>
          <tr><td><strong>Email Factura:</strong></td><td>${email_factura}</td></tr>
          <tr><td><strong>WhatsApp:</strong></td><td>${whatsapp_factura}</td></tr>
          <tr><td><strong>Paquete:</strong></td><td>${order.paquete}</td></tr>
          <tr><td><strong>Monto:</strong></td><td>$${order.monto} MXN</td></tr>
        </table>
      `,
    });

    return NextResponse.json({ success: true, factura_id: factura.id });
  } catch (error: unknown) {
    console.error("Error en factura-postpago:", error);
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
