import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { rateLimitRequestDevice } from "@/lib/ratelimit";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
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
        const { deviceId } = body;

        if (!deviceId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
        const { success } = await rateLimitRequestDevice.limit(ip);
        if (!success) {
            console.warn(`Rate limit excedido para IP ${ip} en request-device-verification`);
            return NextResponse.json({ error: "Demasiadas peticiones. Intenta más tarde." }, { status: 429 });
        }

        // Validate user authentication using authorization header
        const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
        const token = authHeader?.replace("Bearer ", "")?.trim();

        if (!token) {
            console.error("No authorization header or token present");
            return NextResponse.json({ error: "No token" }, { status: 401 });
        }

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            console.error("Supabase auth error or missing user email:", authError);
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        // Generate one-time 15 min random verification token 
        const verificationToken = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);

        // Extract user agent for device info
        const deviceInfo = body.deviceInfo || req.headers.get("user-agent") || 'Unknown Device';

        // 1. Guardar en Supabase - Forma simple como en factura-notify para evitar errores del composite key default
        const { data: existingSession } = await supabaseAdmin
            .from('user_sessions')
            .select('id')
            .eq('user_id', user.id)
            .eq('device_id', deviceId)
            .maybeSingle();

        if (existingSession) {
            await supabaseAdmin.from('user_sessions').update({
                status: 'pending',
                device_info: deviceInfo,
                verification_token: verificationToken,
                token_expires_at: expiresAt.toISOString()
            }).eq('id', existingSession.id);
        } else {
            await supabaseAdmin.from('user_sessions').insert({
                user_id: user.id,
                device_id: deviceId,
                device_info: deviceInfo,
                status: 'pending',
                verification_token: verificationToken,
                token_expires_at: expiresAt.toISOString()
            });
        }

        // 2. Enviar Email de Notificación
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rescue-chip.com";
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 10px; overflow: hidden;">
                <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center;">
                    <h2 style="margin: 0;">Nuevo acceso detectado en RescueChip</h2>
                </div>
                <div style="padding: 30px; background-color: #ffffff;">
                    <p style="font-size: 16px; color: #333; line-height: 1.5;">Hola,</p>
                    <p style="font-size: 16px; color: #333; line-height: 1.5;">Hemos bloqueado temporalmente un intento de acceso a tu cuenta médica desde un dispositivo nuevo.</p>
                    <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 5px 0; font-size: 14px; color: #555;"><strong>Dispositivo:</strong> ${deviceInfo}</p>
                        <p style="margin: 5px 0; font-size: 14px; color: #555;"><strong>Fecha:</strong> ${new Date().toLocaleString('es-MX')}</p>
                    </div>
                    <p style="font-size: 16px; color: #333; line-height: 1.5; margin-bottom: 25px;">Por tu seguridad, RescueChip sólo permite un dispositivo activo a la vez. ¿Eres tú intentando acceder?</p>
                    
                    <a href="${baseUrl}/api/verify-device?token=${verificationToken}&action=allow" style="display: block; width: 100%; box-sizing: border-box; background-color: #2563eb; color: white; text-align: center; padding: 14px; text-decoration: none; font-weight: bold; font-size: 16px; border-radius: 8px; margin-bottom: 15px;">
                        Sí, soy yo — Permitir acceso
                    </a>
                    
                    <a href="${baseUrl}/api/verify-device?token=${verificationToken}&action=revoke" style="display: block; width: 100%; box-sizing: border-box; background-color: #fee2e2; color: #b91c1c; text-align: center; padding: 14px; text-decoration: none; font-weight: bold; font-size: 16px; border-radius: 8px;">
                        No fui yo — Cerrar todas las sesiones
                    </a>
                    
                    <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">Este enlace expira en 15 minutos. Si no solicitaste este acceso, recomendamos cerrar las sesiones de inmediato.</p>
                </div>
            </div>
        `;

        try {
            await transporter.sendMail({
                from: 'RescueChip Security <contacto@rescue-chip.com>',
                replyTo: 'contacto@rescue-chip.com',
                to: user.email,
                subject: "⚠️ ¿Eres tú? Nuevo acceso detectado en RescueChip",
                html: emailHtml,
            });
            console.log("Correo de verificación enviado al cliente.");
        } catch (mailError) {
            console.error("Error enviando email al cliente:", mailError);
        }

        return NextResponse.json({ success: true, message: "Verification endpoint reached" });

    } catch (error: any) {
        console.error("Error in request-device-verification general process:", error.message);
        return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
    }
}
