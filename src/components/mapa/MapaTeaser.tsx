'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const MapaRescueChip = dynamic(
  () => import('./MapaRescueChip'),
  { ssr: false, loading: () => (
    <div style={{
      width: '100%',
      height: '420px',
      background: '#111',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#555',
      fontSize: '14px',
    }}>
      Cargando mapa...
    </div>
  )}
)

interface Punto {
  id: string
  tipo: string
  latitud: number
  longitud: number
  fuente: 'reporte' | 'emergencia'
}

export default function MapaTeaser() {
  const [puntos, setPuntos] = useState<Punto[]>([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetch('/api/mapa/reportes-publicos')
      .then(r => r.json())
      .then(data => {
        setPuntos(data.puntos ?? [])
        setTotal(data.puntos?.length ?? 0)
      })
      .catch(() => {})
  }, [])

  return (
    <div style={{
      position: 'relative',
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid rgba(232,35,26,0.2)',
    }}>
      <MapaRescueChip
        puntos={puntos}
        interactive={false}
        height="420px"
      />

      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to bottom, transparent 40%, rgba(10,10,8,0.95) 100%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '24px',
        textAlign: 'center',
      }}>
        <p style={{
          color: '#F4F0EB',
          fontSize: '14px',
          marginBottom: '6px',
          opacity: 0.7,
        }}>
          {total > 0
            ? `${total} alerta${total > 1 ? 's' : ''} activa${total > 1 ? 's' : ''} en este momento`
            : 'Activa tu chip para ver el mapa completo y reportar incidentes'}
        </p>
        
        <a
          href="/shop"
          style={{
            display: 'inline-block',
            background: '#E8231A',
            color: '#fff',
            padding: '10px 28px',
            borderRadius: '2px',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            textDecoration: 'none',
            pointerEvents: 'all',
          }}
        >
          Activar mi chip
        </a>
      </div>

      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        background: 'rgba(10,10,8,0.8)',
        border: '1px solid rgba(232,35,26,0.3)',
        borderRadius: '4px',
        padding: '6px 12px',
        color: '#ff6b63',
        fontSize: '11px',
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        fontWeight: 500,
      }}>
        ● Vista previa
      </div>
    </div>
  )
}
