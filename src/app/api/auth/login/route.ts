import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimitLogin } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password } = body;

        console.log("[Login API] Procesando intento de login para:", email);

        if (!email || !password) {
            return NextResponse.json({ error: "Faltan credenciales." }, { status: 400 });
        }

        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || req.headers.get('x-real-ip')
            || '127.0.0.1';

        const identifier = `login-v3:ip:${ip}:email:${email}`;
        const { success } = await rateLimitLogin.limit(identifier);

        if (!success) {
            console.warn(`[Login API] Rate limit EXCEDIDO para ${identifier}`);
            return NextResponse.json({ error: "Demasiados intentos de inicio de sesión. Por favor, intenta repetirlo en 15 minutos.", isRateLimited: true }, { status: 429 });
        }

        const supabase = await createClient();

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        // El login fue exitoso y las cookies de sesión ya fueron parseadas por @supabase/ssr en server.ts
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[Login API] Error inesperado:", error);
        return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
    }
}
