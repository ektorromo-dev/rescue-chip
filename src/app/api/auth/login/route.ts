import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit';

const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, '15 m'),
});

export async function POST(request: Request) {
    const body = await request.json();
    const { email, password } = body;

    // Rate limit por email únicamente
    const identifier = `login:${email}`;
    const { success, remaining } = await ratelimit.limit(identifier);

    if (!success) {
        return Response.json(
            { error: 'Demasiados intentos. Espera 15 minutos.', isRateLimited: true },
            { status: 429 }
        );
    }

    // Autenticar con Supabase
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        return Response.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    // Determinar IP y User Agent
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    await logAuditEvent({
        userId: data.user?.id,
        action: 'login',
        ipAddress: ip,
        userAgent: userAgent,
        metadata: { method: 'password' }
    });

    return Response.json({ success: true, user: data.user, session: data.session });
}
