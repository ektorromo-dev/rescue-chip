'use client'
import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'

const MapaRescueChip = dynamic(
  () => import('./MapaRescueChip'),
  { ssr: false, loading: () => (
    <div style={{ width: '100%', height: '500px', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
      Cargando mapa...
    </div>
  )}
)

interface Punto {
  id: string; tipo: string; latitud: number; longitud: number
  fuente: 'reporte' | 'emergencia'; descripcion?: string
}

const TIPOS = [
  { value: 'accidente',      label: '🔴 Accidente' },
  { value: 'zona_peligrosa', label: '🟠 Zona peligrosa' },
  { value: 'obstruccion',    label: '🟡 Obstrucción' },
  { value: 'desvio',        label: '🔵 Desvío' },
]

export default function MapaDashboard() {
  const [puntos,      setPuntos]      = useState<Punto[]>([])
  const [loading,     setLoading]     = useState(true)
  const [reportando,  setReportando]  = useState(false)
  const [tipoReporte, setTipoReporte] = useState('accidente')
  const [descripcion, setDescripcion] = useState('')
  const [msg,         setMsg]         = useState('')
  const [error,       setError]       = useState('')
  const [fullscreen,  setFullscreen]  = useState(false)
  const [reportOpen,  setReportOpen]  = useState(false)

  // ESC sale de fullscreen
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') { setFullscreen(false); setReportOpen(false) } }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [])

  // Body scroll lock en fullscreen
  useEffect(() => {
    document.body.style.overflow = fullscreen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [fullscreen])

  const cargarPuntos = useCallback(async () => {
    try {
      const r = await fetch('/api/mapa/reportes')
      const data = await r.json()
      setPuntos(data.puntos ?? [])
    } catch {
      // silencioso
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
    setMsg(''); setError('')
    if (!navigator.geolocation) { setError('Tu dispositivo no soporta geolocalización'); return }
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
            setReportOpen(false)
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
      () => { setError('No se pudo obtener tu ubicación'); setReportando(false) },
      { timeout: 5000, enableHighAccuracy: true }
    )
  }

  // Panel de reporte reutilizable
  const reportPanel = (
    <>
      <p style={{ color: '#F4F0EB', fontSize: '15px', fontWeight: 700, margin: '0 0 14px' }}>
        Reportar incidente
      </p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {TIPOS.map(t => (
          <button key={t.value} onClick={() => setTipoReporte(t.value)} style={{
            padding: '7px 14px', borderRadius: '4px',
            border: `1px solid ${tipoReporte === t.value ? '#E8231A' : 'rgba(244,240,235,0.15)'}`,
            background: tipoReporte === t.value ? 'rgba(232,35,26,0.15)' : 'transparent',
            color: tipoReporte === t.value ? '#E8231A' : '#888',
            fontSize: '13px', cursor: 'pointer',
          }}>
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
          width: '100%', padding: '8px 12px',
          background: '#0D0D0C',
          border: '1px solid rgba(244,240,235,0.1)',
          borderRadius: '4px', color: '#F4F0EB',
          fontSize: '13px', marginBottom: '12px',
          boxSizing: 'border-box',
        }}
      />
      <button onClick={reportar} disabled={reportando} style={{
        background: reportando ? '#555' : '#E8231A',
        color: '#fff', border: 'none',
        padding: '11px 28px', borderRadius: '4px',
        fontSize: '13px', fontWeight: 700,
        cursor: reportando ? 'not-allowed' : 'pointer',
        letterSpacing: '1px',
      }}>
        {reportando ? 'Obteniendo ubicación...' : 'Reportar ahora'}
      </button>
      {msg   && <p style={{ color: '#4ade80', fontSize: '13px', marginTop: '10px' }}>{msg}</p>}
      {error && <p style={{ color: '#E8231A', fontSize: '13px', marginTop: '10px' }}>{error}</p>}
    </>
  )

  // ── FULLSCREEN — como Google Maps/Waze ─────────────────────────────────
  if (fullscreen) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#0A0A08' }}>
        {/* Mapa pantalla completa */}
        <MapaRescueChip
          puntos={puntos}
          interactive
          height="100vh"
          fullscreen
        />

        {/* Header: logo + cerrar */}
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10001,
          padding: '12px 16px',
          background: 'linear-gradient(to bottom, rgba(10,10,8,0.75) 0%, transparent 100%)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          pointerEvents: 'none',
        }}>
          <span style={{
            color: '#F4F0EB', fontWeight: 900,
            letterSpacing: '3px', fontSize: '15px',
            pointerEvents: 'none',
          }}>
            RESCUE<span style={{ color: '#E8231A' }}>CHIP</span>
          </span>
          <button
            onClick={() => { setFullscreen(false); setReportOpen(false) }}
            style={{
              pointerEvents: 'all',
              background: 'rgba(10,10,8,0.75)',
              border: '1px solid rgba(244,240,235,0.2)',
              borderRadius: '50%', width: '36px', height: '36px',
              color: '#F4F0EB', fontSize: '16px',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(8px)',
            }}
          >
            ✕
          </button>
        </div>

        {/* FAB Reportar */}
        {!reportOpen && (
          <button
            onClick={() => setReportOpen(true)}
            style={{
              position: 'fixed', bottom: '32px', right: '16px', zIndex: 10001,
              background: '#E8231A', color: '#fff', border: 'none',
              borderRadius: '28px', padding: '13px 22px',
              fontSize: '14px', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(232,35,26,0.45)',
              display: 'flex', alignItems: 'center', gap: '8px',
              letterSpacing: '0.5px',
            }}
          >
            ⚠️ Reportar incidente
          </button>
        )}

        {/* Bottom sheet de reporte */}
        {reportOpen && (
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10001,
            background: '#161614',
            borderRadius: '18px 18px 0 0',
            padding: '20px 20px 36px',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '4px', background: 'rgba(244,240,235,0.2)', borderRadius: '2px', margin: '0 auto -12px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ color: '#F4F0EB', fontWeight: 700, fontSize: '16px' }}>
                Reportar incidente
              </span>
              <button
                onClick={() => setReportOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>
            {reportPanel}
          </div>
        )}
      </div>
    )
  }

  // ── VISTA NORMAL ──────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '8px',
      }}>
        <div>
          <h3 style={{ color: '#F4F0EB', fontSize: '16px', margin: 0 }}>
            Mapa de incidentes
          </h3>
          <p style={{ color: '#888', fontSize: '12px', margin: '2px 0 0' }}>
            {puntos.length} alerta{puntos.length !== 1 ? 's' : ''} activa{puntos.length !== 1 ? 's' : ''} · Actualiza cada 60s
          </p>
        </div>
        <button
          onClick={() => setFullscreen(true)}
          title="Pantalla completa"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 14px',
            background: 'rgba(244,240,235,0.06)',
            border: '1px solid rgba(244,240,235,0.12)',
            borderRadius: '4px', color: '#F4F0EB',
            fontSize: '12px', cursor: 'pointer', letterSpacing: '0.5px',
          }}
        >
          ⛶ Pantalla completa
        </button>
      </div>

      {/* Mapa */}
      {loading ? (
        <div style={{ height: '500px', background: '#111', borderRadius: '8px' }} />
      ) : (
        <div style={{ borderRadius: '8px', overflow: 'hidden' }}>
          <MapaRescueChip puntos={puntos} interactive height="500px" />
        </div>
      )}

      {/* Panel de reporte (vista normal) */}
      <div style={{
        background: '#161614',
        border: '1px solid rgba(244,240,235,0.08)',
        borderRadius: '8px', padding: '16px',
      }}>
        {reportPanel}
      </div>
    </div>
  )
}
