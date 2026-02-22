import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
        apiVersion: "2023-10-16" as any,
    });

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const payload = await req.text(); // Raw body necesario para la firma
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
        return NextResponse.json({ error: "No signature provided" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            payload,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET || ""
        );
    } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return NextResponse.json({ error: err.message }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        // Extraer metadatos
        const paquete = session.metadata?.paquete || "Desconocido";
        const pidioFactura = session.metadata?.factura === "true";
        const order_id = session.metadata?.order_id;

        let orderDetails = null;
        if (order_id) {
            // Actualizar orden
            const { data, error } = await supabase
                .from("orders")
                .update({ status: 'pagado', session_id: session.id })
                .eq("id", order_id)
                .select()
                .single();

            if (!error && data) {
                orderDetails = data;
            } else {
                console.error("Error updating order in webhook:", error);
            }
        }

        // Extraer detalles del cliente
        const nombre = orderDetails?.nombre_receptor || session.customer_details?.name || "No especificado";
        const email = orderDetails?.email_cliente || session.customer_details?.email || "No especificado";
        const telefono = orderDetails?.telefono_receptor || session.customer_details?.phone || "No especificado";

        // Dirección de envío
        const direccion = orderDetails
            ? `${orderDetails.calle_numero} ${orderDetails.numero_interior ? `Int. ${orderDetails.numero_interior}` : ""}, Col. ${orderDetails.colonia}
${orderDetails.ciudad}, ${orderDetails.estado}, C.P. ${orderDetails.codigo_postal}
Referencia: ${orderDetails.referencia}`.trim()
            : "No especificada (Orden no encontrada en DB)";

        const monto = (session.amount_total || 0) / 100;

        const emailHtml = `
            <h2>Nueva Venta Generada - RescueChip 🎉</h2>
            <p>Se ha completado un nuevo pago de forma exitosa a través de Stripe.</p>
            <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; min-width: 300px;">
                <tr><td><strong>Cliente:</strong></td><td>${nombre}</td></tr>
                <tr><td><strong>Email:</strong></td><td>${email}</td></tr>
                <tr><td><strong>Teléfono:</strong></td><td>${telefono}</td></tr>
                <tr><td><strong>Paquete:</strong></td><td>${paquete}</td></tr>
                <tr><td><strong>Monto Pagado:</strong></td><td>$${monto.toFixed(2)} MXN</td></tr>
                <tr><td><strong>¿Solicitó Factura?:</strong></td><td>${pidioFactura ? '✅ Sí (revisa el otro correo con los datos fiscales)' : '❌ No'}</td></tr>
                <tr><td><strong>Dirección de Envío:</strong></td><td><pre style="font-family: inherit; margin: 0;">${direccion}</pre></td></tr>
            </table>
            <p>Por favor, comience a preparar el envío en los próximos 3-7 días hábiles.</p>
        `;

        try {
            await transporter.sendMail({
                from: `"RescueChip Ventas" <${process.env.SMTP_USER}>`,
                to: process.env.NOTIFY_EMAIL || "chiprescue2025@gmail.com",
                subject: `Nueva venta - RescueChip [${paquete}]`,
                html: emailHtml,
            });
            console.log("Notificación de venta enviada por email.");
        } catch (mailError) {
            console.error("Error enviando email de notificación de venta:", mailError);
            // No bloqueamos a Stripe si falla el envío de correo.
        }
    }

    return NextResponse.json({ received: true });
}
