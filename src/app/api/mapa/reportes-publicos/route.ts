import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: reportes, error: errorReportes } = await supabase
    .from('reportes_mapa')
    .select('id, tipo, latitud, longitud, created_at')
    .eq('activo', true)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: incidentes, error: errorIncidentes } = await supabase
    .from('incidentes')
    .select('id, latitud, longitud, created_at')
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .not('latitud', 'is', null)
    .not('longitud', 'is', null)
    .limit(20)

  if (errorReportes || errorIncidentes) {
    return NextResponse.json({ error: 'Error fetching data' }, { status: 500 })
  }

  const reportesFormateados = (reportes || []).map(r => ({
    id: r.id,
    tipo: r.tipo,
    latitud: r.latitud,
    longitud: r.longitud,
    fuente: 'reporte',
    created_at: r.created_at,
  }))

  const incidentesFormateados = (incidentes || []).map(i => ({
    id: i.id,
    tipo: 'accidente',
    latitud: i.latitud,
    longitud: i.longitud,
    fuente: 'emergencia',
    created_at: i.created_at,
  }))

  return NextResponse.json({
    puntos: [...reportesFormateados, ...incidentesFormateados]
  })
}
