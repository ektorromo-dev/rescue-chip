import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password } = body;

        console.log("[Login API] Procesando intento de login para:", email);

        if (!email || !password) {
            return NextResponse.json({ error: "Faltan credenciales." }, { status: 400 });
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
