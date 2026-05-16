'use client'
import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { fetchRoute, type NavRoute, type WeatherData } from './MapaRescueChip'

const MapaRescueChip = dynamic(() => import('./MapaRescueChip'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '500px', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>Cargando mapa...</div>,
})

interface Punto { id: string; tipo: string; latitud: number; longitud: number; fuente: 'reporte' | 'emergencia'; descripcion?: string }
const TIPOS = [
  { value: 'accidente',      label: '🔴 Accidente' },
  { value: 'zona_peligrosa', label: '🟠 Zona peligrosa' },
  { value: 'obstruccion',    label: '🟡 Obstrucción' },
  { value: 'desvio',        label: '🔵 Desvío' },
]

async function geocode(query: string): Promise<{ lng: number; lat: number; label: string } | null> {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
      `?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&language=es&country=mx&limit=1`
    const r = await fetch(url)
    const d = await r.json()
    const f = d.features?.[0]
    if (!f) return null
    return { lng: f.center[0], lat: f.center[1], label: f.place_name }
  } catch { return null }
}

async function fetchWeatherSimple(lat: number, lng: number): Promise<WeatherData | null> {
  try {
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
      `&current=temperature_2m,wind_speed_10m,weather_code&timezone=auto&forecast_days=1`
    )
    const d = await r.json(); const c = d.current
    return { temp: Math.round(c.temperature_2m), wind: Math.round(c.wind_speed_10m), code: c.weather_code, forecast: [] }
  } catch { return null }
}

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

  // Nav state
  const [origenText,  setOrigenText]  = useState('')
  const [destinoText, setDestinoText] = useState('')
  const [navLoading,  setNavLoading]  = useState(false)
  const [navError,    setNavError]    = useState('')
  const [navRoute,    setNavRoute]    = useState<NavRoute | null>(null)
  const [navOpen,     setNavOpen]     = useState(false)

  // Fullscreen — use document.documentElement so Chrome hides the URL bar
  const enterFullscreen = useCallback(async () => {
    setFullscreen(true)
    try { await document.documentElement.requestFullscreen() } catch {}
  }, [])

  const exitFullscreen = useCallback(() => {
    setFullscreen(false)
    setReportOpen(false)
    setNavOpen(false)
    try { if (document.fullscreenElement) document.exitFullscreen() } catch {}
  }, [])

  useEffect(() => {
    const onFsChange = () => { if (!document.fullscreenElement) setFullscreen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') exitFullscreen() }
    document.addEventListener('fullscreenchange', onFsChange)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('fullscreenchange', onFsChange); document.removeEventListener('keydown', onKey) }
  }, [exitFullscreen])

  const cargarPuntos = useCallback(async () => {
    try { const r = await fetch('/api/mapa/reportes'); const data = await r.json(); setPuntos(data.puntos ?? []) }
    catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => {
    cargarPuntos()
    const iv = setInterval(cargarPuntos, 60000)
    return () => clearInterval(iv)
  }, [cargarPuntos])

  const reportar = async () => {
    setMsg(''); setError('')
    if (!navigator.geolocation) { setError('Tu dispositivo no soporta geolocalización'); return }
    setReportando(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const r = await fetch('/api/mapa/reportes', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo: tipoReporte, descripcion: descripcion || undefined, latitud: pos.coords.latitude, longitud: pos.coords.longitude }),
          })
          if (r.ok) { setMsg('Reporte enviado. Visible por 2 horas.'); setDescripcion(''); setReportOpen(false); cargarPuntos() }
          else { const d = await r.json(); setError(d.error ?? 'Error al reportar') }
        } catch { setError('Error de conexión') } finally { setReportando(false) }
      },
      () => { setError('No se pudo obtener tu ubicación'); setReportando(false) },
      { timeout: 5000, enableHighAccuracy: true }
    )
  }

  // ── Alternative route selection ──────────────────────────────────────────
  const handleAlternativeSelect = useCallback((idx: number) => {
    setNavRoute(prev => prev ? { ...prev, selectedAlt: prev.selectedAlt === idx ? -1 : idx } : prev)
  }, [])

  // ── Route calculation ────────────────────────────────────────────────────
  const calcRoute = async (swapped = false) => {
    setNavError(''); setNavLoading(true)
    try {
      const rawOrigen  = swapped ? destinoText.trim() : origenText.trim()
      const rawDestino = swapped ? origenText.trim()  : destinoText.trim()

      if (!rawDestino) { setNavError('Ingresa un destino'); setNavLoading(false); return }

      let origenCoords: { lng: number; lat: number; label: string } | null = null
      if (!rawOrigen || rawOrigen.toLowerCase().includes('mi ubicación') || rawOrigen.toLowerCase().includes('ubicacion')) {
        origenCoords = await new Promise<{ lng: number; lat: number; label: string } | null>(res =>
          navigator.geolocation.getCurrentPosition(
            ({ coords }) => res({ lng: coords.longitude, lat: coords.latitude, label: 'Mi ubicación' }),
            () => res(null), { timeout: 5000, enableHighAccuracy: true }
          )
        )
      } else {
        origenCoords = await geocode(rawOrigen)
      }

      const destinoCoords = await geocode(rawDestino)
      if (!origenCoords) { setNavError('No se pudo obtener el origen'); setNavLoading(false); return }
      if (!destinoCoords) { setNavError('No se encontró el destino'); setNavLoading(false); return }

      const [route, destinoWeather] = await Promise.all([
        fetchRoute(origenCoords.lng, origenCoords.lat, destinoCoords.lng, destinoCoords.lat),
        fetchWeatherSimple(destinoCoords.lat, destinoCoords.lng),
      ])
      if (!route) { setNavError('No se pudo calcular la ruta'); setNavLoading(false); return }

      if (swapped) { setOrigenText(rawOrigen); setDestinoText(rawDestino) }

      setNavRoute({ origen: origenCoords, destino: destinoCoords, result: route, destinoWeather, selectedAlt: -1 })
    } catch { setNavError('Error al calcular la ruta') } finally { setNavLoading(false) }
  }

  const invertirRuta = () => {
    if (!origenText && !destinoText) return
    const tmp = origenText; setOrigenText(destinoText); setDestinoText(tmp)
    calcRoute(false)
  }

  // ── Shared nav panel ─────────────────────────────────────────────────────
  const navPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <input type="text" placeholder="🟢 Origen (vacío = mi ubicación)" value={origenText}
        onChange={e => setOrigenText(e.target.value)}
        style={{ width: '100%', padding: '9px 12px', background: '#0D0D0C', border: '1px solid rgba(244,240,235,0.12)', borderRadius: '6px', color: '#F4F0EB', fontSize: '13px', boxSizing: 'border-box' }} />
      <input type="text" placeholder="🔴 Destino" value={destinoText}
        onChange={e => setDestinoText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') calcRoute() }}
        style={{ width: '100%', padding: '9px 12px', background: '#0D0D0C', border: '1px solid rgba(244,240,235,0.12)', borderRadius: '6px', color: '#F4F0EB', fontSize: '13px', boxSizing: 'border-box' }} />
      <div style={{ display: 'flex', gap: '6px' }}>
        <button onClick={() => calcRoute()} disabled={navLoading} style={{
          flex: 1, background: navLoading ? '#555' : '#E8231A', color: '#fff', border: 'none',
          padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: navLoading ? 'not-allowed' : 'pointer',
        }}>
          {navLoading ? 'Calculando...' : '🗺️ Calcular ruta'}
        </button>
        <button onClick={invertirRuta} disabled={navLoading} title="Invertir origen y destino"
          style={{ background: 'rgba(244,240,235,0.08)', border: '1px solid rgba(244,240,235,0.15)', color: '#F4F0EB', borderRadius: '6px', padding: '10px 14px', fontSize: '16px', cursor: 'pointer' }}>
          ⇅
        </button>
        {navRoute && (
          <button onClick={() => setNavRoute(null)} title="Limpiar ruta"
            style={{ background: 'rgba(244,240,235,0.06)', border: '1px solid rgba(244,240,235,0.12)', color: '#888', borderRadius: '6px', padding: '10px 12px', fontSize: '13px', cursor: 'pointer' }}>
            ✕
          </button>
        )}
      </div>
      {navError && <p style={{ color: '#E8231A', fontSize: '12px', margin: 0 }}>{navError}</p>}
    </div>
  )

  const reportPanel = (
    <>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
        {TIPOS.map(t => (
          <button key={t.value} onClick={() => setTipoReporte(t.value)} style={{
            padding: '7px 13px', borderRadius: '5px',
            border: `1px solid ${tipoReporte === t.value ? '#E8231A' : 'rgba(244,240,235,0.15)'}`,
            background: tipoReporte === t.value ? 'rgba(232,35,26,0.15)' : 'transparent',
            color: tipoReporte === t.value ? '#E8231A' : '#888', fontSize: '13px', cursor: 'pointer',
          }}>{t.label}</button>
        ))}
      </div>
      <input type="text" placeholder="Descripción breve (opcional)" value={descripcion}
        onChange={e => setDescripcion(e.target.value)} maxLength={120}
        style={{ width: '100%', padding: '8px 12px', background: '#0D0D0C', border: '1px solid rgba(244,240,235,0.1)', borderRadius: '5px', color: '#F4F0EB', fontSize: '13px', marginBottom: '10px', boxSizing: 'border-box' }} />
      <button onClick={reportar} disabled={reportando} style={{ background: reportando ? '#555' : '#E8231A', color: '#fff', border: 'none', padding: '11px 24px', borderRadius: '5px', fontSize: '13px', fontWeight: 700, cursor: reportando ? 'not-allowed' : 'pointer' }}>
        {reportando ? 'Obteniendo ubicación...' : 'Reportar ahora'}
      </button>
      {msg   && <p style={{ color: '#4ade80', fontSize: '13px', marginTop: '8px' }}>{msg}</p>}
      {error && <p style={{ color: '#E8231A', fontSize: '13px', marginTop: '8px' }}>{error}</p>}
    </>
  )

  // ── FULLSCREEN ─────────────────────────────────────────────────────────────
  if (fullscreen) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#0A0A08' }}>
        <MapaRescueChip puntos={puntos} interactive height="100dvh" fullscreen navRoute={navRoute} onAlternativeSelect={handleAlternativeSelect} />

        {/* Header: X (izquierda) + RESCUEMAPS (derecha) para dejar top-right libre al GeolocateControl */}
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10001,
          padding: '10px 14px',
          background: 'linear-gradient(to bottom, rgba(10,10,8,0.85) 0%, transparent 100%)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          pointerEvents: 'none',
        }}>
          {/* X button — top LEFT to avoid GeolocateControl at top-right */}
          <button onClick={exitFullscreen} style={{
            pointerEvents: 'all',
            background: 'rgba(10,10,8,0.80)', border: '1px solid rgba(244,240,235,0.2)',
            borderRadius: '50%', width: '34px', height: '34px', color: '#F4F0EB',
            fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}>✕</button>

          {/* Logo — top RIGHT */}
          <span style={{ color: '#F4F0EB', fontWeight: 900, letterSpacing: '3px', fontSize: '15px', pointerEvents: 'none' }}>
            RESCUE<span style={{ color: '#E8231A' }}>MAPS</span>
          </span>
        </div>

        {/* FABs — bottom right, above safe area */}
        {!reportOpen && !navOpen && (
          <div style={{
            position: 'fixed', bottom: 'max(28px, env(safe-area-inset-bottom, 28px))',
            right: '14px', zIndex: 10001,
            display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end',
          }}>
            <button onClick={() => setNavOpen(true)} style={{
              background: 'rgba(10,10,8,0.88)', color: '#F4F0EB',
              border: '1px solid rgba(244,240,235,0.2)', borderRadius: '22px', padding: '11px 18px',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(10px)',
            }}>🗺️ Ir a…</button>
            <button onClick={() => setReportOpen(true)} style={{
              background: '#E8231A', color: '#fff', border: 'none',
              borderRadius: '22px', padding: '13px 20px',
              fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(232,35,26,0.5)',
            }}>⚠️ Reportar</button>
          </div>
        )}

        {/* Bottom sheet — nav */}
        {navOpen && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10002, background: '#161614', borderRadius: '18px 18px 0 0', padding: '20px 18px max(28px, env(safe-area-inset-bottom, 28px))', boxShadow: '0 -8px 40px rgba(0,0,0,0.7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ color: '#F4F0EB', fontWeight: 700, fontSize: '15px' }}>¿A dónde vas?</span>
              <button onClick={() => setNavOpen(false)} style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            {navPanel}
          </div>
        )}

        {/* Bottom sheet — reporte */}
        {reportOpen && !navOpen && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10002, background: '#161614', borderRadius: '18px 18px 0 0', padding: '20px 18px max(28px, env(safe-area-inset-bottom, 28px))', boxShadow: '0 -8px 40px rgba(0,0,0,0.7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ color: '#F4F0EB', fontWeight: 700, fontSize: '15px' }}>Reportar incidente</span>
              <button onClick={() => setReportOpen(false)} style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            {reportPanel}
          </div>
        )}
      </div>
    )
  }

  // ── VISTA NORMAL ───────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ color: '#F4F0EB', fontSize: '16px', margin: 0 }}>Mapa de incidentes</h3>
          <p style={{ color: '#888', fontSize: '12px', margin: '2px 0 0' }}>{puntos.length} alerta{puntos.length !== 1 ? 's' : ''} activa{puntos.length !== 1 ? 's' : ''} · Actualiza cada 60s</p>
        </div>
      </div>

      <div style={{ background: '#161614', border: '1px solid rgba(244,240,235,0.08)', borderRadius: '8px', padding: '14px' }}>
        <p style={{ color: '#F4F0EB', fontSize: '14px', fontWeight: 600, margin: '0 0 10px' }}>🗺️ Planear ruta</p>
        {navPanel}
      </div>

      {loading ? (
        <div style={{ height: '500px', background: '#111', borderRadius: '8px' }} />
      ) : (
        <div style={{ borderRadius: '8px', overflow: 'hidden' }}>
          <MapaRescueChip puntos={puntos} interactive height="500px" navRoute={navRoute} onAlternativeSelect={handleAlternativeSelect} onEnterFullscreen={enterFullscreen} />
        </div>
      )}

      <div style={{ background: '#161614', border: '1px solid rgba(244,240,235,0.08)', borderRadius: '8px', padding: '14px' }}>
        <p style={{ color: '#F4F0EB', fontSize: '14px', fontWeight: 600, margin: '0 0 12px' }}>⚠️ Reportar incidente en tu ubicación</p>
        {reportPanel}
      </div>
    </div>
  )
}
