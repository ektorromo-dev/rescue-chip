import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
}

// Wrapper to handle environments without Redis gracefully
class RateLimiter {
    private ratelimit: Ratelimit | null = null;

    constructor(limit: number, window: string, prefix: string) {
        if (redis) {
            this.ratelimit = new Ratelimit({
                redis,
                limiter: Ratelimit.slidingWindow(limit, window as any),
                analytics: true,
                prefix,
            });
        }
    }

    async limit(identifier: string) {
        if (!this.ratelimit) {
            console.warn(`Rate limit bypassed for ${identifier}. Redis is not configured.`);
            return { success: true, remaining: 999, limit: 999 };
        }
        return await this.ratelimit.limit(identifier);
    }
}

// Limiters Definitions

// /api/request-device-verification: máximo 5 requests por IP por hora
export const rateLimitRequestDevice = new RateLimiter(5, "1 h", "@upstash/ratelimit/request-device");

// /api/verify-device: máximo 10 requests por IP por hora
export const rateLimitVerifyDevice = new RateLimiter(10, "1 h", "@upstash/ratelimit/verify-device");

// /login: máximo 10 intentos por IP por 15 minutos
export const rateLimitLogin = new RateLimiter(10, "15 m", "@upstash/ratelimit/login-v2");

// /activate: máximo 10 requests por IP por hora
export const rateLimitActivate = new RateLimiter(10, "1 h", "@upstash/ratelimit/activate");

// /api/send-emergency: máximo 3 requests por chip por hora
export const rateLimitSendEmergency = new RateLimiter(3, "1 h", "@upstash/ratelimit/send-emergency");

// /api/checkout: máximo 5 requests por IP por 15 minutos (tienda)
export const rateLimitCheckout = new RateLimiter(5, "15 m", "@upstash/ratelimit/checkout");

// /api/factura-notify: máximo 5 requests por IP por hora
export const rateLimitFactura = new RateLimiter(5, "1 h", "@upstash/ratelimit/factura");

// Endpoints APP MVP
// /api/app/chip/estado: 20 por hora por IP
export const rateLimitAppChipEstado = new RateLimiter(20, "1 h", "@upstash/ratelimit/app-chip-estado");

// /api/app/registro/solicitar-codigo: 5 por hora por email y 10 por hora por IP
export const rateLimitAppRegistroEmail = new RateLimiter(5, "1 h", "@upstash/ratelimit/app-reg-email");
export const rateLimitAppRegistroIp = new RateLimiter(10, "1 h", "@upstash/ratelimit/app-reg-ip");

// /api/app/dispositivo/solicitar-codigo: 5 por hora por usuario
export const rateLimitAppDispositivoUser = new RateLimiter(5, "1 h", "@upstash/ratelimit/app-disp-user");

// /api/app/vinculo-qr/{token}: 30 por hora por IP
export const rateLimitAppVinculoQrIp = new RateLimiter(30, "1 h", "@upstash/ratelimit/app-vinculo-qr-ip");

// /api/app/invitacion/{token}: 30 por hora por IP
export const rateLimitAppInvitacionIp = new RateLimiter(30, "1 h", "@upstash/ratelimit/app-invitacion-ip");
