import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ token: string }>;
}

interface IncidenteRecord {
  id: string;
  profile_id: string | null;
  expires_at: string;
}

interface RiderLocationRecord {
  latitude: number;
  longitude: number;
  trip_active: boolean;
  updated_at: string;
}

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store',
};

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { token } = await context.params;

    if (!token) {
      return NextResponse.json(
        { error: 'No encontrado' },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    const supabase = createAdminClient();

    // 1. Buscar incidente por token
    const { data: incidente, error: incidenteError } = await supabase
      .from('incidentes')
      .select('id, profile_id, expires_at')
      .eq('token', token)
      .single<IncidenteRecord>();

    if (incidenteError || !incidente) {
      return NextResponse.json(
        { error: 'No encontrado' },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    // 2. Validar expiración del enlace
    if (new Date(incidente.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Enlace expirado' },
        { status: 410, headers: NO_CACHE_HEADERS }
      );
    }

    // 3. Validar si tiene profile_id asociado
    if (!incidente.profile_id) {
      return NextResponse.json(
        { available: false },
        { status: 200, headers: NO_CACHE_HEADERS }
      );
    }

    // 4. Buscar última ubicación del rider
    const { data: location, error: locationError } = await supabase
      .from('rider_locations')
      .select('latitude, longitude, trip_active, updated_at')
      .eq('profile_id', incidente.profile_id)
      .maybeSingle<RiderLocationRecord>();

    if (locationError || !location) {
      return NextResponse.json(
        { available: false },
        { status: 200, headers: NO_CACHE_HEADERS }
      );
    }

    // 5. Responder con la ubicación encontrada
    return NextResponse.json(
      {
        available: true,
        latitude: location.latitude,
        longitude: location.longitude,
        tripActive: location.trip_active,
        updatedAt: location.updated_at,
      },
      {
        status: 200,
        headers: NO_CACHE_HEADERS,
      }
    );
  } catch (error) {
    console.error('Error al consultar ubicación de emergencia:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
