import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimitLogin, rateLimitActivate } from '@/lib/ratelimit';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Extraer IP de forma agnóstica a Vercel/Localhost
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";

    if (pathname.startsWith('/login')) {
        const { success } = await rateLimitLogin.limit(ip);
        if (!success) {
            return new NextResponse(`
                <html><body>
                <div style="font-family:sans-serif; text-align:center; padding: 50px;">
                    <h2 style="color: #ef4444;">Demasiados intentos de inicio de sesión</h2>
                    <p>Por seguridad, hemos bloqueado temporalmente tu IP. Por favor, intenta nuevamente en 15 minutos.</p>
                </div>
                </body></html>
            `, { status: 429, headers: { 'Content-Type': 'text/html' } });
        }
    }

    if (pathname.startsWith('/activate')) {
        const { success } = await rateLimitActivate.limit(ip);
        if (!success) {
            return new NextResponse(`
                <html><body>
                <div style="font-family:sans-serif; text-align:center; padding: 50px;">
                    <h2 style="color: #ef4444;">Límite de tráfico detectado</h2>
                    <p>Has alcanzado el límite máximo de solicitudes de activación por hora. Intenta más tarde.</p>
                </div>
                </body></html>
            `, { status: 429, headers: { 'Content-Type': 'text/html' } });
        }
    }

    // Rate Limiting para la ruta API de confirmación de email/webhook, si es que existen otras que queramos atrapar aquí
    // pero idealmente se manejan en sus propios route.ts.

    return NextResponse.next();
}

export const config = {
    // Especificar rutas explícitas para no invocar Redis/Upstash en cada request de assets
    matcher: ['/login', '/activate'],
};
