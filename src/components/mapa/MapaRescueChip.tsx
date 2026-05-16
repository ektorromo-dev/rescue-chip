'use client'
import { useEffect, useRef, useCallback, useState } from 'react'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!
const OWM_TOKEN    = process.env.NEXT_PUBLIC_OWM_TOKEN ?? ''
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

const OWM_LAYERS = [
  { id: 'precipitation_new', label: '🌧️ Lluvia' },
  { id: 'wind_new',          label: '💨 Viento' },
]

const LIGHT_PRESETS = [
  { id: 'dawn',  label: '🌅 Alba'      },
  { id: 'day',   label: '☀️ Día'       },
  { id: 'dusk',  label: '🌆 Atardecer' },
  { id: 'night', label: '🌙 Noche'     },
]

const LS_KEY = 'rc_mapa_estilo'
const getEstiloGuardado = (): string => { try { return localStorage.getItem(LS_KEY) ?? 'dark-v11' } catch { return 'dark-v11' } }
const getEstiloUrl = (id: string): string => ESTILOS.find(e => e.id === id)?.url ?? ESTILOS[0].url

// ─── WEATHER ─────────────────────────────────────────────────────────────────
interface WMOEntry { label: string; emoji: string; alerta: string | null }
const WMO: Record<number, WMOEntry> = {
  0:  { label: 'Despejado',        emoji: '☀️',  alerta: null },
  1:  { label: 'Casi despejado',   emoji: '🌤️', alerta: null },
  2:  { label: 'Parcial. nublado', emoji: '⛅',  alerta: null },
  3:  { label: 'Nublado',          emoji: '☁️',  alerta: null },
  45: { label: 'Neblina',          emoji: '🌫️',  alerta: '⚠️ Neblina — visibilidad reducida' },
  48: { label: 'Niebla densa',     emoji: '🌫️',  alerta: '⚠️ Niebla — peligro extremo' },
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
const getWMO = (c: number): WMOEntry => WMO[c] ?? { label: `Cond. ${c}`, emoji: '🌡️', alerta: null }

export interface WeatherData {
  temp: number; wind: number; code: number
  forecast: Array<{ date: string; maxTemp: number; minTemp: number; code: number }>
}

async function fetchWeather(lat: number, lng: number): Promise<WeatherData | null> {
  try {
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
      `&current=temperature_2m,wind_speed_10m,weather_code` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=6`
    )
    const d = await r.json()
    const c = d.current; const daily = d.daily
    const forecast = (daily?.time ?? []).slice(1, 6).map((date: string, i: number) => ({
      date, maxTemp: Math.round(daily.temperature_2m_max[i + 1]),
      minTemp: Math.round(daily.temperature_2m_min[i + 1]), code: daily.weather_code[i + 1],
    }))
    return { temp: Math.round(c.temperature_2m), wind: Math.round(c.wind_speed_10m), code: c.weather_code, forecast }
  } catch { return null }
}

// ─── ROUTING ─────────────────────────────────────────────────────────────────
export interface AlternativeRoute { geometry: any; distanceM: number; durationS: number }
export interface RouteIncident { lng: number; lat: number; type: string; description?: string }
export interface RouteResult {
  geometry: any; distanceM: number; durationS: number
  steps: Array<{ instruction: string; distanceM: number }>
  congestion: string[]
  incidents: RouteIncident[]
  alternatives: AlternativeRoute[]
}

export async function fetchRoute(sLng: number, sLat: number, eLng: number, eLat: number): Promise<RouteResult | null> {
  try {
    const url =
      `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/` +
      `${sLng.toFixed(6)},${sLat.toFixed(6)};${eLng.toFixed(6)},${eLat.toFixed(6)}` +
      `?geometries=geojson&steps=true&language=es&alternatives=true` +
      `&annotations=congestion&overview=full&access_token=${MAPBOX_TOKEN}`
    const r = await fetch(url)
    const d = await r.json()
    const main = d.routes?.[0]
    if (!main) return null
    const steps = (main.legs?.[0]?.steps ?? []).map((s: any) => ({
      instruction: s.maneuver?.instruction ?? '', distanceM: Math.round(s.distance),
    }))
    const congestion: string[] = main.legs?.[0]?.annotation?.congestion ?? []
    const incidents: RouteIncident[] = (main.legs?.[0]?.incidents ?? []).map((inc: any) => {
      const idx = inc.geometry_index_start ?? 0
      const coord = main.geometry.coordinates[idx]
      return coord ? { lng: coord[0], lat: coord[1], type: inc.type ?? 'unknown', description: inc.description } : null
    }).filter(Boolean) as RouteIncident[]
    const alternatives: AlternativeRoute[] = (d.routes ?? []).slice(1, 3).map((alt: any) => ({
      geometry: alt.geometry, distanceM: Math.round(alt.distance), durationS: Math.round(alt.duration),
    }))
    return { geometry: main.geometry, distanceM: Math.round(main.distance), durationS: Math.round(main.duration), steps, congestion, incidents, alternatives }
  } catch { return null }
}

// ─── ROUTE DRAWING ────────────────────────────────────────────────────────────
// Returns the first symbol layer ID so route layers render BELOW map labels
function getRouteBeforeId(map: any): string | undefined {
  const layers: any[] = map.getStyle()?.layers ?? []
  // Busca capas de etiquetas de carreteras en orden de prioridad
  const priorities = ['road-label', 'road-number-shield', 'road-intersection', 'road-primary-label', 'motorway-label']
  for (const id of priorities) {
    if (layers.some(l => l.id === id)) return id
  }
  // Fallback: primera capa de tipo symbol
  return layers.find(l => l.type === 'symbol')?.id
}

function clearRouteFromMap(map: any) {
  if (!map) return
  const layers = ['rc-route-line', 'rc-route-casing', 'rc-alt-0', 'rc-alt-casing-0', 'rc-alt-1', 'rc-alt-casing-1']
  const sources = ['rc-route-src', 'rc-alt-src-0', 'rc-alt-src-1']
  layers.forEach(id => { try { if (map.getLayer(id)) map.removeLayer(id) } catch {} })
  sources.forEach(id => { try { if (map.getSource(id)) map.removeSource(id) } catch {} })
}

function drawRouteOnMap(map: any, result: RouteResult, selectedAlt = -1) {
  if (!map) return
  clearRouteFromMap(map)
  const beforeId = getRouteBeforeId(map)

  // 1. Alternatives FIRST (below main route, above basemap)
  result.alternatives.forEach((alt, i) => {
    const isSelected = i === selectedAlt
    map.addSource(`rc-alt-src-${i}`, { type: 'geojson', data: { type: 'Feature', geometry: alt.geometry, properties: {} } })
    map.addLayer({ id: `rc-alt-casing-${i}`, type: 'line', source: `rc-alt-src-${i}`,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#fff', 'line-width': 8, 'line-opacity': isSelected ? 0.35 : 0.2 }
    }, beforeId ?? undefined)
    map.addLayer({ id: `rc-alt-${i}`, type: 'line', source: `rc-alt-src-${i}`,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#9E9E9E',
        'line-width': 4,
        'line-opacity': 0.55,
        'line-dasharray': [2, 2],
      }
    }, beforeId ?? undefined)
  })

  // 2. Main route source — segmented by congestion if available
  const coords = result.geometry.coordinates
  const congestion = result.congestion
  let routeData: any

  if (congestion.length > 0 && coords.length > 1) {
    const features = congestion.map((level: string, i: number) => {
      if (i >= coords.length - 1) return null
      return { type: 'Feature', properties: { congestion: level }, geometry: { type: 'LineString', coordinates: [coords[i], coords[i + 1]] } }
    }).filter(Boolean)
    routeData = { type: 'FeatureCollection', features }
  } else {
    routeData = { type: 'Feature', geometry: result.geometry, properties: { congestion: 'unknown' } }
  }
  map.addSource('rc-route-src', { type: 'geojson', data: routeData })

  // 3. White casing (below colored line)
  map.addLayer({ id: 'rc-route-casing', type: 'line', source: 'rc-route-src',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#fff', 'line-width': 9, 'line-opacity': 0.38 }
  }, beforeId ?? undefined)

  // 4. Traffic-colored main line
  // Colors: low=blue(libre), moderate=orange(lento), heavy=red(muy lento), severe=dark-red(detenido)
  map.addLayer({ id: 'rc-route-line', type: 'line', source: 'rc-route-src',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': [
        'match', ['get', 'congestion'],
        'low',      '#4285F4',   // azul — tránsito libre
        'moderate', '#FF9800',   // naranja — lento
        'heavy',    '#F44336',   // rojo — muy lento
        'severe',   '#B71C1C',   // rojo oscuro — detenido
        /* default */ '#4285F4'
      ],
      'line-width': 5,
      'line-opacity': 0.95,
    }
  }, beforeId ?? undefined)
}

// ─── OWM OVERLAY ─────────────────────────────────────────────────────────────
function applyOWMLayer(map: any, layer: string | null) {
  if (!map) return
  try { if (map.getLayer('owm-layer')) map.removeLayer('owm-layer') } catch {}
  try { if (map.getSource('owm-source')) map.removeSource('owm-source') } catch {}
  if (!layer || !OWM_TOKEN) return
  map.addSource('owm-source', { type: 'raster', tiles: [`https://tile.openweathermap.org/map/${layer}/{z}/{x}/{y}.png?appid=${OWM_TOKEN}`], tileSize: 256 })
  map.addLayer({ id: 'owm-layer', type: 'raster', source: 'owm-source', paint: { 'raster-opacity': 0.55 } })
}

// ─── POIs ────────────────────────────────────────────────────────────────────
interface BBox { south: number; west: number; north: number; east: number }
async function fetchPOIsOverpass(tipo: 'fuel' | 'hospital', bbox: BBox): Promise<any[]> {
  const { south, west, north, east } = bbox
  const [s, w, n, e] = [south, west, north, east].map(v => v.toFixed(4))
  const filter = tipo === 'fuel' ? '["amenity"="fuel"]' : '["amenity"~"^(hospital|clinic)$"]'
  const query = `[out:json][timeout:20];(node${filter}(${s},${w},${n},${e});way${filter}(${s},${w},${n},${e}););out body center 40;`
  try {
    const r = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query, headers: { 'Content-Type': 'text/plain' } })
    return (await r.json()).elements ?? []
  } catch { return [] }
}
const PUBLIC_OPS = ['IMSS','ISSSTE','SSA','SECTOR SALUD','PEMEX','SEDENA','SEMAR','BIENESTAR','INSABI','ISSEMYM','ISEM','IMSS-BIENESTAR','GOBIERNO']
function getGasInfo(tags: any) {
  const title = (tags.brand || tags.operator || tags.name || '').trim() || 'Gasolinera'
  const subtitle = (tags.name && tags.name.trim().toUpperCase() !== title.toUpperCase()) ? tags.name.trim() : ''
  return { title, subtitle }
}
function getHospInfo(tags: any) {
  const name = (tags.name || tags['name:es'] || '').trim()
  const op   = (tags.operator || '').trim()
  const opType = (tags['operator:type'] || '').toLowerCase()
  const title = name || op || 'Hospital'
  const isPublic  = PUBLIC_OPS.some(p => op.toUpperCase().includes(p)) || opType === 'public' || opType === 'government'
  const isPrivate = opType === 'private' || (!isPublic && op.length > 0)
  const subtitle  = op ? (isPublic ? `Público · ${op}` : isPrivate ? `Privado · ${op}` : op)
                       : opType === 'public' ? 'Público' : opType === 'private' ? 'Privado'
                       : tags.amenity === 'hospital' ? 'Hospital' : 'Clínica'
  return { title, subtitle }
}

// ─── UTILS ───────────────────────────────────────────────────────────────────
function clearMarkers(ref: React.MutableRefObject<any[]>) { ref.current.forEach(m => m.remove()); ref.current = [] }
function fmtDist(m: number): string { return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km` }
function fmtTime(s: number): string { const min = Math.round(s / 60); return min < 60 ? `${min} min` : `${Math.floor(min / 60)}h ${min % 60}min` }

function loadMapboxScript(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).mapboxgl) { resolve(); return }
    const ex = document.getElementById('mapbox-gl-js')
    if (ex) { ex.addEventListener('load', () => resolve()); return }
    const s = document.createElement('script')
    s.id = 'mapbox-gl-js'; s.src = MAPBOX_JS; s.onload = () => resolve()
    document.head.appendChild(s)
  })
}

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface Punto { id: string; tipo: string; latitud: number; longitud: number; fuente: 'reporte' | 'emergencia'; descripcion?: string }
export interface NavRoute {
  origen: { lng: number; lat: number; label: string }
  destino: { lng: number; lat: number; label: string }
  result: RouteResult
  destinoWeather?: WeatherData | null
  selectedAlt?: number // -1 = main, 0+ = alternative index
}
interface Props {
  puntos?: Punto[]; interactive?: boolean; height?: string; fullscreen?: boolean
  navRoute?: NavRoute | null
  onAlternativeSelect?: (idx: number) => void
  onMapReady?: (map: any) => void
  onEnterFullscreen?: () => void
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function MapaRescueChip({ puntos = [], interactive = true, height = '500px', fullscreen = false, navRoute = null, onAlternativeSelect, onMapReady }: Props) {
  const mapContainer  = useRef<HTMLDivElement>(null)
  const mapRef        = useRef<any>(null)
  const mboxRef       = useRef<any>(null)
  const markersRef    = useRef<any[]>([])
  const gasMkrs       = useRef<any[]>([])
  const hospMkrs      = useRef<any[]>([])
  const navMkrs       = useRef<any[]>([])        // origen/destino pins
  const weatherMkrs   = useRef<any[]>([])        // climate markers along route
  const incidentMkrs  = useRef<any[]>([])        // incident markers
  const puntosRef     = useRef<Punto[]>(puntos)
  const showGasRef    = useRef(false)
  const showHospRef   = useRef(false)
  const owmLayerRef   = useRef<string | null>(null)
  const navRouteRef   = useRef<NavRoute | null>(navRoute) // tracks latest navRoute without deps

  const [estiloActual,    setEstiloActual]    = useState<string>(getEstiloGuardado)
  const [showGas,         setShowGas]         = useState(false)
  const [showHosp,        setShowHosp]        = useState(false)
  const [showStylePicker, setShowStylePicker] = useState(false)
  const [owmLayer,        setOwmLayer]        = useState<string | null>(null)
  const [weather,         setWeather]         = useState<WeatherData | null>(null)
  const [showForecast,    setShowForecast]    = useState(false)
  const [poiMsg,          setPoiMsg]          = useState('')
  const [showSteps,       setShowSteps]       = useState(false)
  const [navigating,   setNavigating]   = useState(false)
  const [navStep,      setNavStep]      = useState(0)
  const [navDist,      setNavDist]      = useState<number | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const userPosRef = useRef<[number, number] | null>(null)

  useEffect(() => { puntosRef.current   = puntos  }, [puntos])
  useEffect(() => { showGasRef.current  = showGas  }, [showGas])
  useEffect(() => { showHospRef.current = showHosp }, [showHosp])
  useEffect(() => { navRouteRef.current = navRoute }, [navRoute])

  // OWM layer sync
  useEffect(() => {
    owmLayerRef.current = owmLayer
    if (!mapRef.current) return
    if (mapRef.current.isStyleLoaded()) applyOWMLayer(mapRef.current, owmLayer)
    else mapRef.current.once('style.load', () => applyOWMLayer(mapRef.current, owmLayer))
  }, [owmLayer])

  // Auto-center in fullscreen
  useEffect(() => {
    if (!fullscreen || !mapRef.current) return
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => mapRef.current?.flyTo({ center: [coords.longitude, coords.latitude], zoom: 14, duration: 1200 }),
      undefined, { timeout: 5000 }
    )
  }, [fullscreen])

  // Draw nav route — runs when navRoute changes
  const drawNavRoute = useCallback(() => {
    const nr = navRouteRef.current
    const map = mapRef.current
    const mapboxgl = mboxRef.current
    clearMarkers(navMkrs)
    clearMarkers(weatherMkrs)
    clearMarkers(incidentMkrs)
    clearRouteFromMap(map)
    if (!nr || !map || !mapboxgl) return

    const selectedAlt = nr.selectedAlt ?? -1
    drawRouteOnMap(map, nr.result, selectedAlt)

    // Determine which geometry to use for markers
    const activeGeometry = selectedAlt >= 0 && nr.result.alternatives[selectedAlt]
      ? nr.result.alternatives[selectedAlt].geometry
      : nr.result.geometry

    // Origin (green) + destination (red) markers
    const elO = document.createElement('div')
    elO.style.cssText = 'width:14px;height:14px;border-radius:50%;background:#22c55e;border:3px solid white;box-shadow:0 0 10px #22c55e;'
    navMkrs.current.push(new mapboxgl.Marker({ element: elO }).setLngLat([nr.origen.lng, nr.origen.lat]).addTo(map))
    const elD = document.createElement('div')
    elD.style.cssText = 'width:14px;height:14px;border-radius:50%;background:#E8231A;border:3px solid white;box-shadow:0 0 10px #E8231A;'
    navMkrs.current.push(new mapboxgl.Marker({ element: elD }).setLngLat([nr.destino.lng, nr.destino.lat]).addTo(map))

    // Fit bounds
    const coords = activeGeometry.coordinates
    const lngs = coords.map((c: number[]) => c[0]); const lats = coords.map((c: number[]) => c[1])
    map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 70, duration: 900 })

    // Weather markers at 3 sample points along route (async, non-blocking)
    ;(async () => {
      const totalCoords = activeGeometry.coordinates.length
      const sampleIdxs = [
        Math.floor(totalCoords * 0.25),
        Math.floor(totalCoords * 0.5),
        Math.floor(totalCoords * 0.75),
      ]
      for (const idx of sampleIdxs) {
        const [lng, lat] = activeGeometry.coordinates[idx]
        const w = await fetchWeather(lat, lng)
        if (!w || !mapRef.current) continue
        const wmo = getWMO(w.code)
        const hasAlert = wmo.alerta !== null || w.wind >= 50
        if (!hasAlert) continue

        const isRainy = w.code >= 51 && w.code <= 82
        const isMisty = w.code === 45 || w.code === 48
        const isStormy = w.code >= 95
        const isWindy = w.wind >= 50

        const emoji = isStormy ? '⛈️' : isMisty ? '🌫️' : isRainy ? '🌧️' : isWindy ? '💨' : wmo.emoji
        const el = document.createElement('div')
        el.style.cssText = `font-size:20px;cursor:pointer;filter:drop-shadow(0 1px 4px rgba(0,0,0,0.7));line-height:1;`
        el.textContent = emoji

        const windMsg = isWindy ? `<br/><span style="color:#9333ea;font-weight:700">💨 Viento ${w.wind} km/h</span>` : ''
        const alertMsg = wmo.alerta ? `<br/><span style="color:#E8231A;font-weight:700">${wmo.alerta}</span>` : ''
        const popup = new mapboxgl.Popup({ offset: 10, closeButton: false })
          .setHTML(`<div style="font-family:sans-serif;font-size:12px;color:#111;padding:3px;min-width:130px">
            <strong>${wmo.emoji} ${wmo.label}</strong><br/>
            🌡️ ${w.temp}°C · 💨 ${w.wind} km/h
            ${alertMsg}${windMsg}
          </div>`)
        const marker = new mapboxgl.Marker({ element: el }).setLngLat([lng, lat]).setPopup(popup).addTo(mapRef.current)
        weatherMkrs.current.push(marker)
      }
    })()

    // Incident markers
    nr.result.incidents.forEach(inc => {
      const ICONS: Record<string, string> = { accident: '🚨', construction: '🚧', lane_restriction: '⚠️', road_closure: '🚫', congestion: '🚗' }
      const emoji = ICONS[inc.type] ?? '⚠️'
      const el = document.createElement('div')
      el.style.cssText = `font-size:22px;cursor:pointer;filter:drop-shadow(0 1px 4px rgba(0,0,0,0.7));line-height:1;`
      el.textContent = emoji
      const label = inc.type.replace(/_/g, ' ')
      const popup = new mapboxgl.Popup({ offset: 10, closeButton: false })
        .setHTML(`<div style="font-family:sans-serif;font-size:12px;color:#111;padding:3px">
          <strong>${emoji} ${label.charAt(0).toUpperCase() + label.slice(1)}</strong>
          ${inc.description ? `<br/><span style="color:#555">${inc.description}</span>` : ''}
        </div>`)
      const marker = new mapboxgl.Marker({ element: el }).setLngLat([inc.lng, inc.lat]).setPopup(popup).addTo(map)
      incidentMkrs.current.push(marker)
    })
  }, []) // stable — reads from navRouteRef

  useEffect(() => {
    if (!mapRef.current?.isStyleLoaded()) return
    drawNavRoute()
  }, [navRoute, drawNavRoute])

  // ── Stable: incident markers (existing reports) ──────────────────────────
  const addMarkers = useCallback(() => {
    const mapboxgl = mboxRef.current
    if (!mapRef.current || !mapboxgl) return
    clearMarkers(markersRef)
    puntosRef.current.forEach(punto => {
      const el = document.createElement('div')
      el.style.cssText = `width:14px;height:14px;border-radius:50%;background:${COLORES[punto.tipo] ?? COLORES.accidente};border:2px solid white;box-shadow:0 0 8px ${COLORES[punto.tipo] ?? COLORES.accidente};cursor:pointer;`
      const popup = new mapboxgl.Popup({ offset: 12, closeButton: false })
        .setHTML(`<div style="font-family:sans-serif;font-size:13px;color:#111;padding:4px 2px">
          <strong style="text-transform:capitalize">${punto.tipo.replace('_', ' ')}</strong>
          ${punto.descripcion ? `<p style="margin:4px 0 0;color:#555">${punto.descripcion}</p>` : ''}
          <p style="margin:4px 0 0;font-size:11px;color:#999">${punto.fuente === 'emergencia' ? '🚨 Emergencia real' : '⚠️ Reporte de rider'}</p>
        </div>`)
      const marker = new mapboxgl.Marker({ element: el }).setLngLat([punto.longitud, punto.latitud]).setPopup(popup).addTo(mapRef.current)
      markersRef.current.push(marker)
    })
  }, [])

  // ── Stable: POI markers with routing ────────────────────────────────────
  const addPOIMarkers = useCallback((elements: any[], tipo: 'gasolinera' | 'hospital', ref: React.MutableRefObject<any[]>) => {
    const mapboxgl = mboxRef.current
    if (!mapRef.current || !mapboxgl) return
    clearMarkers(ref)
    elements.forEach(el => {
      const lng = el.type === 'node' ? el.lon : el.center?.lon
      const lat = el.type === 'node' ? el.lat : el.center?.lat
      if (lng == null || lat == null) return
      const tags = el.tags || {}
      const { title, subtitle } = tipo === 'gasolinera' ? getGasInfo(tags) : getHospInfo(tags)
      const emoji = tipo === 'gasolinera' ? '⛽' : '🏥'
      const color = tipo === 'gasolinera' ? '#D97706' : '#3B82F6'

      const div = document.createElement('div')
      div.style.cssText = `width:28px;height:28px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;flex-shrink:0;`
      div.textContent = emoji

      const popup = new mapboxgl.Popup({ offset: 14, closeButton: true, maxWidth: '250px' })
      popup.on('close', () => {
        // Only clear route if no navRoute is active
        if (!navRouteRef.current) clearRouteFromMap(mapRef.current)
      })

      div.addEventListener('click', (e) => {
        e.stopPropagation()
        popup.setHTML(`<div style="font-family:sans-serif;font-size:13px;color:#111;padding:4px;min-width:160px">
          <strong>${title}</strong>${subtitle ? `<p style="margin:3px 0;color:#555;font-size:12px">${subtitle}</p>` : ''}
          <p style="margin:6px 0 0;color:#999;font-size:11px">📍 Calculando ruta...</p>
        </div>`)
        if (!popup.isOpen()) popup.addTo(mapRef.current)
        navigator.geolocation.getCurrentPosition(
          async ({ coords }) => {
            const route = await fetchRoute(coords.longitude, coords.latitude, lng, lat)
            if (!popup.isOpen()) return
            const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
            if (route && !navRouteRef.current) {
              clearRouteFromMap(mapRef.current)
              drawRouteOnMap(mapRef.current, route)
            }
            popup.setHTML(`<div style="font-family:sans-serif;font-size:13px;color:#111;padding:4px;min-width:160px;max-width:240px">
              <strong>${title}</strong>${subtitle ? `<p style="margin:3px 0;color:#555;font-size:12px">${subtitle}</p>` : ''}
              ${route ? `<div style="margin:7px 0 0;padding:6px 0 0;border-top:1px solid #eee">
                <span style="font-size:12px;color:#333;font-weight:600">📍 ${fmtDist(route.distanceM)} · ${fmtTime(route.durationS)}</span><br/>
                <a href="${navUrl}" target="_blank" rel="noopener" style="display:inline-block;margin-top:6px;padding:5px 14px;background:#4285F4;color:#fff;border-radius:4px;font-size:11px;text-decoration:none;font-weight:600">Abrir en Maps →</a>
              </div>` : `<p style="margin:6px 0 0;color:#888;font-size:11px">Activa la ubicación para ver la ruta</p>`}
            </div>`)
          },
          () => { if (popup.isOpen()) popup.setHTML(`<div style="font-family:sans-serif;font-size:13px;color:#111;padding:4px"><strong>${title}</strong>${subtitle ? `<p style="color:#555;font-size:12px">${subtitle}</p>` : ''}<p style="color:#888;font-size:11px">Activa la ubicación para ver la ruta</p></div>`) },
          { timeout: 6000, enableHighAccuracy: true }
        )
      })

      const marker = new mapboxgl.Marker({ element: div }).setLngLat([lng, lat]).setPopup(popup).addTo(mapRef.current)
      ref.current.push(marker)
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
        center: [-99.1332, 19.4326], zoom: 5,
        interactive,
        cooperativeGestures: interactive && !fullscreen,
        language: 'es',
        locale: {
          'TouchPanBlocker.Message': 'Usa dos dedos para mover el mapa',
          'ScrollZoomBlocker.CtrlMessage': 'Mantén Ctrl y haz scroll para hacer zoom',
          'ScrollZoomBlocker.CmdMessage': 'Mantén ⌘ y haz scroll para hacer zoom',
        },
      })

      if (interactive) {
        if (!fullscreen) mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
        // In fullscreen: GeolocateControl at top-left (X button is top-right in header)
        mapRef.current.addControl(
          new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }),
          fullscreen ? 'bottom-left' : 'top-right'
        )

        // Initial weather
        navigator.geolocation?.getCurrentPosition(
          async ({ coords }) => { const w = await fetchWeather(coords.latitude, coords.longitude); if (!cancelled) setWeather(w) },
          async () => { const c = mapRef.current?.getCenter(); if (c) { const w = await fetchWeather(c.lat, c.lng); if (!cancelled) setWeather(w) } },
          { timeout: 5000 }
        )

        // Refresh weather + POIs on map move
        mapRef.current.on('moveend', () => {
          if (moveTimer) clearTimeout(moveTimer)
          moveTimer = setTimeout(async () => {
            const c = mapRef.current?.getCenter()
            if (!c || cancelled) return
            const w = await fetchWeather(c.lat, c.lng); if (!cancelled) setWeather(w)
            const bounds = mapRef.current?.getBounds()
            if (!bounds) return
            const bbox: BBox = { south: bounds.getSouth(), west: bounds.getWest(), north: bounds.getNorth(), east: bounds.getEast() }
            if (showGasRef.current) { const els = await fetchPOIsOverpass('fuel', bbox); if (!cancelled) addPOIMarkers(els, 'gasolinera', gasMkrs) }
            if (showHospRef.current) { const els = await fetchPOIsOverpass('hospital', bbox); if (!cancelled) addPOIMarkers(els, 'hospital', hospMkrs) }
          }, 1400)
        })

        // Click alternatives
        for (let i = 0; i < 2; i++) {
          mapRef.current.on('click', `rc-alt-${i}`, () => { onAlternativeSelect?.(i) })
          mapRef.current.on('mouseenter', `rc-alt-${i}`, () => { mapRef.current.getCanvas().style.cursor = 'pointer' })
          mapRef.current.on('mouseleave', `rc-alt-${i}`, () => { mapRef.current.getCanvas().style.cursor = '' })
        }
      }

      const onLoad = () => {
        addMarkers()
        if (owmLayerRef.current) applyOWMLayer(mapRef.current, owmLayerRef.current)
        if (navRouteRef.current) drawNavRoute()
      }
      mapRef.current.on('load', onLoad)
      mapRef.current.on('style.load', () => {
        addMarkers()
        if (owmLayerRef.current) applyOWMLayer(mapRef.current, owmLayerRef.current)
        if (navRouteRef.current) drawNavRoute()
      })
      if (onMapReady) mapRef.current.on('load', () => onMapReady(mapRef.current))
    }

    init()
    return () => {
      cancelled = true
      if (moveTimer) clearTimeout(moveTimer)
      if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null }
      clearMarkers(markersRef); clearMarkers(gasMkrs); clearMarkers(hospMkrs)
      clearMarkers(navMkrs); clearMarkers(weatherMkrs); clearMarkers(incidentMkrs)
      mapRef.current?.remove(); mapRef.current = null; mboxRef.current = null
    }
  }, [interactive, fullscreen, addMarkers, addPOIMarkers, drawNavRoute, onMapReady]) // eslint-disable-line

  useEffect(() => { if (mapRef.current?.isStyleLoaded()) addMarkers() }, [puntos, addMarkers])

  // ── POI toggles ──────────────────────────────────────────────────────────
  const getBBox = useCallback((): BBox | null => {
    const b = mapRef.current?.getBounds()
    return b ? { south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() } : null
  }, [])
  const checkZoom = useCallback((tipo: string): boolean => {
    if ((mapRef.current?.getZoom() ?? 0) < 10) { setPoiMsg(`Acércate más para ver ${tipo}`); setTimeout(() => setPoiMsg(''), 3500); return false }
    return true
  }, [])
  const toggleGas = useCallback(async () => {
    const next = !showGasRef.current; setShowGas(next)
    if (!next) { clearMarkers(gasMkrs); return }
    if (!checkZoom('gasolineras')) { setShowGas(false); return }
    const bbox = getBBox(); if (!bbox) return
    addPOIMarkers(await fetchPOIsOverpass('fuel', bbox), 'gasolinera', gasMkrs)
  }, [addPOIMarkers, checkZoom, getBBox])
  const toggleHosp = useCallback(async () => {
    const next = !showHospRef.current; setShowHosp(next)
    if (!next) { clearMarkers(hospMkrs); return }
    if (!checkZoom('hospitales')) { setShowHosp(false); return }
    const bbox = getBBox(); if (!bbox) return
    addPOIMarkers(await fetchPOIsOverpass('hospital', bbox), 'hospital', hospMkrs)
  }, [addPOIMarkers, checkZoom, getBBox])
  const startNavigation = useCallback(() => {
    if (!navRouteRef.current) return
    setNavigating(true); setNavStep(0)
    watchIdRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        userPosRef.current = [coords.longitude, coords.latitude]
        if (!mapRef.current || !navRouteRef.current) return
        // Centrar mapa en posición actual
        mapRef.current.easeTo({ center: [coords.longitude, coords.latitude], zoom: 15, duration: 500 })
        // Encontrar paso más cercano
        const steps = navRouteRef.current.result.steps
        if (!steps.length) return
        // Calcular distancia al próximo paso (simplificado)
        const curStep = navStep
        if (curStep < steps.length) {
          const remaining = steps.slice(curStep).reduce((a, s) => a + s.distanceM, 0)
          setNavDist(remaining)
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    )
  }, [navStep])

  const stopNavigation = useCallback(() => {
    setNavigating(false); setNavStep(0); setNavDist(null)
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  const [lightPreset, setLightPreset] = useState<string>('day')

  const changeStyle = useCallback((estilo: typeof ESTILOS[0]) => {
    setEstiloActual(estilo.id)
    try { localStorage.setItem(LS_KEY, estilo.id) } catch {}
    mapRef.current?.setStyle(estilo.url)
    mapRef.current?.once('style.load', () => {
      const PITCH_MAP: Record<string, number> = { 'standard': 45 }
      mapRef.current?.setPitch(PITCH_MAP[estilo.id] ?? 0)
      if (estilo.id === 'standard') {
        try { mapRef.current?.setConfigProperty('basemap', 'lightPreset', lightPreset) } catch {}
        try { mapRef.current?.setConfigProperty('basemap', 'show3dObjects', true) } catch {}
      }
    })
    setShowStylePicker(false)
  }, [lightPreset])

  const changeLightPreset = useCallback((preset: string) => {
    setLightPreset(preset)
    try { mapRef.current?.setConfigProperty('basemap', 'lightPreset', preset) } catch {}
  }, [])

  const wmo      = weather ? getWMO(weather.code) : null
  const alertMsg = (weather?.wind ?? 0) >= 50 ? `⚠️ Viento fuerte — ${weather!.wind} km/h` : (wmo?.alerta ?? null)

  const btnS = (active: boolean, bg: string, tc = '#F4F0EB'): React.CSSProperties => ({
    padding: '6px 11px', borderRadius: '6px', border: 'none',
    background: active ? bg : 'rgba(10,10,8,0.80)', color: active ? tc : '#F4F0EB',
    fontSize: '12px', cursor: 'pointer', fontWeight: active ? 700 : 400,
    backdropFilter: 'blur(10px)', whiteSpace: 'nowrap', flexShrink: 0,
  })

  return (
    <div style={{ position: 'relative', width: '100%', height, overflow: 'hidden' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* ── Weather card ───────────────────────────────────────── */}
      {interactive && weather && wmo && (
        <div onClick={() => setShowForecast(f => !f)} style={{
          position: 'absolute',
          top: fullscreen ? '96px' : '10px',
          left: '10px',
          zIndex: 2,
          background: 'rgba(10,10,8,0.88)',
          border: `1px solid ${alertMsg ? 'rgba(232,35,26,0.6)' : 'rgba(244,240,235,0.12)'}`,
          borderRadius: '10px', padding: '8px 12px', color: '#F4F0EB',
          backdropFilter: 'blur(12px)', minWidth: '148px', cursor: 'pointer', userSelect: 'none',
        }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '3px' }}>{wmo.emoji} {wmo.label}</div>
          <div style={{ fontSize: '12px', color: '#bbb', display: 'flex', gap: '10px' }}>
            <span>🌡️ {weather.temp}°C</span><span>💨 {weather.wind} km/h</span>
          </div>
          {alertMsg && <div style={{ marginTop: '5px', fontSize: '11px', color: '#E8231A', fontWeight: 700 }}>{alertMsg}</div>}
          {showForecast && weather.forecast.length > 0 && (
            <div style={{ marginTop: '8px', borderTop: '1px solid rgba(244,240,235,0.1)', paddingTop: '8px' }}>
              <div style={{ fontSize: '10px', color: '#888', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px' }}>Próximos 5 días</div>
              {weather.forecast.map(day => {
                const wd = getWMO(day.code)
                const d  = new Date(day.date + 'T12:00:00')
                return (
                  <div key={day.date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', padding: '2px 0' }}>
                    <span style={{ color: '#aaa', minWidth: '30px' }}>{d.toLocaleDateString('es-MX', { weekday: 'short' })}</span>
                    <span>{wd.emoji}</span>
                    <span>{day.maxTemp}° <span style={{ color: '#666' }}>{day.minTemp}°</span></span>
                  </div>
                )
              })}
            </div>
          )}
          <div style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>{showForecast ? '▲ Ocultar' : '▼ Pronóstico 5 días'}</div>
        </div>
      )}

      {/* ── Panel navegación activa ──────────────────────── */}
      {navigating && navRoute && (
        <div style={{
          position: 'absolute', top: fullscreen ? '52px' : '10px',
          right: '10px', zIndex: 5,
          background: 'rgba(10,10,8,0.95)', borderRadius: '10px',
          padding: '10px 14px', backdropFilter: 'blur(14px)',
          border: '1px solid rgba(232,35,26,0.4)', color: '#F4F0EB',
          minWidth: '200px', maxWidth: '260px',
        }}>
          <div style={{ fontSize: '11px', color: '#E8231A', fontWeight: 700, marginBottom: '4px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            🔴 Navegando
          </div>
          {navRoute.result.steps[navStep] && (
            <div style={{ fontSize: '13px', color: '#F4F0EB', lineHeight: '1.4', marginBottom: '6px' }}>
              {navRoute.result.steps[navStep].instruction}
            </div>
          )}
          {navDist !== null && (
            <div style={{ fontSize: '12px', color: '#aaa' }}>Distancia restante: {fmtDist(navDist)}</div>
          )}
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            {navStep > 0 && (
              <button onClick={() => setNavStep(s => s - 1)} style={{ flex: 1, background: 'rgba(244,240,235,0.1)', border: 'none', color: '#F4F0EB', borderRadius: '4px', padding: '6px', fontSize: '12px', cursor: 'pointer' }}>◀ Anterior</button>
            )}
            {navStep < navRoute.result.steps.length - 1 && (
              <button onClick={() => setNavStep(s => s + 1)} style={{ flex: 1, background: 'rgba(244,240,235,0.1)', border: 'none', color: '#F4F0EB', borderRadius: '4px', padding: '6px', fontSize: '12px', cursor: 'pointer' }}>Siguiente ▶</button>
            )}
          </div>
          <button onClick={stopNavigation} style={{ width: '100%', marginTop: '6px', background: '#E8231A', border: 'none', color: '#fff', borderRadius: '4px', padding: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
            ⏹ Detener navegación
          </button>
        </div>
      )}

      {/* ── Nav route summary ──────────────────────────────────── */}
      {navRoute && (
        <div style={{
          position: 'absolute', bottom: fullscreen ? '110px' : '150px', left: '10px', right: '10px',
          zIndex: 2, background: 'rgba(10,10,8,0.92)', borderRadius: '10px',
          padding: '12px 14px', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(244,240,235,0.12)', color: '#F4F0EB',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#E8231A' }}>{fmtDist(navRoute.result.distanceM)}</span>
              <span style={{ fontSize: '14px', color: '#aaa', marginLeft: '10px' }}>{fmtTime(navRoute.result.durationS)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#888', flex: 1 }}>{navRoute.origen.label} → {navRoute.destino.label}</div>
            {!navigating && (
              <button onClick={startNavigation} style={{
                background: '#22c55e', color: '#fff', border: 'none',
                borderRadius: '5px', padding: '5px 10px', fontSize: '11px',
                fontWeight: 700, cursor: 'pointer', marginLeft: '8px', flexShrink: 0,
              }}>▶ Navegar</button>
            )}
          </div>
          {/* Leyenda tráfico compacta */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
            {[['#4285F4','Libre'],['#FF9800','Lento'],['#F44336','Pesado'],['#B71C1C','Detenido']].map(([color, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#888' }}>
                <div style={{ width: '14px', height: '3px', background: color, borderRadius: '2px' }} />{label}
              </div>
            ))}
          </div>
          {/* Destino weather */}
          {navRoute.destinoWeather && (() => {
            const dw = getWMO(navRoute.destinoWeather!.code)
            const windAlertDst = navRoute.destinoWeather!.wind >= 50 ? `💨 Viento fuerte — ${navRoute.destinoWeather!.wind} km/h` : null
            const alertDst = windAlertDst ?? dw.alerta
            return (
              <div style={{ marginTop: '6px', fontSize: '12px', color: '#aaa' }}>
                Destino: {dw.emoji} {dw.label} · {navRoute.destinoWeather!.temp}°C
                {alertDst && <span style={{ color: '#E8231A', fontWeight: 700, marginLeft: '6px' }}>{alertDst}</span>}
              </div>
            )
          })()}
          {/* Precauciones del rider */}
          {(() => {
            const prec: string[] = []
            const cong = navRoute.result.congestion
            const total = Math.max(cong.length, 1)
            const heavyPct = cong.filter(c => c === 'heavy' || c === 'severe').length / total
            const modPct   = cong.filter(c => c === 'moderate').length / total
            if (heavyPct > 0.2)       prec.push(`🔴 ${Math.round(heavyPct * 100)}% de la ruta con tráfico muy pesado — considera salir en otro horario`)
            else if (heavyPct > 0.05) prec.push(`🟠 Tramos con tráfico pesado — mantén distancia de seguridad`)
            else if (modPct > 0.3)    prec.push(`🟡 Varios tramos lentos — anticipa frenadas`)
            else if (cong.length > 0) prec.push(`🟢 Tráfico fluido en la mayor parte de la ruta`)
            const acc   = navRoute.result.incidents.filter(i => i.type === 'accident').length
            const obras = navRoute.result.incidents.filter(i => i.type === 'construction').length
            const cierre = navRoute.result.incidents.filter(i => i.type === 'road_closure').length
            if (acc > 0)    prec.push(`🚨 ${acc} accidente(s) en ruta — reduce velocidad al pasar`)
            if (obras > 0)  prec.push(`🚧 ${obras} zona(s) de obra — carril reducido, sé visible`)
            if (cierre > 0) prec.push(`🚫 ${cierre} cierre(s) de carretera — verifica ruta alternativa`)
            if (navRoute.destinoWeather) {
              const dw = navRoute.destinoWeather
              const dwmo = { 45:'🌫️ Neblina en destino', 48:'🌫️ Niebla densa en destino', 51:'🌧️ Llovizna en destino', 61:'🌧️ Lluvia en destino', 63:'🌧️ Lluvia moderada en destino', 65:'🌧️ Lluvia fuerte en destino', 80:'🌧️ Chubascos en destino', 95:'⛈️ Tormenta en destino — evalúa si salir' }
              const dmsg = (dwmo as any)[dw.code]
              if (dmsg) prec.push(dmsg)
              if (dw.wind >= 50) prec.push(`💨 Viento fuerte en destino (${dw.wind} km/h) — mayor esfuerzo físico y menor estabilidad`)
            }
            const distKm = navRoute.result.distanceM / 1000
            if (distKm > 300)      prec.push(`📏 Ruta larga (${Math.round(distKm)} km) — planea 2+ paradas de descanso`)
            else if (distKm > 150) prec.push(`📏 Ruta media (${Math.round(distKm)} km) — considera 1 parada de descanso`)
            prec.push(`🪖 Verifica casco, guantes y equipo completo antes de salir`)
            if (navRoute.result.alternatives.length > 0) prec.push(`🛣️ Hay ${navRoute.result.alternatives.length} ruta(s) alternativa(s) — tócalas en el mapa para compararlas`)
            return (
              <div style={{ marginTop: '8px', borderTop: '1px solid rgba(244,240,235,0.1)', paddingTop: '8px' }}>
                <div style={{ fontSize: '10px', color: '#666', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Precauciones para el rider</div>
                {prec.map((p, i) => (
                  <div key={i} style={{ fontSize: '12px', color: '#ccc', padding: '4px 0', borderBottom: '1px solid rgba(244,240,235,0.05)', lineHeight: '1.4' }}>{p}</div>
                ))}
              </div>
            )
          })()}
        </div>
      )}

      {/* ── POI message ──────────────────────────────────────────── */}
      {poiMsg && (
        <div style={{
          position: 'absolute', top: fullscreen ? '115px' : 'auto', bottom: fullscreen ? 'auto' : '200px',
          left: '10px', zIndex: 3, background: 'rgba(10,10,8,0.92)', color: '#F4F0EB',
          padding: '7px 14px', borderRadius: '8px', fontSize: '12px', border: '1px solid rgba(244,240,235,0.2)',
        }}>
          {poiMsg}
        </div>
      )}

      {/* ── FULLSCREEN: top bar controls ─────────────────────────── */}
      {interactive && fullscreen && (
        <>
          <div style={{
            position: 'absolute', top: '52px', left: '8px', right: '8px',
            zIndex: 2, display: 'flex', gap: '5px', overflowX: 'auto',
            scrollbarWidth: 'none' as const, msOverflowStyle: 'none' as const,
          }}>
            <button onClick={toggleGas}  style={btnS(showGas,  '#D97706', '#fff')}>⛽ Gasolineras</button>
            <button onClick={toggleHosp} style={btnS(showHosp, '#3B82F6')}>🏥 Hospitales</button>
            {OWM_LAYERS.map(l => (
              <button key={l.id} onClick={() => setOwmLayer(owmLayer === l.id ? null : l.id)} style={btnS(owmLayer === l.id, '#0EA5E9')}>
                {l.label}
              </button>
            ))}
            <button onClick={() => setShowStylePicker(p => !p)} style={btnS(showStylePicker, '#6B21A8')}>⊞ Vista</button>
          </div>
          {showStylePicker && (
            <div style={{
              position: 'absolute', top: '90px', right: '8px', zIndex: 4,
              background: 'rgba(10,10,8,0.96)', borderRadius: '10px', padding: '6px',
              display: 'flex', flexDirection: 'column', gap: '3px',
              border: '1px solid rgba(244,240,235,0.15)', backdropFilter: 'blur(14px)', minWidth: '140px',
            }}>
              {ESTILOS.map(e => (
                <button key={e.id} onClick={() => changeStyle(e)} style={{
                  ...btnS(estiloActual === e.id, '#E8231A'),
                  textAlign: 'left', padding: '8px 12px', borderRadius: '6px',
                  background: estiloActual === e.id ? '#E8231A' : 'transparent',
                }}>
                  {e.label}
                </button>
              ))}
            {estiloActual === 'standard' && (
              <div style={{ marginTop: '4px', borderTop: '1px solid rgba(244,240,235,0.1)', paddingTop: '4px' }}>
                {LIGHT_PRESETS.map(lp => (
                  <button key={lp.id} onClick={() => changeLightPreset(lp.id)} style={{
                    ...btnS(lightPreset === lp.id, '#6B21A8'),
                    textAlign: 'left', padding: '7px 12px', borderRadius: '6px', width: '100%',
                    background: lightPreset === lp.id ? '#6B21A8' : 'transparent',
                  }}>
                    {lp.label}
                  </button>
                ))}
              </div>
            )}
            </div>
          )}
        </>
      )}

      {/* ── Botón fullscreen discreto ────────────────────────────── */}
      {interactive && !fullscreen && onEnterFullscreen && (
        <button
          onClick={onEnterFullscreen}
          title="Pantalla completa"
          style={{
            position: 'absolute', top: '10px', right: '10px', zIndex: 2,
            background: 'rgba(10,10,8,0.75)', border: '1px solid rgba(244,240,235,0.2)',
            borderRadius: '6px', padding: '6px 8px', color: '#F4F0EB',
            fontSize: '14px', cursor: 'pointer', backdropFilter: 'blur(8px)',
            lineHeight: 1,
          }}
        >
          ⛶
        </button>
      )}

      {/* ── NON-FULLSCREEN: bottom-left controls ─────────────────── */}
      {interactive && !fullscreen && (
        <div style={{ position: 'absolute', bottom: '36px', left: '10px', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '5px', maxWidth: 'calc(100% - 60px)' }}>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <button onClick={toggleGas}  style={btnS(showGas,  '#D97706', '#fff')}>⛽ Gasolineras</button>
            <button onClick={toggleHosp} style={btnS(showHosp, '#3B82F6')}>🏥 Hospitales</button>
            {OWM_LAYERS.map(l => (
              <button key={l.id} onClick={() => setOwmLayer(owmLayer === l.id ? null : l.id)} style={btnS(owmLayer === l.id, '#0EA5E9')}>
                {l.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {ESTILOS.map(e => (
              <button key={e.id} onClick={() => changeStyle(e)} style={btnS(estiloActual === e.id, '#E8231A')}>{e.label}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
