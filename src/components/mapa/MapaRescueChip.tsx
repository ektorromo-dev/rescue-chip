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
const WMO: Record<number, { label: string; emoji: string; peligro: boolean }> = {
  0:  { label: 'Despejado',         emoji: '☀️',  peligro: false },
  1:  { label: 'Casi despejado',    emoji: '🌤️', peligro: false },
  2:  { label: 'Parcial. nublado',  emoji: '⛅',  peligro: false },
  3:  { label: 'Nublado',           emoji: '☁️',  peligro: false },
  45: { label: 'Neblina',           emoji: '🌫️',  peligro: true  },
  48: { label: 'Niebla',            emoji: '🌫️',  peligro: true  },
  51: { label: 'Llovizna',          emoji: '🌦️',  peligro: true  },
  53: { label: 'Llovizna mod.',     emoji: '🌦️',  peligro: true  },
  55: { label: 'Llovizna fuerte',   emoji: '🌧️',  peligro: true  },
  61: { label: 'Lluvia ligera',     emoji: '🌧️',  peligro: true  },
  63: { label: 'Lluvia moderada',   emoji: '🌧️',  peligro: true  },
  65: { label: 'Lluvia fuerte',     emoji: '🌧️',  peligro: true  },
  71: { label: 'Nieve ligera',      emoji: '🌨️',  peligro: true  },
  73: { label: 'Nieve moderada',    emoji: '❄️',   peligro: true  },
  75: { label: 'Nieve fuerte',      emoji: '❄️',   peligro: true  },
  80: { label: 'Chubascos',         emoji: '🌧️',  peligro: true  },
  81: { label: 'Chubascos mod.',    emoji: '🌧️',  peligro: true  },
  82: { label: 'Chubascos ftes.',   emoji: '⛈️',  peligro: true  },
  95: { label: 'Tormenta',          emoji: '⛈️',  peligro: true  },
  96: { label: 'Tormenta+granizo',  emoji: '⛈️',  peligro: true  },
  99: { label: 'Tormenta fuerte',   emoji: '⛈️',  peligro: true  },
}
const getWMO = (code: number) =>
  WMO[code] ?? { label: `Cond. ${code}`, emoji: '🌡️', peligro: false }

interface WeatherData { temp: number; wind: number; code: number }

async function fetchWeather(lat: number, lng: number): Promise<WeatherData | null> {
  try {
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&current=temperature_2m,wind_speed_10m,weather_code&timezone=auto&forecast_days=1`
    )
    const d = await r.json()
    const c = d.current
    return { temp: Math.round(c.temperature_2m), wind: Math.round(c.wind_speed_10m), code: c.weather_code }
  } catch { return null }
}

// ─── POIs ─────────────────────────────────────────────────────────────────────
async function fetchPOIs(category: string, lng: number, lat: number): Promise<any[]> {
  try {
    const tok = Math.random().toString(36).slice(2)
    const r = await fetch(
      `https://api.mapbox.com/search/searchbox/v1/category/${category}?proximity=${lng.toFixed(4)},${lat.toFixed(4)}&limit=8&access_token=${MAPBOX_TOKEN}&session_token=${tok}&language=es`
    )
    const d = await r.json()
    return d.features ?? []
  } catch { return [] }
}

function clearMarkers(ref: React.MutableRefObject<any[]>) {
  ref.current.forEach(m => m.remove())
  ref.current = []
}

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Punto {
  id: string; tipo: string; latitud: number; longitud: number
  fuente: 'reporte' | 'emergencia'; descripcion?: string
}
interface Props { puntos?: Punto[]; interactive?: boolean; height?: string }

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

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function MapaRescueChip({
  puntos = [], interactive = true, height = '500px',
}: Props) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<any>(null)
  const mboxRef      = useRef<any>(null)   // mapboxgl instance
  const markersRef   = useRef<any[]>([])   // incident markers
  const gasMkrs      = useRef<any[]>([])   // gasolinera markers
  const hospMkrs     = useRef<any[]>([])   // hospital markers
  const puntosRef    = useRef<Punto[]>(puntos)
  const showGasRef   = useRef(false)
  const showHospRef  = useRef(false)

  const [estiloActual, setEstiloActual] = useState<string>(getEstiloGuardado)
  const [showGas,  setShowGas]  = useState(false)
  const [showHosp, setShowHosp] = useState(false)
  const [weather,  setWeather]  = useState<WeatherData | null>(null)

  // Keep refs in sync
  useEffect(() => { puntosRef.current  = puntos  }, [puntos])
  useEffect(() => { showGasRef.current  = showGas  }, [showGas])
  useEffect(() => { showHospRef.current = showHosp }, [showHosp])

  // ── Stable: add POI markers ──────────────────────────────────────────────
  const addPOIMarkers = useCallback((
    features: any[],
    tipo: 'gasolinera' | 'hospital',
    ref: React.MutableRefObject<any[]>
  ) => {
    const mapboxgl = mboxRef.current
    if (!mapRef.current || !mapboxgl) return
    clearMarkers(ref)
    features.forEach(f => {
      const [lng, lat] = f.geometry.coordinates
      const name    = f.properties.name    || (tipo === 'gasolinera' ? 'Gasolinera' : 'Hospital')
      const address = f.properties.full_address || f.properties.address || ''
      const emoji   = tipo === 'gasolinera' ? '⛽' : '🏥'
      const color   = tipo === 'gasolinera' ? '#FFD700' : '#3B82F6'

      const el = document.createElement('div')
      el.style.cssText = `
        width:30px;height:30px;border-radius:50%;
        background:${color};border:2px solid white;
        box-shadow:0 2px 6px rgba(0,0,0,0.4);
        display:flex;align-items:center;justify-content:center;
        font-size:15px;cursor:pointer;
      `
      el.textContent = emoji

      const popup = new mapboxgl.Popup({ offset: 14, closeButton: false })
        .setHTML(`
          <div style="font-family:sans-serif;font-size:13px;color:#111;padding:2px">
            <strong>${name}</strong>
            ${address ? `<p style="margin:3px 0 0;color:#555;font-size:11px">${address}</p>` : ''}
          </div>
        `)

      const marker = new mapboxgl.Marker({ element: el })
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

  // ── Map initialization ───────────────────────────────────────────────────
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
        zoom: 5, interactive,
        cooperativeGestures: interactive,
      })

      if (interactive) {
        mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
        mapRef.current.addControl(
          new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }),
          'top-right'
        )

        // Initial weather via geolocation, fallback to map center
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

        // Refresh weather + POIs after map stops moving (debounced 1.2s)
        mapRef.current.on('moveend', () => {
          if (moveTimer) clearTimeout(moveTimer)
          moveTimer = setTimeout(async () => {
            const c = mapRef.current?.getCenter()
            if (!c || cancelled) return
            const w = await fetchWeather(c.lat, c.lng)
            if (!cancelled) setWeather(w)
            if (showGasRef.current) {
              const f = await fetchPOIs('fuel', c.lng, c.lat)
              if (!cancelled) addPOIMarkers(f, 'gasolinera', gasMkrs)
            }
            if (showHospRef.current) {
              const f = await fetchPOIs('hospital', c.lng, c.lat)
              if (!cancelled) addPOIMarkers(f, 'hospital', hospMkrs)
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

  // Update incident markers when puntos change
  useEffect(() => {
    if (mapRef.current?.isStyleLoaded()) addMarkers()
  }, [puntos, addMarkers])

  // ── POI toggles ──────────────────────────────────────────────────────────
  const toggleGas = useCallback(async () => {
    const next = !showGasRef.current
    setShowGas(next)
    if (!next) { clearMarkers(gasMkrs); return }
    const c = mapRef.current?.getCenter()
    if (!c) return
    const f = await fetchPOIs('fuel', c.lng, c.lat)
    addPOIMarkers(f, 'gasolinera', gasMkrs)
  }, [addPOIMarkers])

  const toggleHosp = useCallback(async () => {
    const next = !showHospRef.current
    setShowHosp(next)
    if (!next) { clearMarkers(hospMkrs); return }
    const c = mapRef.current?.getCenter()
    if (!c) return
    const f = await fetchPOIs('hospital', c.lng, c.lat)
    addPOIMarkers(f, 'hospital', hospMkrs)
  }, [addPOIMarkers])

  const wmo = weather ? getWMO(weather.code) : null

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* ── Weather card ────────────────────────────────────────────────── */}
      {interactive && weather && wmo && (
        <div style={{
          position: 'absolute', top: '10px', left: '10px', zIndex: 1,
          background: 'rgba(10,10,8,0.88)',
          border: `1px solid ${wmo.peligro ? 'rgba(232,35,26,0.7)' : 'rgba(244,240,235,0.12)'}`,
          borderRadius: '8px', padding: '8px 12px',
          color: '#F4F0EB', backdropFilter: 'blur(8px)',
          minWidth: '148px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
            {wmo.emoji} {wmo.label}
          </div>
          <div style={{ fontSize: '12px', color: '#aaa', display: 'flex', gap: '10px' }}>
            <span>🌡️ {weather.temp}°C</span>
            <span>💨 {weather.wind} km/h</span>
          </div>
          {wmo.peligro && (
            <div style={{ marginTop: '6px', fontSize: '11px', color: '#E8231A', fontWeight: 700 }}>
              ⚠️ Precaución al manejar
            </div>
          )}
        </div>
      )}

      {/* ── Controls ────────────────────────────────────────────────────── */}
      {interactive && (
        <div style={{
          position: 'absolute', bottom: '28px', left: '10px', zIndex: 1,
          display: 'flex', flexDirection: 'column', gap: '6px',
          maxWidth: 'calc(100% - 60px)',
        }}>
          {/* POI toggles */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { label: '⛽ Gasolineras', active: showGas,  bg: '#FFD700', color: '#111', fn: toggleGas },
              { label: '🏥 Hospitales',  active: showHosp, bg: '#3B82F6', color: '#fff', fn: toggleHosp },
            ].map(b => (
              <button key={b.label} onClick={b.fn} style={{
                padding: '5px 10px', borderRadius: '4px', border: 'none',
                background: b.active ? b.bg : 'rgba(10,10,8,0.82)',
                color: b.active ? b.color : '#F4F0EB',
                fontSize: '11px', cursor: 'pointer',
                fontWeight: b.active ? 700 : 400,
                backdropFilter: 'blur(4px)', whiteSpace: 'nowrap',
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
                background: estiloActual === estilo.id ? '#E8231A' : 'rgba(10,10,8,0.82)',
                color: '#F4F0EB', fontSize: '11px', cursor: 'pointer',
                fontWeight: estiloActual === estilo.id ? 700 : 400,
                backdropFilter: 'blur(4px)', whiteSpace: 'nowrap',
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
