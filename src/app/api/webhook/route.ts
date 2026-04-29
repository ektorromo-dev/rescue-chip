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

            // Guardar dirección de Stripe en la orden
            const shippingDetails = (session as any).shipping_details;
            if (shippingDetails?.address) {
                await supabase
                    .from("orders")
                    .update({
                        calle_numero: `${shippingDetails.address.line1 || ''} ${shippingDetails.address.line2 || ''}`.trim(),
                        ciudad: shippingDetails.address.city || null,
                        estado: shippingDetails.address.state || null,
                        codigo_postal: shippingDetails.address.postal_code || null,
                        colonia: shippingDetails.address.line2 || '',
                        referencia: shippingDetails.name || ''
                    })
                    .eq("id", order_id);
            }
        }

        // Extraer detalles del cliente
        const nombre = orderDetails?.nombre_receptor || session.customer_details?.name || "No especificado";
        const email = orderDetails?.email_cliente || session.customer_details?.email || "No especificado";
        const telefono = orderDetails?.telefono_receptor || session.customer_details?.phone || "No especificado";

        // Dirección de envío desde Stripe (shipping_address_collection)
        const shippingDetails = (session as any).shipping_details;
        let direccion = "No especificada";
        if (shippingDetails?.address) {
            const addr = shippingDetails.address;
            direccion = [
                shippingDetails.name || '',
                addr.line1 || '',
                addr.line2 || '',
                `${addr.city || ''}, ${addr.state || ''}`,
                `C.P. ${addr.postal_code || ''}`,
                addr.country || ''
            ].filter(line => line.trim()).join('\n');
        }

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
                from: 'RescueChip <contacto@rescue-chip.com>',
                replyTo: 'contacto@rescue-chip.com',
                to: process.env.NOTIFY_EMAIL || "chiprescue2025@gmail.com",
                subject: `Nueva venta - RescueChip [${paquete}]`,
                html: emailHtml,
            });
            console.log("Notificación de venta enviada al admin por email.");
        } catch (mailError) {
            console.error("Error enviando email de notificación de venta al admin:", mailError);
            // No bloqueamos a Stripe si falla el envío de correo.
        }

        // --- ENVIAR CORREO DE CONFIRMACIÓN AL CLIENTE ---
        if (email && email !== "No especificado") {
            const foliosHtml = '';

            const customerEmailHtml = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h1 style="color: #e11d48; margin-bottom: 5px;">RescueChip</h1>
                    <h2 style="color: #333; margin-top: 0;">¡Gracias por tu compra!</h2>
                    
                    <p style="color: #555; font-size: 16px;">Hola ${nombre},</p>
                    <p style="color: #555; font-size: 16px;">Tu pedido ha sido recibido y está siendo preparado.</p>
                    
                    <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #333;">Resumen de tu compra:</h3>
                        <ul style="color: #555; margin-bottom: 0;">
                            <li><strong>Paquete:</strong> ${paquete}</li>
                            <li><strong>Monto Pagado:</strong> $${monto.toFixed(2)} MXN</li>
                        </ul>
                    </div>
                    
                    ${foliosHtml}
                    
                    <p style="color: #555; font-size: 16px;">Recibirás tu pedido en 3-7 días hábiles en la dirección que proporcionaste.</p>
                    <p style="color: #555; font-size: 16px;">Una vez que recibas tus chips, ingresa a <a href="https://rescue-chip.com/activate" style="color: #e11d48; font-weight: bold;">rescue-chip.com/activate</a> para crear tu perfil médico de emergencia.</p>
                    
                    ${pidioFactura ? `<p style="color: #555; font-size: 16px; background-color: #fdf2f8; padding: 10px; border-left: 4px solid #db2777; margin: 20px 0;">Solicitaste factura. Recibirás tu CFDI y XML en un máximo de 72 horas hábiles.</p>` : ''}
                    
                    <div style="margin-top: 30px; font-size: 15px; color: #666;">
                        <p>Si tienes dudas, contáctanos:</p>
                        <p style="margin: 5px 0;"><strong>WhatsApp:</strong> +52 55 5143 3904</p>
                        <p style="margin: 5px 0;"><strong>Email:</strong> contacto@rescue-chip.com</p>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="font-size: 12px; color: #999; text-align: center;">&copy; 2025 RescueChip - Protección Inteligente</p>
                </div>
            `;

            try {
                await transporter.sendMail({
                    from: 'RescueChip <contacto@rescue-chip.com>',
                    replyTo: 'contacto@rescue-chip.com',
                    to: email,
                    subject: '¡Gracias por tu compra! - RescueChip',
                    html: customerEmailHtml,
                });
                console.log("Correo de confirmación enviado al cliente.");
            } catch (mailError) {
                console.error("Error enviando email al cliente:", mailError);
            }
        }
    }

    return NextResponse.json({ received: true });
}
