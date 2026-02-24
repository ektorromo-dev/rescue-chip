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
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { chip_folio, tipo, latitud, longitud, session_token } = body;

        if (!chip_folio || !tipo || !session_token) {
            return NextResponse.json({ error: "Faltan datos requeridos." }, { status: 400 });
        }

        const ip_address = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "Desconocida";
        const user_agent = req.headers.get("user-agent") || "Desconocido";

        // 1. Insertar el log de acceso
        const { error: insertError } = await supabase
            .from("chip_accesos")
            .insert({
                chip_folio,
                tipo,
                latitud,
                longitud,
                ip_address,
                user_agent,
                session_token
            });

        if (insertError) {
            console.error("Error al registrar el acceso:", insertError);
            // No bloqueamos todo por fallar el log, pero advertimos
        }

        // 2. Si es emergencia, enviar notificación
        if (tipo === "emergencia") {
            // Obtener el ID de usuario del dueño de este chip
            const { data: chipData } = await supabase
                .from("chips")
                .select("id")
                .ilike("folio", chip_folio)
                .single();

            if (chipData) {
                const { data: profileData } = await supabase
                    .from("profiles")
                    .select("user_id")
                    .eq("chip_id", chipData.id)
                    .single();

                if (profileData && profileData.user_id) {
                    // Buscar el email en auth.users (requiere Service Role)
                    // Como no hay una función directa exportada, usaremos rpc o admin api si está disponible.
                    // Afortunadamente, Supabase js proporciona admin.getUserById
                    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profileData.user_id);

                    if (userData && userData.user && userData.user.email) {
                        const ownerEmail = userData.user.email;

                        const mapsLink = latitud && longitud
                            ? `<a href="https://www.google.com/maps?q=${latitud},${longitud}">Ver Ubicación en Google Maps</a>`
                            : "Ubicación GPS no proporcionada/detectada.";

                        const fechaStr = new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" });

                        const emailHtml = `
                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #e11d48; border-radius: 10px;">
                                <h2 style="color: #e11d48; margin-top: 0; text-align: center;">⚠️ ALERTA DE EMERGENCIA ⚠️</h2>
                                <h3 style="color: #333; text-align: center;">Tu RescueChip fue escaneado</h3>
                                
                                <p style="font-size: 16px;">Tu dispositivo con folio <strong>${chip_folio}</strong> fue escaneado.</p>
                                
                                <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                    <ul style="color: #991b1b; margin-bottom: 0;">
                                        <li><strong>Tipo de Escaneo:</strong> Emergencia Real</li>
                                        <li><strong>Fecha y Hora:</strong> ${fechaStr}</li>
                                        <li><strong>Ubicación Aproximada:</strong> ${mapsLink}</li>
                                        <li><strong>Dispositivo que escaneó:</strong> ${user_agent}</li>
                                    </ul>
                                </div>
                                
                                <p style="color: #555; font-size: 14px; text-align: center;">Si NO te encuentras en una emergencia, por favor contacta inmediatamente a soporte:</p>
                                <p style="text-align: center;"><a href="mailto:contacto@rescue-chip.com" style="color: #e11d48; font-weight: bold;">contacto@rescue-chip.com</a></p>
                            </div>
                        `;

                        try {
                            await transporter.sendMail({
                                from: 'RescueChip <contacto@rescue-chip.com>',
                                replyTo: 'contacto@rescue-chip.com',
                                to: ownerEmail,
                                subject: "⚠️ ALERTA: Tu chip RescueChip fue escaneado en una emergencia",
                                html: emailHtml,
                            });
                            console.log("Notificación de emergencia enviada al dueño.");
                        } catch (mailError) {
                            console.error("Error enviando email de emergencia:", mailError);
                        }
                    } else {
                        console.error("No se pudo obtener el email del dueño del chip via Auth Admin.", userError);
                    }
                }
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Error en log-access:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
