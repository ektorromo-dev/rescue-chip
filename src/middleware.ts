import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimitLogin, rateLimitActivate } from '@/lib/ratelimit';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Extraer IP de forma agnóstica a Vercel/Localhost
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || '127.0.0.1';
    // 1. Logs de depuración para Upstash Redis
    console.log("[Middleware] Route Intercepted:", pathname);
    console.log("[Middleware] UPSTASH_REDIS_REST_URL exists:", !!process.env.UPSTASH_REDIS_REST_URL);
    console.log("[Middleware] Request Method:", request.method);

    // Rate Limit solo para peticiones POST (intentos de login reales) sobre nuestra propia API route
    if (pathname.startsWith('/api/auth/login') && request.method === 'POST') {
        const result = await rateLimitLogin.limit(ip);
        console.log(`[Middleware] Rate Limit Login check for IP ${ip}. Success: ${result.success}, Remaining: ${result.remaining}, Limit: ${result.limit}`);

        if (!result.success) {
            return NextResponse.json(
                { error: "Demasiados intentos de inicio de sesión. Por favor, intenta repetirlo en 15 minutos." },
                { status: 429 }
            );
        }
    }

    // Adaptamos activate para que atrape solo POSTs a la API o interceptaremos el page load pero mejor POST:
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
    matcher: ['/api/auth/login', '/activate'],
};
