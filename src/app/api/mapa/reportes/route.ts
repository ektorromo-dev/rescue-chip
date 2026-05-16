import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: reportes } = await supabase
    .from('reportes_mapa')
    .select('id, tipo, descripcion, latitud, longitud, created_at')
    .eq('activo', true)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(100)

  const { data: incidentes } = await supabase
    .from('incidentes')
    .select('id, latitud, longitud, created_at')
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .not('latitud', 'is', null)
    .not('longitud', 'is', null)
    .limit(50)

  const puntos = [
    ...(reportes || []).map(r => ({
      id: r.id,
      tipo: r.tipo,
      descripcion: r.descripcion,
      latitud: r.latitud,
      longitud: r.longitud,
      fuente: 'reporte',
      created_at: r.created_at,
    })),
    ...(incidentes || []).map(i => ({
      id: i.id,
      tipo: 'accidente',
      descripcion: 'Emergencia registrada',
      latitud: i.latitud,
      longitud: i.longitud,
      fuente: 'emergencia',
      created_at: i.created_at,
    }))
  ]

  return NextResponse.json({ puntos })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 403 })
  }

  const { data: chipActivo } = await supabase
    .from('chips')
    .select('folio')
    .eq('owner_profile_id', profile.id)
    .eq('activated', true)
    .single()

  if (!chipActivo) {
    return NextResponse.json(
      { error: 'Necesitas un chip activo para reportar' }, 
      { status: 403 }
    )
  }

  const body = await req.json()
  const { tipo, descripcion, latitud, longitud } = body

  if (!tipo || !latitud || !longitud) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const tiposValidos = ['accidente', 'zona_peligrosa', 'obstruccion', 'desvio']
  if (!tiposValidos.includes(tipo)) {
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('reportes_mapa')
    .insert({
      profile_id: profile.id,
      tipo,
      descripcion: descripcion || null,
      latitud,
      longitud,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }

  return NextResponse.json({ id: data.id }, { status: 201 })
}
