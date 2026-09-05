# DIAGNÓSTICO DE ARQUITECTURA Y SYSTEM DESIGN — RESCUECHIP

> **Fecha del reporte:** 24 de Agosto de 2026  
> **Modo de ejecución:** Solo lectura (Read-Only)  
> **Proyecto:** RescueChip (`rescue-chip`)  
> **Stack principal:** Next.js (App Router) + Supabase + Vercel + Stripe + Twilio + Upstash Redis  

---

## 1. Conexión a Base de Datos

### 1.1 Inicialización del Cliente Supabase Server-Side

La inicialización del cliente server-side de Supabase se implementa en dos utilidades principales dentro de `src/lib/supabase/`:

#### A. `src/lib/supabase/server.ts`
Utilizado para solicitudes server-side que respetan la sesión del usuario a través de cookies HTTP (`@supabase/ssr`):

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}
```

#### B. `src/lib/supabase/admin.ts`
Utilizado para operaciones administrativas con `SUPABASE_SERVICE_ROLE_KEY` que requieren bypass de RLS (Row Level Security):

```typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase con service_role key.
 * Bypassa RLS — usar SOLO en server components y API routes server-side.
 * NUNCA importar desde un componente con "use client".
 *
 * Falla rápido si SUPABASE_SERVICE_ROLE_KEY no está configurado en el entorno.
 * Esto previene el patrón silencioso de fallback a anon key.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL no configurado');
  }
  if (!key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY no configurado. ' +
      'Este endpoint requiere acceso administrativo a la BD. ' +
      'Verifica las env vars en Vercel.'
    );
  }

  return createSupabaseClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
```

#### C. `src/lib/supabase/client.ts` (Client-Side Browser Client)
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

*Nota:* Varias rutas en `src/app/api/` (ej. `checkout`, `log-access`, `factura-notify`, `webhook`, `request-device-verification`) también instancian directamente `createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)` vía `@supabase/supabase-js`.

---

### 1.2 Variables de Conexión en `.env.local`

En el archivo `.env.local` existen las siguientes variables de entorno (solo nombres):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `TWILIO_WHATSAPP_NUMBER`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL`
- `NEXT_PUBLIC_MAPBOX_TOKEN`
- `NEXT_PUBLIC_OWM_TOKEN`

Otras variables de entorno encontradas por referencia en el código fuente:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `NOTIFY_EMAIL`
- `NEXT_PUBLIC_APP_URL`

**Variables de tipo Connection String (ej. `DATABASE_URL`, `POSTGRES_URL`):** no encontrado.

---

### 1.3 Puertos de Conexión (6543 vs 5432)

- **Puerto 6543 (Transaction Pooler):** no encontrado.
- **Puerto 5432 (Conexión directa Postgres):** no encontrado.

La conexión con Supabase se realiza **exclusivamente mediante peticiones HTTPS REST/PostgREST** a través de `@supabase/supabase-js` y `@supabase/ssr` (apuntando al endpoint HTTPS `https://<project-ref>.supabase.co`). No se utilizan sockets directos TCP a PostgreSQL.

---

### 1.4 Tipo de Conexión y Clientes en Paralelo

- Se utiliza el cliente estándar `@supabase/supabase-js` (v2.97.0) y `@supabase/ssr` (v0.8.0).
- **Conexiones directas Postgres en paralelo (`pg`, `postgres.js`, `prisma`, `drizzle`, `knex`):** no encontrado. No existe ningún ORM ni cliente nativo Postgres instalado en el proyecto.

---

## 2. Middleware y Rate Limiting

### 2.1 Contenido Completo de `src/middleware.ts`

```typescript
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

    // CORS — solo para rutas /api/
    if (request.nextUrl.pathname.startsWith('/api/')) {
        const origin = request.headers.get('origin');
        const allowedOrigins = [
            'https://rescue-chip.com',
            'https://www.rescue-chip.com',
        ];

        // Preflight OPTIONS
        if (request.method === 'OPTIONS') {
            return new NextResponse(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': allowedOrigins.includes(origin || '') ? origin! : '',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Access-Control-Max-Age': '86400',
                },
            });
        }

        // Para requests normales, agregar header CORS a la response
        if (allowedOrigins.includes(origin || '')) {
            res.headers.set('Access-Control-Allow-Origin', origin!);
        }
        // Si el origin no está en la lista, NO se agrega el header — el browser bloquea
    }

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
    if (pathname.startsWith('/activate') && request.method === 'POST') {
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
    matcher: ['/activate', '/admin/:path*', '/dashboard/:path*'],
};
```

---

### 2.2 Configuración de Upstash Redis (`@upstash/redis` y `@upstash/ratelimit`)

#### A. Archivo Central: `src/lib/ratelimit.ts`

```typescript
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
```

#### B. Archivo Específico: `src/app/api/auth/login/route.ts`

Implementa su propia instancia directa de `Ratelimit` por email:

```typescript
const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, '15 m'),
});

// En el handler POST:
const identifier = `login:${email}`;
const { success, remaining } = await ratelimit.limit(identifier);
```

#### C. Tabla Resumen de Límites, Ventanas y Cobertura

| Nombre Limitador | Límite | Ventana | Identificador | Rutas que cubre |
| :--- | :--- | :--- | :--- | :--- |
| `rateLimitRequestDevice` | 5 req | 1 hora (`slidingWindow`) | `device-verify:${user.email}` | `POST /api/request-device-verification` |
| `rateLimitVerifyDevice` | 10 req | 1 hora (`slidingWindow`) | IP del cliente | `GET /api/verify-device` |
| `rateLimitLogin` / direct | 10 req | 15 min (`slidingWindow`) | `login:${email}` | `POST /api/auth/login` |
| `rateLimitActivate` | 10 req | 1 hora (`slidingWindow`) | `activate:${folio}` | `src/middleware.ts` (POST /activate), `GET /api/activate/validate` |
| `rateLimitSendEmergency` | 3 req | 1 hora (`slidingWindow`) | `emergency:${chip_folio}` | `POST /api/log-access` (cuando `tipo === 'emergencia'`) |
| `rateLimitCheckout` | 5 req | 15 min (`slidingWindow`) | IP del cliente | `POST /api/checkout` |
| `rateLimitFactura` | 5 req | 1 hora (`slidingWindow`) | IP del cliente | `POST /api/factura-notify` |

*Rutas de emergencia médica (`/profile/[id]`):* **Sin rate limiting** (Cumpliendo la regla del producto).

---

## 3. Rutas y API

### 3.1 Lista de Archivos en `src/app/api/`

| Archivo | Descripción |
| :--- | :--- |
| `src/app/api/activate/complete/route.ts` | Valida que el chip/folio no esté activado, inserta el perfil médico en `profiles`, actualiza el chip a `status: 'activado'` y realiza rollback si el update falla. |
| `src/app/api/activate/link-to-mine/route.ts` | Vincula un chip/folio adicional sin activar a un perfil médico ya existente del usuario (`perfil_compartido: true`). |
| `src/app/api/activate/validate/route.ts` | Valida (con rate limit previo) si un folio existe en base de datos y está en estado `disponible` o `vendido` para activarse. |
| `src/app/api/auth/login/route.ts` | Autentica credenciales con Supabase Auth (`signInWithPassword`), aplica rate limit por email y registra auditoría. |
| `src/app/api/checkout/route.ts` | Crea el registro preliminar en `orders` y genera una sesión de pago en Stripe Checkout con rate limit por IP. |
| `src/app/api/emergencia/en-camino/route.ts` | Marca el incidente como `familiar_en_camino: true` y envía alertas por Twilio SMS y Nodemailer en paralelo a los contactos de emergencia. |
| `src/app/api/factura-notify/route.ts` | Inserta solicitud fiscal en `factura_requests` y envía notificación por correo electrónico al administrador con rate limit por IP. |
| `src/app/api/factura-postpago/route.ts` | Registra solicitud de factura posterior al pago asociada al `session_id` de Stripe y actualiza la orden. |
| `src/app/api/get-ip/route.ts` | Retorna la dirección IP pública del cliente extrayéndola de los encabezados HTTP. |
| `src/app/api/log-access/route.ts` | Registra lecturas del chip en `chip_accesos`; si es emergencia real, valida el token temporal de escaneo, crea incidente en `incidentes` y despacha alertas por Twilio SMS, Twilio WhatsApp y Nodemailer. |
| `src/app/api/log-scan/route.ts` | Endpoint ligero para registrar escaneos o accesos simples en `chip_accesos`. |
| `src/app/api/mapa/reportes/route.ts` | Consulta y publica alertas ciudadanas/viales en el mapa interactivo (requiere autenticación y chip activo). |
| `src/app/api/mapa/reportes-publicos/route.ts` | Retorna el listado público y consolidado de reportes e incidentes activos para el mapa público. |
| `src/app/api/request-device-verification/route.ts` | Genera un token UUID de 15 minutos para verificación de nuevo dispositivo, lo almacena en `user_sessions` y envía correo con enlaces de autorización/revocación. |
| `src/app/api/scan-token/route.ts` | Crea o extiende la expiración de tokens temporales de escaneo (`scan_tokens`) para acceso público seguro al perfil médico. |
| `src/app/api/verify-device/route.ts` | Procesa las acciones `allow` (autoriza dispositivo) o `revoke` (revoca sesión y ejecuta `signOut` global de Supabase Auth). |
| `src/app/api/webhook/route.ts` | Recibe y verifica webhooks de Stripe (`checkout.session.completed`), actualiza el pedido a pagado, extrae dirección de envío y envía correos de confirmación. |

---

### 3.2 Tipo de Llamada a Twilio y Stripe (Await Bloqueante vs Fire-and-Forget)

| Endpoint | Servicio Llamado | Tipo de Llamada | Detalle en Código |
| :--- | :--- | :--- | :--- |
| `src/app/api/checkout/route.ts` | **Stripe** | **`await` Bloqueante** | `const session = await stripe.checkout.sessions.create({...});` |
| `src/app/api/webhook/route.ts` | **Stripe** | **`await` Bloqueante** | `fullSession = await stripe.checkout.sessions.retrieve(session.id, {...});` |
| `src/app/api/emergencia/en-camino/route.ts` | **Twilio** | **`await` Bloqueante** | `twilioClient.messages.create({...})` empujado a un array y esperado con `await Promise.all(allNotificationPromises);` |
| `src/app/api/log-access/route.ts` | **Twilio** (SMS + WhatsApp) | **`await` Bloqueante** | `await twilioClient.messages.create({...})` dentro de promesas esperadas con `await Promise.all(notificationPromises);` |

---

### 3.3 Verificación de Webhooks de Stripe

- `src/app/api/webhooks/stripe/route.ts`: **no encontrado**.
- **Confirmación:** El webhook de Stripe está implementado en la ruta **`src/app/api/webhook/route.ts`** (en singular).

---

## 4. Twilio

### 4.1 Archivos donde se Inicializa o Llama al Cliente de Twilio

Twilio se inicializa únicamente en 2 archivos del proyecto:
1. `src/app/api/log-access/route.ts`
2. `src/app/api/emergencia/en-camino/route.ts`

Ambos inicializan el cliente con el SDK oficial:
```typescript
import twilio from "twilio";

const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);
```

---

### 4.2 Código de la Función que Envía el SMS de Emergencia

Ubicado en `src/app/api/log-access/route.ts` (disparado cuando `tipo === "emergencia"`):

```typescript
// --- TWILIO SMS & WHATSAPP INTEGRATION ---

const plainLocation = latitud && longitud
    ? `https://maps.google.com/?q=${latitud},${longitud}`
    : "No disponible";

// Shortened to < 160 characters for WhatsApp/SMS compatibility
const textMessageBody = incidentUrl
    ? `⚠️ RESCUECHIP EMERGENCIA: ${userName} necesita ayuda. GPS: ${plainLocation}. Instrucciones: ${incidentUrl}`
    : `⚠️ RESCUECHIP EMERGENCIA: ${userName} necesita ayuda. GPS: ${plainLocation}. Llama al 911.`;

const ownerPhones = [];

// Extract contact phones
const contactPhones = contacts
    .filter((c: any) => c.phone && c.phone.trim() !== '')
    .map((c: any) => c.phone.trim());

// Find if profile has an owner phone directly natively? 
if (profileData.user_id) {
    const { data: userData } = await supabase.auth.admin.getUserById(profileData.user_id);
    if (userData && userData.user && userData.user.phone) {
        ownerPhones.push(userData.user.phone);
    }
}

// Fallback: usar phone de profiles si auth.users no tiene
if (ownerPhones.length === 0 && profileData.phone) {
    ownerPhones.push(profileData.phone);
}

const allPhonesToNotify = Array.from(new Set([...ownerPhones, ...contactPhones]));

// Trigger notifications concurrently
const notificationPromises = allPhonesToNotify.map(async (rawPhone) => {
    const formattedPhone = formatStoredPhone(rawPhone);

    console.log(`[Twilio Pre-Send Check] Procesando SMS para destino: ${formattedPhone}`);

    // 1) SEND SMS
    try {
        await twilioClient.messages.create({
            body: textMessageBody,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: formattedPhone
        });
        console.log(`[Twilio SMS] Enviado exitosamente a ${formattedPhone}`);
    } catch (smsError: any) {
        console.error(`[Twilio SMS Error] Falló el envío a ${formattedPhone}:`, smsError.message);
    }

    // 2) SEND WHATSAPP
    const waTo = `whatsapp:${formattedPhone}`;
    console.log(`[Twilio Pre-Send Check] Procesando WhatsApp para destino: ${waTo}`);
    try {
        const waFrom = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";
        await twilioClient.messages.create({
            body: textMessageBody,
            from: waFrom,
            to: waTo
        });
        console.log(`[Twilio WA] Enviado exitosamente a ${waTo}`);
    } catch (waError: any) {
        console.error(`[Twilio WA Error] Falló el envío a ${waTo}:`, waError.message);
    }
});

// Wait for all messages across all phones to finish attempting
await Promise.all(notificationPromises);
```

---

### 4.3 Manejo de Reintentos, Colas o Límites de Envíos por Segundo

- **Manejo de reintentos:** **No existe**. Las llamadas a `twilioClient.messages.create` están envueltas en un bloque `try/catch` individual que registra el error en `console.error` pero no realiza reintentos automáticos ni reencolamiento.
- **Mecanismo de Cola (Queue/Job Worker):** **No existe**. Las llamadas se ejecutan de manera síncrona dentro del ciclo de vida de la petición HTTP del serverless function en Vercel.
- **Límite de envíos por segundo (Throttling Twilio MPS):** **No existe**. Se disparan todas las solicitudes simultáneamente con `Promise.all`.
- **Rate Limit de Aplicación:** Se controla a nivel macro con Upstash Redis (`rateLimitSendEmergency`: máximo 3 peticiones de emergencia por folio por hora).

---

## 5. Estructura de Base de Datos

### 5.1 Tablas Referenciadas en el Código Fuente

Conteo exacto de llamadas `supabase.from('nombre_tabla')` en el proyecto:

| # | Nombre de la Tabla | Ocurrencias en el Código |
| :---: | :--- | :---: |
| 1 | `profiles` | 19 |
| 2 | `user_sessions` | 15 |
| 3 | `chips` | 13 |
| 4 | `orders` | 7 |
| 5 | `incidentes` | 7 |
| 6 | `scan_tokens` | 4 |
| 7 | `chip_accesos` | 3 |
| 8 | `reportes_mapa` | 3 |
| 9 | `factura_requests` | 2 |
| 10 | `puntos_de_venta` | 2 |
| 11 | `admin_emergencies` | 1 |
| 12 | `admin_sales` | 1 |
| 13 | `admin_workshops` | 1 |
| 14 | `admin_b2b_pipeline` | 1 |
| 15 | `audit_logs` | 1 |
| 16 | `user_push_tokens` | 1 |

*Adicionalmente, se identificaron 2 Supabase Storage Buckets referenciados mediante `supabase.storage.from('bucket')`:*
- `polizas`: 5 ocurrencias
- `profile-photos`: 4 ocurrencias

---

### 5.2 Archivos de Migraciones SQL en el Repositorio

- Carpeta `supabase/migrations/`: **no encontrado**.
- Archivos `.sql` encontrados en la raíz del repositorio:

| Archivo | Fecha de Modificación | Tamaño |
| :--- | :--- | :--- |
| `database_update.sql` | 27/02/2026, 06:32:58 p. m. | 1,521 bytes |
| `supabase_schema.sql` | 27/02/2026, 02:15:31 p. m. | 9,972 bytes |
| `supabase_audit_logs.sql` | 03/03/2026, 02:03:42 p. m. | 924 bytes |

*(Nota: En el directorio padre `c:\Claude\Chip NFC\` existe adicionalmente `insert_folios_supabase.sql` con fecha 18/03/2026, 08:37:49 p. m., 7,767 bytes).*

---

## 6. Configuración de Deploy

### 6.1 `vercel.json`

- **Estado:** **no encontrado** (el archivo `vercel.json` no existe en el repositorio).

---

### 6.2 `next.config.ts`

Contenido completo actual de `next.config.ts`:

```typescript
import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdnjs.cloudflare.com https://connect.facebook.net https://api.mapbox.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.mapbox.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://*.stripe.com https://*.google.com https://*.googleapis.com https://*.supabase.co https://img.youtube.com https://i.ytimg.com https://www.facebook.com https://*.cartocdn.com https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org https://*.mapbox.com https://tile.openweathermap.org; media-src 'self' https://*.supabase.co blob:; frame-src https://js.stripe.com https://hooks.stripe.com https://www.youtube.com https://youtube.com; connect-src 'self' https://*.supabase.co https://api.stripe.com https://*.sentry.io https://*.google.com https://*.googleapis.com https://connect.facebook.net https://*.cartocdn.com https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org https://api.mapbox.com https://events.mapbox.com https://*.mapbox.com https://api.open-meteo.com https://overpass-api.de https://api.mapbox.com https://api.mapbox.com/directions; worker-src blob:; object-src 'none'; base-uri 'self'"
          }
        ],
      },
      {
        source: '/profile/:id',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "rescuechip",
  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
```

---

### 6.3 Versiones de Next.js y Node en `package.json`

- **Next.js:** `16.1.6` (declarada en `"dependencies": { "next": "16.1.6" }` y `"devDependencies": { "eslint-config-next": "16.1.6" }`).
- **React:** `19.2.3`
- **Node.js:** `@types/node: "^20"` en `devDependencies`. *(No hay campo `"engines"` definido en `package.json`).*

---

## 7. Cache

### 7.1 Cache en Rutas `/profile/[id]`

- **Directiva de Renderizado:** `export const dynamic = 'force-dynamic'` en `src/app/profile/[id]/page.tsx` (Línea 8).
- **Headers HTTP en `next.config.ts`:**
  ```typescript
  {
    source: '/profile/:id',
    headers: [
      { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' },
      { key: 'Pragma', value: 'no-cache' },
      { key: 'Expires', value: '0' },
    ],
  }
  ```
- **Uso de `unstable_cache` / React `cache()`:** no encontrado en `/profile/[id]`.
- **Ruta de Emergencia `/emergencia/[token]/page.tsx`:** Contiene `export const dynamic = 'force-dynamic'` y `export const revalidate = 0`.

---

### 7.2 Cache en Rutas `/api/*`

- **Uso de `revalidate` en `/api/`:** no encontrado.
- **Uso de `unstable_cache` en `/api/`:** no encontrado.
- **Uso de React `cache()` en `/api/`:** no encontrado.
- **Headers personalizados de `Cache-Control` en respuestas `/api/`:** no encontrado.
- **Comportamiento:** Todas las rutas en `src/app/api/` ejecutan handlers dinámicos estándar (`POST` o `GET` con llamadas dinámicas a Supabase/headers/cookies) sin capas de cache intermedia.

---
