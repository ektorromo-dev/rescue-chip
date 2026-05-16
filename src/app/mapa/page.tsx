'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
import Link from 'next/link'

const MapaTeaser = dynamic(
  () => import('@/components/mapa/MapaTeaser'),
  { ssr: false }
)
const MapaDashboard = dynamic(
  () => import('@/components/mapa/MapaDashboard'),
  { ssr: false }
)

type Estado = 'cargando' | 'no_auth' | 'sin_chip' | 'activo'

export default function MapaPage() {
  const [estado, setEstado] = useState<Estado>('cargando')

  useEffect(() => {
    const supabase = createClient()

    const checkAuth = async (userId: string | undefined) => {
      if (!userId) {
        setEstado('no_auth')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      if (!profile) {
        // Autenticado pero sin perfil = sin chip activo
        setEstado('sin_chip')
        return
      }

      const { data: chips } = await supabase
        .from('chips')
        .select('folio')
        .eq('owner_profile_id', profile.id)
        .eq('activated', true)
        .limit(1)

      setEstado(chips && chips.length > 0 ? 'activo' : 'sin_chip')
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        checkAuth(session?.user?.id)
      }
    )

    supabase.auth.getSession().then(({ data: { session } }) => {
      checkAuth(session?.user?.id)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0A08',
      color: '#F4F0EB',
      fontFamily: 'sans-serif',
    }}>
      {/* NAV */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px',
        borderBottom: '1px solid rgba(244,240,235,0.06)',
      }}>
        <Link href="/" style={{
          fontFamily: 'inherit',
          fontSize: '18px',
          fontWeight: 900,
          letterSpacing: '3px',
          color: '#F4F0EB',
          textDecoration: 'none',
        }}>
          RESCUE<span style={{ color: '#E8231A' }}>CHIP</span>
        </Link>
        <Link href="/dashboard" style={{
          fontSize: '13px',
          color: '#888',
          textDecoration: 'none',
          letterSpacing: '1px',
        }}>
          Mi perfil →
        </Link>
      </div>

      {/* CONTENIDO */}
      <div style={{ padding: '24px 24px 40px', maxWidth: '900px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(232,35,26,0.10)',
            border: '1px solid rgba(232,35,26,0.25)',
            borderRadius: '4px',
            padding: '5px 12px',
            fontSize: '11px',
            letterSpacing: '2px',
            textTransform: 'uppercase' as const,
            color: '#ff6b63',
            marginBottom: '12px',
          }}>
            <span style={{
              width: '6px', height: '6px',
              borderRadius: '50%',
              background: '#E8231A',
              display: 'inline-block',
            }} />
            En vivo
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 900,
            margin: '0 0 4px',
            letterSpacing: '1px',
          }}>
            Mapa RescueChip
          </h1>
          <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>
            Alertas e incidentes reportados por riders en tiempo real
          </p>
        </div>

        {/* ESTADO: CARGANDO */}
        {estado === 'cargando' && (
          <div style={{
            height: '420px',
            background: '#111',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#555',
            fontSize: '14px',
          }}>
            Cargando...
          </div>
        )}

        {/* ESTADO: NO AUTENTICADO */}
        {estado === 'no_auth' && (
          <div>
            <MapaTeaser />
            <div style={{
              marginTop: '20px',
              padding: '20px',
              background: '#161614',
              border: '1px solid rgba(244,240,235,0.08)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap' as const,
              gap: '12px',
            }}>
              <div>
                <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '15px' }}>
                  Accede al mapa completo
                </p>
                <p style={{ margin: 0, color: '#888', fontSize: '13px' }}>
                  Reporta incidentes, ve rutas y alertas en detalle
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
                <Link href="/login?redirect=/mapa" style={{
                  padding: '10px 20px',
                  border: '1px solid rgba(244,240,235,0.2)',
                  borderRadius: '4px',
                  color: '#F4F0EB',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                }}>
                  Iniciar sesión
                </Link>
                <Link href="/#precios" style={{
                  padding: '10px 20px',
                  background: '#E8231A',
                  borderRadius: '4px',
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                }}>
                  Activar mi chip
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ESTADO: SIN CHIP ACTIVO */}
        {estado === 'sin_chip' && (
          <div>
            <MapaTeaser />
            <div style={{
              marginTop: '20px',
              padding: '20px',
              background: '#161614',
              border: '1px solid rgba(232,35,26,0.2)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap' as const,
              gap: '12px',
            }}>
              <div>
                <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '15px' }}>
                  Tienes una cuenta pero no tienes un chip activo
                </p>
                <p style={{ margin: 0, color: '#888', fontSize: '13px' }}>
                  Activa tu chip para reportar incidentes y acceder al mapa completo
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                <Link href="/#precios" style={{
                  padding: '10px 24px',
                  background: '#E8231A',
                  borderRadius: '4px',
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap' as const,
                  textAlign: 'center' as const,
                }}>
                  Obtén tu RescueChip →
                </Link>
                <Link href="/activate" style={{
                  fontSize: '12px',
                  color: '#888',
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                }}>
                  ¿Ya compraste? Actívalo aquí
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ESTADO: ACTIVO — mapa completo */}
        {estado === 'activo' && <MapaDashboard />}

      </div>
    </div>
  )
}
