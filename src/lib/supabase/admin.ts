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
