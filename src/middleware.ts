import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimitActivate } from '@/lib/ratelimit';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    let res = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    // Extraer IP de forma agnóstica a Vercel/Localhost
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || '127.0.0.1';

    // Protección de rutas de Admin
    if (pathname.startsWith('/admin')) {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            request.cookies.set(name, value)
                            res.cookies.set(name, value, options)
                        })
                    },
                },
            }
        );
        const { data: { session } } = await supabase.auth.getSession();

        if (!session || session.user.email !== process.env.ADMIN_EMAIL) {
            return NextResponse.redirect(new URL('/login?redirect=/admin', request.url));
        }
    }

    // Adaptamos activate para que atrape solo POSTs a la API o interceptaremos el page load pero mejor POST:
    if (pathname.startsWith('/activate')) {
        const folio = request.nextUrl.searchParams.get('folio');
        if (!folio) {
            // Sin folio = acceso directo a la página, no aplicar rate limit
            return res;
        }

        const identifier = `activate:${folio}`;
        const { success } = await rateLimitActivate.limit(identifier);

        if (!success) {
            return new NextResponse(`
                <html><body>
                <div style="font-family:sans-serif; text-align:center; padding: 50px;">
                    <h2 style="color: #ef4444;">Limite de trafico detectado</h2>
                    <p>Has alcanzado el maximo de solicitudes por hora. Intenta mas tarde.</p>
                </div>
                </body></html>
            `, { status: 429, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }
    }

    return res;
}

export const config = {
    // Especificar rutas explícitas para no invocar Redis/Upstash en cada request de assets
    matcher: ['/activate', '/admin/:path*'],
};
