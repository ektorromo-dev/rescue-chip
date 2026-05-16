'use client'
import { useEffect, useRef, useCallback, useState } from 'react'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!
const MAPBOX_JS    = 'https://api.mapbox.com/mapbox-gl-js/v3.23.1/mapbox-gl.js'

const COLORES: Record<string, string> = {
  accidente: '#E8231A', zona_peligrosa: '#FF8C00',
  obstruccion: '#FFD700', desvio: '#00BFFF', emergencia: '#E8231A',
}

const ESTILOS = [
  { id: 'dark-v11',              label: '🌑 Oscuro',   url: 'mapbox://styles/mapbox/dark-v11' },
  { id: 'light-v11',             label: '☀️ Claro',    url: 'mapbox://styles/mapbox/light-v11' },
  { id: 'streets-v12',           label: '🗺️ Calles',   url: 'mapbox://styles/mapbox/streets-v12' },
  { id: 'outdoors-v12',          label: '🏔️ Exterior', url: 'mapbox://styles/mapbox/outdoors-v12' },
  { id: 'satellite-streets-v12', label: '🛰️ Satélite', url: 'mapbox://styles/mapbox/satellite-streets-v12' },
]

const LS_KEY         = 'rc_mapa_estilo'
const getEstiloGuardado = (): string => localStorage.getItem(LS_KEY) ?? 'dark-v11'
const getEstiloUrl   = (id: string): string =>
  ESTILOS.find(e => e.id === id)?.url ?? ESTILOS[0].url

// ─── WEATHER ──────────────────────────────────────────────────────────────────
interface WMOEntry { label: string; emoji: string; alerta: string | null }
const WMO: Record<number, WMOEntry> = {
  0:  { label: 'Despejado',        emoji: '☀️',  alerta: null },
  1:  { label: 'Casi despejado',   emoji: '🌤️', alerta: null },
  2:  { label: 'Parcial. nublado', emoji: '⛅',  alerta: null },
  3:  { label: 'Nublado',          emoji: '☁️',  alerta: null },
  45: { label: 'Neblina',          emoji: '🌫️',  alerta: '⚠️ Niebla — visibilidad muy reducida' },
  48: { label: 'Niebla',           emoji: '🌫️',  alerta: '⚠️ Niebla densa — peligro extremo' },
  51: { label: 'Llovizna',         emoji: '🌦️',  alerta: '⚠️ Lluvia — piso mojado' },
  53: { label: 'Llovizna mod.',    emoji: '🌦️',  alerta: '⚠️ Lluvia — piso mojado' },
  55: { label: 'Llovizna fuerte',  emoji: '🌧️',  alerta: '⚠️ Lluvia fuerte — reduce velocidad' },
  61: { label: 'Lluvia ligera',    emoji: '🌧️',  alerta: '⚠️ Lluvia — piso mojado' },
  63: { label: 'Lluvia moderada',  emoji: '🌧️',  alerta: '⚠️ Lluvia — reduce velocidad' },
  65: { label: 'Lluvia fuerte',    emoji: '🌧️',  alerta: '⚠️ Lluvia intensa — considera no salir' },
  71: { label: 'Nieve ligera',     emoji: '🌨️',  alerta: '⚠️ Nieve — peligro en carretera' },
  73: { label: 'Nieve moderada',   emoji: '❄️',   alerta: '⚠️ Nieve — no salgas en moto' },
  75: { label: 'Nieve fuerte',     emoji: '❄️',   alerta: '🚨 Nieve intensa — no salgas' },
  80: { label: 'Chubascos',        emoji: '🌧️',  alerta: '⚠️ Chubascos — reduce velocidad' },
  81: { label: 'Chubascos mod.',   emoji: '🌧️',  alerta: '⚠️ Lluvia — reduce velocidad' },
  82: { label: 'Chubascos ftes.',  emoji: '⛈️',  alerta: '⚠️ Lluvia intensa — considera no salir' },
  95: { label: 'Tormenta',         emoji: '⛈️',  alerta: '🚨 Tormenta eléctrica — no salgas' },
  96: { label: 'Torm. c/granizo',  emoji: '⛈️',  alerta: '🚨 Granizo — no salgas' },
  99: { label: 'Tormenta fuerte',  emoji: '⛈️',  alerta: '🚨 Tormenta severa — no salgas' },
}
const getWMO = (code: number): WMOEntry =>
  WMO[code] ?? { label: `Cond. ${code}`, emoji: '🌡️', alerta: null }

interface WeatherData {
  temp: number; wind: number; code: number
  forecast: Array<{ date: string; maxTemp: number; minTemp: number; code: number }>
}

async function fetchWeather(lat: number, lng: number): Promise<WeatherData | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
      `&current=temperature_2m,wind_speed_10m,weather_code` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
      `&timezone=auto&forecast_days=4`
    const r = await fetch(url)
    const d = await r.json()
    const c = d.current
    const daily = d.daily
    const forecast = (daily?.time ?? []).slice(1, 4).map((date: string, i: number) => ({
      date,
      maxTemp: Math.round(daily.temperature_2m_max[i + 1]),
      minTemp: Math.round(daily.temperature_2m_min[i + 1]),
      code: daily.weather_code[i + 1],
    }))
    return {
      temp: Math.round(c.temperature_2m),
      wind: Math.round(c.wind_speed_10m),
      code: c.weather_code,
      forecast,
    }
  } catch { return null }
}

// ─── POIs — Overpass API (OpenStreetMap) ─────────────────────────────────────
interface BBox { south: number; west: number; north: number; east: number }

async function fetchPOIsOverpass(tipo: 'fuel' | 'hospital', bbox: BBox): Promise<any[]> {
  const { south, west, north, east } = bbox
  const s = south.toFixed(4), w = west.toFixed(4),
        n = north.toFixed(4), e = east.toFixed(4)
  const filter = tipo === 'fuel'
    ? '["amenity"="fuel"]'
    : '["amenity"~"^(hospital|clinic)$"]'
  const query = `[out:json][timeout:15];(node${filter}(${s},${w},${n},${e});way${filter}(${s},${w},${n},${e}););out body center 30;`
  try {
    const r = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
      headers: { 'Content-Type': 'text/plain' },
    })
    const d = await r.json()
    return d.elements ?? []
  } catch { return [] }
}

function clearMarkers(ref: React.MutableRefObject<any[]>) {
  ref.current.forEach(m => m.remove())
  ref.current = []
}

function loadMapboxScript(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).mapboxgl) { resolve(); return }
    const ex = document.getElementById('mapbox-gl-js')
    if (ex) { ex.addEventListener('load', () => resolve()); return }
    const s = document.createElement('script')
    s.id = 'mapbox-gl-js'; s.src = MAPBOX_JS
    s.onload = () => resolve()
    document.head.appendChild(s)
  })
}

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Punto {
  id: string; tipo: string; latitud: number; longitud: number
  fuente: 'reporte' | 'emergencia'; descripcion?: string
}
interface Props {
  puntos?: Punto[]
  interactive?: boolean
  height?: string
  fullscreen?: boolean
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function MapaRescueChip({
  puntos = [], interactive = true, height = '500px', fullscreen = false,
}: Props) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<any>(null)
  const mboxRef      = useRef<any>(null)
  const markersRef   = useRef<any[]>([])
  const gasMkrs      = useRef<any[]>([])
  const hospMkrs     = useRef<any[]>([])
  const puntosRef    = useRef<Punto[]>(puntos)
  const showGasRef   = useRef(false)
  const showHospRef  = useRef(false)

  const [estiloActual, setEstiloActual] = useState<string>(getEstiloGuardado)
  const [showGas,      setShowGas]      = useState(false)
  const [showHosp,     setShowHosp]     = useState(false)
  const [weather,      setWeather]      = useState<WeatherData | null>(null)
  const [showForecast, setShowForecast] = useState(false)
  const [poiMsg,       setPoiMsg]       = useState('')

  useEffect(() => { puntosRef.current  = puntos  }, [puntos])
  useEffect(() => { showGasRef.current  = showGas  }, [showGas])
  useEffect(() => { showHospRef.current = showHosp }, [showHosp])

  // Auto-centra en ubicación cuando entra a fullscreen
  useEffect(() => {
    if (!fullscreen || !mapRef.current) return
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        mapRef.current?.flyTo({
          center: [coords.longitude, coords.latitude],
          zoom: 14, duration: 1500,
        })
      },
      undefined,
      { timeout: 5000 }
    )
  }, [fullscreen])

  // ── Stable: add POI markers (Overpass) ──────────────────────────────────
  const addPOIMarkers = useCallback((
    elements: any[],
    tipo: 'gasolinera' | 'hospital',
    ref: React.MutableRefObject<any[]>
  ) => {
    const mapboxgl = mboxRef.current
    if (!mapRef.current || !mapboxgl) return
    clearMarkers(ref)
    elements.forEach(el => {
      const lng = el.type === 'node' ? el.lon : el.center?.lon
      const lat = el.type === 'node' ? el.lat : el.center?.lat
      if (!lng || !lat) return
      const tags = el.tags || {}
      const emoji = tipo === 'gasolinera' ? '⛽' : '🏥'
      const color = tipo === 'gasolinera' ? '#FFD700' : '#3B82F6'

      let title = '', subtitle = ''
      if (tipo === 'gasolinera') {
        title = tags.brand || tags.operator || tags.name || 'Gasolinera'
        subtitle = tags.name && tags.name !== title ? tags.name : ''
      } else {
        title = tags.name || 'Hospital'
        const op = (tags.operator || '').trim()
        const pub = /IMSS|ISSSTE|SSA|SECTOR SALUD|PEMEX|SEDENA|SEMAR|BIENESTAR|INSABI|GOBIERNO/i.test(op)
        if (op) subtitle = pub ? `Público · ${op}` : `Privado${op ? ' · ' + op : ''}`
        else subtitle = tags.amenity === 'clinic' ? 'Clínica' : 'Hospital'
      }

      const div = document.createElement('div')
      div.style.cssText = `
        width:30px;height:30px;border-radius:50%;background:${color};
        border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);
        display:flex;align-items:center;justify-content:center;
        font-size:15px;cursor:pointer;
      `
      div.textContent = emoji

      const popup = new mapboxgl.Popup({ offset: 14, closeButton: false })
        .setHTML(`
          <div style="font-family:sans-serif;font-size:13px;color:#111;padding:2px;min-width:120px">
            <strong>${title}</strong>
            ${subtitle ? `<p style="margin:3px 0 0;color:#555;font-size:11px">${subtitle}</p>` : ''}
          </div>
        `)
      const marker = new mapboxgl.Marker({ element: div })
        .setLngLat([lng, lat]).setPopup(popup).addTo(mapRef.current)
      ref.current.push(marker)
    })
  }, [])

  // ── Stable: add incident markers ─────────────────────────────────────────
  const addMarkers = useCallback(() => {
    const mapboxgl = mboxRef.current
    if (!mapRef.current || !mapboxgl) return
    clearMarkers(markersRef)
    puntosRef.current.forEach(punto => {
      const el = document.createElement('div')
      el.style.cssText = `
        width:14px;height:14px;border-radius:50%;
        background:${COLORES[punto.tipo] ?? COLORES.accidente};
        border:2px solid white;
        box-shadow:0 0 8px ${COLORES[punto.tipo] ?? COLORES.accidente};
        cursor:pointer;
      `
      const popup = new mapboxgl.Popup({ offset: 12, closeButton: false })
        .setHTML(`
          <div style="font-family:sans-serif;font-size:13px;color:#111;padding:4px 2px">
            <strong style="text-transform:capitalize">${punto.tipo.replace('_', ' ')}</strong>
            ${punto.descripcion ? `<p style="margin:4px 0 0;color:#555">${punto.descripcion}</p>` : ''}
            <p style="margin:4px 0 0;font-size:11px;color:#999">
              ${punto.fuente === 'emergencia' ? '🚨 Emergencia real' : '⚠️ Reporte de rider'}
            </p>
          </div>
        `)
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([punto.longitud, punto.latitud]).setPopup(popup).addTo(mapRef.current)
      markersRef.current.push(marker)
    })
  }, [])

  // ── Map init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    let moveTimer: ReturnType<typeof setTimeout> | null = null

    const init = async () => {
      await loadMapboxScript()
      if (cancelled || !mapContainer.current) return
      const mapboxgl = (window as any).mapboxgl
      mboxRef.current = mapboxgl
      mapboxgl.accessToken = MAPBOX_TOKEN

      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: getEstiloUrl(getEstiloGuardado()),
        center: [-99.1332, 19.4326],
        zoom: 5,
        interactive,
        language: 'es',
        locale: {
          'TouchPanBlocker.Message': 'Usa dos dedos para mover el mapa',
          'ScrollZoomBlocker.CtrlMessage': 'Mantén Ctrl y haz scroll para hacer zoom',
          'ScrollZoomBlocker.CmdMessage': 'Mantén ⌘ y haz scroll para hacer zoom',
        },
      })

      if (interactive) {
        mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
        mapRef.current.addControl(
          new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
          }),
          'top-right'
        )

        // Clima inicial
        navigator.geolocation?.getCurrentPosition(
          async ({ coords }) => {
            const w = await fetchWeather(coords.latitude, coords.longitude)
            if (!cancelled) setWeather(w)
          },
          async () => {
            const c = mapRef.current?.getCenter()
            if (c) { const w = await fetchWeather(c.lat, c.lng); if (!cancelled) setWeather(w) }
          },
          { timeout: 5000 }
        )

        // Refresca clima + POIs al dejar de mover
        mapRef.current.on('moveend', () => {
          if (moveTimer) clearTimeout(moveTimer)
          moveTimer = setTimeout(async () => {
            const c = mapRef.current?.getCenter()
            if (!c || cancelled) return
            const w = await fetchWeather(c.lat, c.lng)
            if (!cancelled) setWeather(w)
            const bounds = mapRef.current?.getBounds()
            if (!bounds) return
            const bbox: BBox = {
              south: bounds.getSouth(), west: bounds.getWest(),
              north: bounds.getNorth(), east: bounds.getEast(),
            }
            if (showGasRef.current) {
              const els = await fetchPOIsOverpass('fuel', bbox)
              if (!cancelled) addPOIMarkers(els, 'gasolinera', gasMkrs)
            }
            if (showHospRef.current) {
              const els = await fetchPOIsOverpass('hospital', bbox)
              if (!cancelled) addPOIMarkers(els, 'hospital', hospMkrs)
            }
          }, 1200)
        })
      }

      mapRef.current.on('load',       addMarkers)
      mapRef.current.on('style.load', addMarkers)
    }

    init()
    return () => {
      cancelled = true
      if (moveTimer) clearTimeout(moveTimer)
      clearMarkers(markersRef); clearMarkers(gasMkrs); clearMarkers(hospMkrs)
      mapRef.current?.remove()
      mapRef.current = null; mboxRef.current = null
    }
  }, [interactive, addMarkers, addPOIMarkers])

  useEffect(() => {
    if (mapRef.current?.isStyleLoaded()) addMarkers()
  }, [puntos, addMarkers])

  // ── POI toggles ──────────────────────────────────────────────────────────
  const toggleGas = useCallback(async () => {
    const next = !showGasRef.current
    setShowGas(next)
    if (!next) { clearMarkers(gasMkrs); return }
    const zoom = mapRef.current?.getZoom() ?? 0
    if (zoom < 10) {
      setShowGas(false)
      setPoiMsg('Acércate más al mapa para ver gasolineras')
      setTimeout(() => setPoiMsg(''), 3000)
      return
    }
    const bounds = mapRef.current?.getBounds()
    if (!bounds) return
    const els = await fetchPOIsOverpass('fuel', {
      south: bounds.getSouth(), west: bounds.getWest(),
      north: bounds.getNorth(), east: bounds.getEast(),
    })
    addPOIMarkers(els, 'gasolinera', gasMkrs)
  }, [addPOIMarkers])

  const toggleHosp = useCallback(async () => {
    const next = !showHospRef.current
    setShowHosp(next)
    if (!next) { clearMarkers(hospMkrs); return }
    const zoom = mapRef.current?.getZoom() ?? 0
    if (zoom < 10) {
      setShowHosp(false)
      setPoiMsg('Acércate más al mapa para ver hospitales')
      setTimeout(() => setPoiMsg(''), 3000)
      return
    }
    const bounds = mapRef.current?.getBounds()
    if (!bounds) return
    const els = await fetchPOIsOverpass('hospital', {
      south: bounds.getSouth(), west: bounds.getWest(),
      north: bounds.getNorth(), east: bounds.getEast(),
    })
    addPOIMarkers(els, 'hospital', hospMkrs)
  }, [addPOIMarkers])

  const wmo = weather ? getWMO(weather.code) : null
  const windAlert = weather && weather.wind >= 50
    ? `⚠️ Viento fuerte — ${weather.wind} km/h`
    : null
  const alertMsg = windAlert ?? wmo?.alerta ?? null

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* ── Weather card ───────────────────────────────────────────────── */}
      {interactive && weather && wmo && (
        <div style={{
          position: 'absolute', top: '10px', left: '10px', zIndex: 1,
          background: 'rgba(10,10,8,0.82)',
          border: `1px solid ${alertMsg ? 'rgba(232,35,26,0.6)' : 'rgba(244,240,235,0.12)'}`,
          borderRadius: '8px', padding: '8px 12px',
          color: '#F4F0EB', backdropFilter: 'blur(10px)',
          minWidth: '150px', maxWidth: '220px',
          cursor: 'pointer',
        }}
          onClick={() => setShowForecast(f => !f)}
        >
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '3px' }}>
            {wmo.emoji} {wmo.label}
          </div>
          <div style={{ fontSize: '12px', color: '#bbb', display: 'flex', gap: '10px' }}>
            <span>🌡️ {weather.temp}°C</span>
            <span>💨 {weather.wind} km/h</span>
          </div>
          {alertMsg && (
            <div style={{ marginTop: '5px', fontSize: '11px', color: '#E8231A', fontWeight: 700 }}>
              {alertMsg}
            </div>
          )}
          {/* Forecast */}
          {showForecast && weather.forecast.length > 0 && (
            <div style={{ marginTop: '8px', borderTop: '1px solid rgba(244,240,235,0.1)', paddingTop: '8px' }}>
              <div style={{ fontSize: '10px', color: '#888', marginBottom: '5px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Próximos 3 días
              </div>
              {weather.forecast.map(day => {
                const d = new Date(day.date + 'T12:00:00')
                const wd = getWMO(day.code)
                return (
                  <div key={day.date} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: '12px', padding: '2px 0',
                  }}>
                    <span style={{ color: '#aaa', minWidth: '28px' }}>
                      {d.toLocaleDateString('es-MX', { weekday: 'short' })}
                    </span>
                    <span>{wd.emoji}</span>
                    <span style={{ color: '#F4F0EB' }}>
                      {day.maxTemp}° <span style={{ color: '#666' }}>{day.minTemp}°</span>
                    </span>
                  </div>
                )
              })}
            </div>
          )}
          <div style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>
            {showForecast ? 'Ocultar ▲' : 'Ver pronóstico ▼'}
          </div>
        </div>
      )}

      {/* ── POI message ────────────────────────────────────────────────── */}
      {poiMsg && (
        <div style={{
          position: 'absolute', bottom: '90px', left: '10px', zIndex: 2,
          background: 'rgba(10,10,8,0.9)', color: '#F4F0EB',
          padding: '6px 12px', borderRadius: '6px', fontSize: '12px',
          border: '1px solid rgba(244,240,235,0.15)',
        }}>
          {poiMsg}
        </div>
      )}

      {/* ── Controls ───────────────────────────────────────────────────── */}
      {interactive && (
        <div style={{
          position: 'absolute', bottom: '28px', left: '10px', zIndex: 1,
          display: 'flex', flexDirection: 'column', gap: '5px',
          maxWidth: 'calc(100% - 60px)',
        }}>
          {/* POI toggles */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { label: '⛽ Gasolineras', active: showGas,  bg: '#FFD700', tc: '#111', fn: toggleGas },
              { label: '🏥 Hospitales',  active: showHosp, bg: '#3B82F6', tc: '#fff', fn: toggleHosp },
            ].map(b => (
              <button key={b.label} onClick={b.fn} style={{
                padding: '5px 10px', borderRadius: '4px', border: 'none',
                background: b.active ? b.bg : 'rgba(10,10,8,0.72)',
                color: b.active ? b.tc : '#F4F0EB',
                fontSize: '11px', cursor: 'pointer',
                fontWeight: b.active ? 700 : 400,
                backdropFilter: 'blur(8px)', whiteSpace: 'nowrap',
              }}>
                {b.label}
              </button>
            ))}
          </div>

          {/* Style switcher */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {ESTILOS.map(estilo => (
              <button key={estilo.id} onClick={() => {
                setEstiloActual(estilo.id)
                localStorage.setItem(LS_KEY, estilo.id)
                mapRef.current?.setStyle(estilo.url)
              }} style={{
                padding: '5px 10px', borderRadius: '4px', border: 'none',
                background: estiloActual === estilo.id ? '#E8231A' : 'rgba(10,10,8,0.72)',
                color: '#F4F0EB', fontSize: '11px', cursor: 'pointer',
                fontWeight: estiloActual === estilo.id ? 700 : 400,
                backdropFilter: 'blur(8px)', whiteSpace: 'nowrap',
              }}>
                {estilo.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
