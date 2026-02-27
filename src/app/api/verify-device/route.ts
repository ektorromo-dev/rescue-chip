import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role to bypass RLS and perform admin auth tasks 
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get('token');
    const action = searchParams.get('action'); // 'allow' or 'revoke'

    if (!token || !action) {
        return NextResponse.json({ error: "Parámetros inválidos o incompletos." }, { status: 400 });
    }

    try {
        // 1. Find the session with this token
        const { data: session, error: sessionError } = await supabaseAdmin
            .from('user_sessions')
            .select('*')
            .eq('verification_token', token)
            .single();

        if (sessionError || !session) {
            return new NextResponse(`
                <html><body>
                <div style="font-family:sans-serif; text-align:center; padding: 50px;">
                    <h2 style="color: #ef4444;">Enlace inválido o expirado</h2>
                    <p>La solicitud de acceso ya no es válida o el enlace está corrupto.</p>
                </div>
                </body></html>
            `, { status: 400, headers: { 'Content-Type': 'text/html' } });
        }

        // 2. Check expiration (15 minutes)
        const now = new Date();
        const expiresAt = new Date(session.token_expires_at);

        if (now > expiresAt) {
            return new NextResponse(`
                <html><body>
                <div style="font-family:sans-serif; text-align:center; padding: 50px;">
                    <h2 style="color: #ef4444;">El token ha expirado</h2>
                    <p>Por seguridad, los enlaces de verificación expiran en 15 minutos. Inicia sesión nuevamente en tu dispositivo para solicitar otro código.</p>
                </div>
                </body></html>
            `, { status: 400, headers: { 'Content-Type': 'text/html' } });
        }

        // 3. Process action
        if (action === 'allow') {
            // Marca TODAS las otras sesiones de este usuario como 'revoked'
            await supabaseAdmin
                .from('user_sessions')
                .update({ status: 'revoked' })
                .eq('user_id', session.user_id)
                .neq('id', session.id);

            // Marca esta sesión como verificada y limpia el token para que no se re-use
            await supabaseAdmin
                .from('user_sessions')
                .update({
                    status: 'verified',
                    verification_token: null,
                    token_expires_at: null
                })
                .eq('id', session.id);

            return new NextResponse(`
                <html><body>
                <div style="font-family:sans-serif; text-align:center; padding: 50px; max-width: 500px; margin: 0 auto;">
                    <h2 style="color: #10b981;">Dispositivo Autorizado Exitosamente ✅</h2>
                    <p style="font-size: 16px; color: #4b5563;">Has permitido el acceso a este nuevo dispositivo. <b>Tus sesiones previas en otros dispositivos han sido cerradas por seguridad (1 activo a la vez).</b></p>
                    <p style="margin-top: 30px; font-size: 14px;">Ya puedes volver a la ventana de tu dispositivo e ingresar a tu cuenta automáticamente.</p>
                </div>
                </body></html>
             `, { status: 200, headers: { 'Content-Type': 'text/html' } });

        } else if (action === 'revoke') {

            // Revoque local en la bd
            await supabaseAdmin
                .from('user_sessions')
                .update({
                    status: 'revoked',
                    verification_token: null,
                    token_expires_at: null
                })
                .eq('user_id', session.user_id);

            // Revoque global usando supabase auth admin API
            try {
                await supabaseAdmin.auth.admin.signOut(session.user_id, 'global');
            } catch (signOutErr) {
                console.error("Global signout via admin API failed:", signOutErr);
                // Continue despite failure, DB revoked status will block frontend anyway
            }

            return new NextResponse(`
                <html><body>
                <div style="font-family:sans-serif; text-align:center; padding: 50px; max-width: 500px; margin: 0 auto;">
                    <h2 style="color: #ef4444;">Acceso Bloqueado y Sesión Cerrada 🔒</h2>
                    <p style="font-size: 16px; color: #4b5563;">El intento de acceso fue bloqueado. Como medida preventiva, <b>hemos cerrado sesión en todos tus dispositivos.</b></p>
                    <p style="margin-top: 30px; font-size: 14px;">Protege tu cuenta actualizando tu contraseña en el próximo inicio de sesión si crees que alguien más la obtuvo.</p>
                </div>
                </body></html>
            `, { status: 200, headers: { 'Content-Type': 'text/html' } });

        } else {
            return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
        }

    } catch (error: any) {
        console.error("Error verifying device:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
