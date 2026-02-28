import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimitLogin, rateLimitActivate } from '@/lib/ratelimit';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    console.log('[DEBUG IP]', {
        forwarded: request.headers.get('x-forwarded-for'),
        realIp: request.headers.get('x-real-ip')
    });

    // Extraer IP de forma agnóstica a Vercel/Localhost
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || '127.0.0.1';

    // 1. Logs de depuración para Upstash Redis
    console.log("[Middleware] Route Intercepted:", pathname);
    console.log("[Middleware] UPSTASH_REDIS_REST_URL exists:", !!process.env.UPSTASH_REDIS_REST_URL);
    console.log("[Middleware] Request Method:", request.method);

    // EL RATE LIMIT DE LOGIN SE MOVIÓ A /api/auth/login/route.ts CON ACCESO NATIVO AL BODY DEL REQUEST


    // Adaptamos activate para que atrape solo POSTs a la API o interceptaremos el page load pero mejor POST:
    if (pathname.startsWith('/activate')) {
        const identifier = `activate-v3:${ip}`;
        const { success } = await rateLimitActivate.limit(identifier);
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
