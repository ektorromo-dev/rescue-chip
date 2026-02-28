import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimitActivate } from '@/lib/ratelimit';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Extraer IP de forma agnóstica a Vercel/Localhost
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || '127.0.0.1';

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

    return NextResponse.next();
}

export const config = {
    // Especificar rutas explícitas para no invocar Redis/Upstash en cada request de assets
    matcher: ['/activate'],
};
