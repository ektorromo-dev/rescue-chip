import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { folio, mode } = body;

  if (!folio) {
    return Response.json({ error: 'Folio requerido' }, { status: 400 });
  }

  // Usa service role porque las policies públicas de scan_tokens fueron eliminadas por seguridad.
  const supabase = createAdminClient();

  // Si viene mode, es para extender un token existente
  if (mode === 'emergencia' || mode === 'consulta') {
    const { token } = body;
    if (!token) {
      return Response.json({ error: 'Token requerido para extender' }, { status: 400 });
    }

    const minutes = mode === 'emergencia' ? 7 : 1;
    const newExpiry = new Date(Date.now() + minutes * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('scan_tokens')
      .update({ mode, expires_at: newExpiry })
      .eq('token', token)
      .eq('chip_folio', folio);

    if (error) {
      console.error('Error extending token:', error);
      return Response.json({ error: 'Error al extender token' }, { status: 500 });
    }

    return Response.json({ success: true, expires_at: newExpiry });
  }

  // Generar nuevo token
  const { data, error } = await supabase
    .from('scan_tokens')
    .insert({ chip_folio: folio.toUpperCase() })
    .select('token, expires_at')
    .single();

  if (error) {
    console.error('Error creating scan token:', error);
    return Response.json({ error: 'Error al crear token' }, { status: 500 });
  }

  return Response.json({ token: data.token, expires_at: data.expires_at });
}
