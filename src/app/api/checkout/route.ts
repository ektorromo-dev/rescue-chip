import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
    try {
        // Utiliza la variable de entorno, asegúrate de que esté configurada en Vercel/.env.local
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
            apiVersion: "2023-10-16" as any,
        });

        const { paquete, factura_id } = await req.json();

        let priceData = {
            product_data: { name: "", description: "" },
            unit_amount: 0,
        };

        switch (paquete) {
            case "individual":
                priceData.product_data.name = "Paquete Individual";
                priceData.product_data.description = "1 chip NFC + sticker + activación + envío gratis";
                priceData.unit_amount = 34900; // 349.00 MXN en centavos
                break;
            case "pareja":
                priceData.product_data.name = "Paquete Pareja";
                priceData.product_data.description = "2 chips NFC + stickers + activación + envío gratis";
                priceData.unit_amount = 54900; // 549.00 MXN
                break;
            case "familiar":
                priceData.product_data.name = "Paquete Familiar";
                priceData.product_data.description = "4 chips NFC + stickers + activación + envío gratis";
                priceData.unit_amount = 94900; // 949.00 MXN
                break;
            default:
                return NextResponse.json({ error: "Paquete no válido" }, { status: 400 });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: [
                {
                    price_data: {
                        currency: "mxn",
                        product_data: priceData.product_data,
                        unit_amount: priceData.unit_amount,
                    },
                    quantity: 1,
                },
            ],
            // Pedir nombre y telefono
            customer_creation: "always",
            phone_number_collection: { enabled: true },
            // Envio a Mexico
            shipping_address_collection: {
                allowed_countries: ["MX"],
            },
            // URLS
            success_url: `${req.headers.get("origin")}/shop/success?session_id={CHECKOUT_SESSION_ID}${factura_id ? '&factura=true' : ''}`,
            cancel_url: `${req.headers.get("origin")}/shop`,
            metadata: {
                paquete,
                factura: factura_id ? "true" : "false",
                factura_id: factura_id || "none"
            }
        });

        if (factura_id) {
            await supabase
                .from("factura_requests")
                .update({ session_id: session.id })
                .eq("id", factura_id);
        }

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error("Error creating checkout session:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
