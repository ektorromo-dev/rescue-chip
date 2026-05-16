'use client'
import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'

const MapaRescueChip = dynamic(
  () => import('./MapaRescueChip'),
  { ssr: false, loading: () => (
    <div style={{
      width: '100%',
      height: '500px',
      background: '#111',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#555',
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
  descripcion?: string
}

const TIPOS = [
  { value: 'accidente', label: '🔴 Accidente' },
  { value: 'zona_peligrosa', label: '🟠 Zona peligrosa' },
  { value: 'obstruccion', label: '🟡 Obstrucción' },
  { value: 'desvio', label: '🔵 Desvío' },
]

export default function MapaDashboard() {
  const [puntos, setPuntos] = useState<Punto[]>([])
  const [loading, setLoading] = useState(true)
  const [reportando, setReportando] = useState(false)
  const [tipoReporte, setTipoReporte] = useState('accidente')
  const [descripcion, setDescripcion] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const cargarPuntos = useCallback(async () => {
    try {
      const r = await fetch('/api/mapa/reportes')
      const data = await r.json()
      setPuntos(data.puntos ?? [])
    } catch {
      setError('Error cargando el mapa')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarPuntos()
    const interval = setInterval(cargarPuntos, 60000)
    return () => clearInterval(interval)
  }, [cargarPuntos])

  const reportar = async () => {
    setMsg('')
    setError('')

    if (!navigator.geolocation) {
      setError('Tu dispositivo no soporta geolocalización')
      return
    }

    setReportando(true)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const r = await fetch('/api/mapa/reportes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tipo: tipoReporte,
              descripcion: descripcion || undefined,
              latitud: pos.coords.latitude,
              longitud: pos.coords.longitude,
            }),
          })

          if (r.ok) {
            setMsg('Reporte enviado. Visible por 2 horas.')
            setDescripcion('')
            cargarPuntos()
          } else {
            const d = await r.json()
            setError(d.error ?? 'Error al reportar')
          }
        } catch {
          setError('Error de conexión')
        } finally {
          setReportando(false)
        }
      },
      () => {
        setError('No se pudo obtener tu ubicación')
        setReportando(false)
      },
      { timeout: 5000, enableHighAccuracy: true }
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <div>
          <h3 style={{ color: '#F4F0EB', fontSize: '16px', margin: 0 }}>
            Mapa de incidentes
          </h3>
          <p style={{ color: '#888', fontSize: '12px', margin: '2px 0 0' }}>
            {puntos.length} alerta{puntos.length !== 1 ? 's' : ''} activa{puntos.length !== 1 ? 's' : ''} · Actualiza cada 60s
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ height: '500px', background: '#111', borderRadius: '8px' }} />
      ) : (
        <div style={{ borderRadius: '8px', overflow: 'hidden' }}>
          <MapaRescueChip puntos={puntos} interactive height="500px" />
        </div>
      )}

      <div style={{
        background: '#161614',
        border: '1px solid rgba(244,240,235,0.08)',
        borderRadius: '8px',
        padding: '16px',
      }}>
        <p style={{ color: '#F4F0EB', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
          Reportar incidente en tu ubicación actual
        </p>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {TIPOS.map(t => (
            <button
              key={t.value}
              onClick={() => setTipoReporte(t.value)}
              style={{
                padding: '6px 14px',
                borderRadius: '4px',
                border: `1px solid ${tipoReporte === t.value ? '#E8231A' : 'rgba(244,240,235,0.15)'}`,
                background: tipoReporte === t.value ? 'rgba(232,35,26,0.15)' : 'transparent',
                color: tipoReporte === t.value ? '#E8231A' : '#888',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Descripción breve (opcional)"
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          maxLength={120}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: '#0D0D0C',
            border: '1px solid rgba(244,240,235,0.1)',
            borderRadius: '4px',
            color: '#F4F0EB',
            fontSize: '13px',
            marginBottom: '10px',
            boxSizing: 'border-box',
          }}
        />

        <button
          onClick={reportar}
          disabled={reportando}
          style={{
            background: reportando ? '#555' : '#E8231A',
            color: '#fff',
            border: 'none',
            padding: '10px 24px',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: reportando ? 'not-allowed' : 'pointer',
            letterSpacing: '1px',
          }}
        >
          {reportando ? 'Obteniendo ubicación...' : 'Reportar ahora'}
        </button>

        {msg && <p style={{ color: '#4ade80', fontSize: '13px', marginTop: '8px' }}>{msg}</p>}
        {error && <p style={{ color: '#E8231A', fontSize: '13px', marginTop: '8px' }}>{error}</p>}
      </div>
    </div>
  )
}
