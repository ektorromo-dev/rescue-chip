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

const LS_KEY         = 'rc_mapa_estilo'
const getEstiloGuardado = (): string => localStorage.getItem(LS_KEY) ?? 'dark-v11'
const getEstiloUrl   = (id: string): string =>
  ESTILOS.find(e => e.id === id)?.url ?? ESTILOS[0].url

// ─── WEATHER ─────────────────────────────────────────────────────────────────
interface WMOEntry { label: string; emoji: string; alerta: string | null }
const WMO: Record<number, WMOEntry> = {
  0:  { label: 'Despejado',        emoji: '☀️',  alerta: null },
  1:  { label: 'Casi despejado',   emoji: '🌤️', alerta: null },
  2:  { label: 'Parcial. nublado', emoji: '⛅',  alerta: null },
  3:  { label: 'Nublado',          emoji: '☁️',  alerta: null },
  45: { label: 'Neblina',          emoji: '🌫️',  alerta: '⚠️ Neblina — visibilidad muy reducida' },
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

interface WeatherData {
  temp: number; wind: number; code: number
  forecast: Array<{ date: string; maxTemp: number; minTemp: number; code: number }>
}

async function fetchWeather(lat: number, lng: number): Promise<WeatherData | null> {
  try {
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
      `&current=temperature_2m,wind_speed_10m,weather_code` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
      `&timezone=auto&forecast_days=6`
    )
    const d = await r.json()
    const c = d.current
    const daily = d.daily
    const forecast = (daily?.time ?? []).slice(1, 6).map((date: string, i: number) => ({
      date,
      maxTemp: Math.round(daily.temperature_2m_max[i + 1]),
      minTemp: Math.round(daily.temperature_2m_min[i + 1]),
      code: daily.weather_code[i + 1],
    }))
    return { temp: Math.round(c.temperature_2m), wind: Math.round(c.wind_speed_10m), code: c.weather_code, forecast }
  } catch { return null }
}

// ─── ROUTING ─────────────────────────────────────────────────────────────────
async function fetchRoute(sLng: number, sLat: number, eLng: number, eLat: number) {
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/` +
      `${sLng.toFixed(5)},${sLat.toFixed(5)};${eLng.toFixed(5)},${eLat.toFixed(5)}` +
      `?geometries=geojson&access_token=${MAPBOX_TOKEN}&language=es`
    const r = await fetch(url)
    const d = await r.json()
    return d.routes?.[0] ?? null
  } catch { return null }
}

function drawRoute(map: any, geometry: any) {
  if (!map) return
  if (map.getLayer('rc-route')) map.removeLayer('rc-route')
  if (map.getSource('rc-route')) map.removeSource('rc-route')
  map.addSource('rc-route', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry } })
  map.addLayer({
    id: 'rc-route', type: 'line', source: 'rc-route',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#E8231A', 'line-width': 4, 'line-opacity': 0.85 },
  })
}

function clearRoute(map: any) {
  if (!map) return
  if (map.getLayer('rc-route')) map.removeLayer('rc-route')
  if (map.getSource('rc-route')) map.removeSource('rc-route')
}

// ─── OWM OVERLAY ─────────────────────────────────────────────────────────────
function applyOWMLayer(map: any, layer: string | null) {
  if (!map) return
  if (map.getLayer('owm-layer')) map.removeLayer('owm-layer')
  if (map.getSource('owm-source')) map.removeSource('owm-source')
  if (!layer || !OWM_TOKEN) return
  map.addSource('owm-source', {
    type: 'raster',
    tiles: [`https://tile.openweathermap.org/map/${layer}/{z}/{x}/{y}.png?appid=${OWM_TOKEN}`],
    tileSize: 256,
    attribution: '© OpenWeatherMap',
  })
  map.addLayer({ id: 'owm-layer', type: 'raster', source: 'owm-source', paint: { 'raster-opacity': 0.5 } })
}

// ─── POIs ─────────────────────────────────────────────────────────────────────
interface BBox { south: number; west: number; north: number; east: number }

async function fetchPOIsOverpass(tipo: 'fuel' | 'hospital', bbox: BBox): Promise<any[]> {
  const { south, west, north, east } = bbox
  const [s, w, n, e] = [south, west, north, east].map(v => v.toFixed(4))
  const filter = tipo === 'fuel' ? '["amenity"="fuel"]' : '["amenity"~"^(hospital|clinic)$"]'
  const query = `[out:json][timeout:20];(node${filter}(${s},${w},${n},${e});way${filter}(${s},${w},${n},${e}););out body center 40;`
  try {
    const r = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST', body: query, headers: { 'Content-Type': 'text/plain' },
    })
    return (await r.json()).elements ?? []
  } catch { return [] }
}

const PUBLIC_OPS = ['IMSS', 'ISSSTE', 'SSA', 'SECTOR SALUD', 'PEMEX', 'SEDENA', 'SEMAR',
                    'BIENESTAR', 'INSABI', 'ISSEMYM', 'ISEM', 'IMSS-BIENESTAR', 'GOBIERNO']

function getGasInfo(tags: any) {
  const brand = (tags.brand || '').trim()
  const op    = (tags.operator || '').trim()
  const name  = (tags.name || '').trim()
  const title = brand || op || name || 'Gasolinera'
  const subtitle = name && name.toUpperCase() !== title.toUpperCase() ? name : ''
  return { title, subtitle }
}

function getHospInfo(tags: any) {
  const name    = (tags.name || tags['name:es'] || '').trim()
  const op      = (tags.operator || '').trim()
  const opType  = (tags['operator:type'] || '').toLowerCase()
  const title   = name || op || 'Hospital'
  const isPublic = PUBLIC_OPS.some(p => op.toUpperCase().includes(p))
  const isPrivate = opType === 'private' || (!isPublic && op.length > 0)
  let subtitle = ''
  if (op)           subtitle = isPublic ? `Público · ${op}` : isPrivate ? `Privado · ${op}` : op
  else if (opType === 'public')   subtitle = 'Público'
  else if (opType === 'private')  subtitle = 'Privado'
  else subtitle = tags.amenity === 'hospital' ? 'Hospital' : 'Clínica'
  return { title, subtitle }
}

function buildPopupHTML(
  title: string, subtitle: string,
  route: { distKm: string; timeMin: number; navUrl: string } | 'loading' | null
) {
  const routeHtml = route === 'loading'
    ? `<p style="margin:6px 0 0;color:#999;font-size:11px">📍 Calculando ruta...</p>`
    : route
    ? `<div style="margin:7px 0 0;padding:6px 0 0;border-top:1px solid #eee">
         <span style="font-size:12px;color:#333;font-weight:600">📍 ${route.distKm} km · ~${route.timeMin} min</span><br/>
         <a href="${route.navUrl}" target="_blank" rel="noopener"
            style="display:inline-block;margin-top:6px;padding:5px 12px;background:#4285F4;color:#fff;border-radius:4px;font-size:11px;text-decoration:none;font-weight:600">
           Abrir en Maps →
         </a>
       </div>`
    : ''
  return `<div style="font-family:sans-serif;font-size:13px;color:#111;padding:2px;min-width:150px;max-width:230px">
    <strong style="font-size:14px">${title}</strong>
    ${subtitle ? `<p style="margin:3px 0 4px;color:#555;font-size:12px">${subtitle}</p>` : ''}
    ${routeHtml}
  </div>`
}

// ─── MAP UTILS ────────────────────────────────────────────────────────────────
function clearMarkers(ref: React.MutableRefObject<any[]>) {
  ref.current.forEach(m => m.remove()); ref.current = []
}
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

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Punto { id: string; tipo: string; latitud: number; longitud: number; fuente: 'reporte' | 'emergencia'; descripcion?: string }
interface Props  { puntos?: Punto[]; interactive?: boolean; height?: string; fullscreen?: boolean }

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function MapaRescueChip({ puntos = [], interactive = true, height = '500px', fullscreen = false }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<any>(null)
  const mboxRef      = useRef<any>(null)
  const markersRef   = useRef<any[]>([])
  const gasMkrs      = useRef<any[]>([])
  const hospMkrs     = useRef<any[]>([])
  const puntosRef    = useRef<Punto[]>(puntos)
  const showGasRef   = useRef(false)
  const showHospRef  = useRef(false)
  const owmLayerRef  = useRef<string | null>(null)
  const prevViewRef  = useRef<{ center: [number, number]; zoom: number } | null>(null)

  const [estiloActual,    setEstiloActual]    = useState<string>(getEstiloGuardado)
  const [showGas,         setShowGas]         = useState(false)
  const [showHosp,        setShowHosp]        = useState(false)
  const [showStylePicker, setShowStylePicker] = useState(false)
  const [owmLayer,        setOwmLayer]        = useState<string | null>(null)
  const [weather,         setWeather]         = useState<WeatherData | null>(null)
  const [showForecast,    setShowForecast]    = useState(false)
  const [poiMsg,          setPoiMsg]          = useState('')

  useEffect(() => { puntosRef.current  = puntos  }, [puntos])
  useEffect(() => { showGasRef.current  = showGas  }, [showGas])
  useEffect(() => { showHospRef.current = showHosp }, [showHosp])

  // Apply OWM when state changes
  useEffect(() => {
    owmLayerRef.current = owmLayer
    if (mapRef.current?.isStyleLoaded()) applyOWMLayer(mapRef.current, owmLayer)
  }, [owmLayer])

  // Auto-center on location when entering fullscreen
  useEffect(() => {
    if (!fullscreen || !mapRef.current) return
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => mapRef.current?.flyTo({ center: [coords.longitude, coords.latitude], zoom: 14, duration: 1500 }),
      undefined,
      { timeout: 5000 }
    )
  }, [fullscreen])

  // ── Stable: incident markers ──────────────────────────────────────────────
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

  // ── Stable: POI markers with route ───────────────────────────────────────
  const addPOIMarkers = useCallback((
    elements: any[], tipo: 'gasolinera' | 'hospital', ref: React.MutableRefObject<any[]>
  ) => {
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
      const color = tipo === 'gasolinera' ? '#FFD700' : '#3B82F6'

      const div = document.createElement('div')
      div.style.cssText = `width:30px;height:30px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:15px;cursor:pointer;`
      div.textContent = emoji

      const popup = new mapboxgl.Popup({ offset: 14, closeButton: true, maxWidth: '240px' })
        .setHTML(buildPopupHTML(title, subtitle, null))

      popup.on('close', () => clearRoute(mapRef.current))

      div.addEventListener('click', () => {
        popup.setHTML(buildPopupHTML(title, subtitle, 'loading'))
        navigator.geolocation.getCurrentPosition(
          async ({ coords }) => {
            const route = await fetchRoute(coords.longitude, coords.latitude, lng, lat)
            if (route && mapRef.current) {
              drawRoute(mapRef.current, route.geometry)
              const distKm = (route.distance / 1000).toFixed(1)
              const timeMin = Math.round(route.duration / 60)
              const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
              if (popup.isOpen()) popup.setHTML(buildPopupHTML(title, subtitle, { distKm, timeMin, navUrl }))
            } else {
              if (popup.isOpen()) popup.setHTML(buildPopupHTML(title, subtitle, null))
            }
          },
          () => { if (popup.isOpen()) popup.setHTML(buildPopupHTML(title, subtitle, null)) },
          { timeout: 5000 }
        )
      })

      const marker = new mapboxgl.Marker({ element: div }).setLngLat([lng, lat]).setPopup(popup).addTo(mapRef.current)
      ref.current.push(marker)
    })
  }, [])

  // ── Map init — deps include fullscreen to fix cooperativeGestures ─────────
  useEffect(() => {
    let cancelled = false
    let moveTimer: ReturnType<typeof setTimeout> | null = null

    const init = async () => {
      await loadMapboxScript()
      if (cancelled || !mapContainer.current) return
      const mapboxgl = (window as any).mapboxgl
      mboxRef.current = mapboxgl
      mapboxgl.accessToken = MAPBOX_TOKEN

      const saved = prevViewRef.current; prevViewRef.current = null

      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: getEstiloUrl(getEstiloGuardado()),
        center: saved?.center ?? [-99.1332, 19.4326],
        zoom: saved?.zoom ?? 5,
        interactive,
        cooperativeGestures: interactive && !fullscreen, // ← KEY: two-finger only in non-fullscreen
        language: 'es',
        locale: {
          'TouchPanBlocker.Message': 'Usa dos dedos para mover el mapa',
          'ScrollZoomBlocker.CtrlMessage': 'Mantén Ctrl y haz scroll para hacer zoom',
          'ScrollZoomBlocker.CmdMessage': 'Mantén ⌘ y haz scroll para hacer zoom',
        },
      })

      if (interactive) {
        if (!fullscreen) mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
        mapRef.current.addControl(
          new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }),
          fullscreen ? 'bottom-right' : 'top-right'
        )

        // Initial weather
        navigator.geolocation?.getCurrentPosition(
          async ({ coords }) => { const w = await fetchWeather(coords.latitude, coords.longitude); if (!cancelled) setWeather(w) },
          async () => { const c = mapRef.current?.getCenter(); if (c) { const w = await fetchWeather(c.lat, c.lng); if (!cancelled) setWeather(w) } },
          { timeout: 5000 }
        )

        mapRef.current.on('moveend', () => {
          if (moveTimer) clearTimeout(moveTimer)
          moveTimer = setTimeout(async () => {
            const c = mapRef.current?.getCenter()
            if (!c || cancelled) return
            const w = await fetchWeather(c.lat, c.lng)
            if (!cancelled) setWeather(w)
            const bounds = mapRef.current?.getBounds()
            if (!bounds) return
            const bbox: BBox = { south: bounds.getSouth(), west: bounds.getWest(), north: bounds.getNorth(), east: bounds.getEast() }
            if (showGasRef.current) { const els = await fetchPOIsOverpass('fuel', bbox); if (!cancelled) addPOIMarkers(els, 'gasolinera', gasMkrs) }
            if (showHospRef.current) { const els = await fetchPOIsOverpass('hospital', bbox); if (!cancelled) addPOIMarkers(els, 'hospital', hospMkrs) }
          }, 1200)
        })
      }

      const onLoad = () => {
        addMarkers()
        if (owmLayerRef.current) applyOWMLayer(mapRef.current, owmLayerRef.current)
      }
      mapRef.current.on('load', onLoad)
      mapRef.current.on('style.load', onLoad)
    }

    init()
    return () => {
      cancelled = true
      if (moveTimer) clearTimeout(moveTimer)
      if (mapRef.current) {
        const c = mapRef.current.getCenter()
        prevViewRef.current = { center: [c.lng, c.lat], zoom: mapRef.current.getZoom() }
      }
      clearMarkers(markersRef); clearMarkers(gasMkrs); clearMarkers(hospMkrs)
      mapRef.current?.remove(); mapRef.current = null; mboxRef.current = null
    }
  }, [interactive, fullscreen, addMarkers, addPOIMarkers]) // fullscreen en deps

  useEffect(() => { if (mapRef.current?.isStyleLoaded()) addMarkers() }, [puntos, addMarkers])

  // ── POI toggles ──────────────────────────────────────────────────────────
  const checkZoom = useCallback((tipo: string): boolean => {
    if ((mapRef.current?.getZoom() ?? 0) < 10) {
      setPoiMsg(`Acércate más para ver ${tipo}`)
      setTimeout(() => setPoiMsg(''), 3000)
      return false
    }
    return true
  }, [])

  const getBBox = useCallback((): BBox | null => {
    const b = mapRef.current?.getBounds()
    return b ? { south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() } : null
  }, [])

  const toggleGas = useCallback(async () => {
    const next = !showGasRef.current
    setShowGas(next)
    if (!next) { clearMarkers(gasMkrs); return }
    if (!checkZoom('gasolineras')) { setShowGas(false); return }
    const bbox = getBBox(); if (!bbox) return
    addPOIMarkers(await fetchPOIsOverpass('fuel', bbox), 'gasolinera', gasMkrs)
  }, [addPOIMarkers, checkZoom, getBBox])

  const toggleHosp = useCallback(async () => {
    const next = !showHospRef.current
    setShowHosp(next)
    if (!next) { clearMarkers(hospMkrs); return }
    if (!checkZoom('hospitales')) { setShowHosp(false); return }
    const bbox = getBBox(); if (!bbox) return
    addPOIMarkers(await fetchPOIsOverpass('hospital', bbox), 'hospital', hospMkrs)
  }, [addPOIMarkers, checkZoom, getBBox])

  const changeStyle = (id: string, url: string) => {
    setEstiloActual(id); localStorage.setItem(LS_KEY, id)
    mapRef.current?.setStyle(url); setShowStylePicker(false)
  }

  const wmo      = weather ? getWMO(weather.code) : null
  const alertMsg = (weather?.wind ?? 0) >= 50 ? `⚠️ Viento fuerte — ${weather!.wind} km/h` : wmo?.alerta ?? null

  const btn = (active: boolean, bg: string, tc = '#F4F0EB'): React.CSSProperties => ({
    padding: '6px 11px', borderRadius: '6px', border: 'none',
    background: active ? bg : 'rgba(10,10,8,0.76)',
    color: active ? tc : '#F4F0EB', fontSize: '12px',
    cursor: 'pointer', fontWeight: active ? 700 : 400,
    backdropFilter: 'blur(10px)', whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  })

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* ── Weather card ──────────────────────────────────────────────── */}
      {interactive && weather && wmo && (
        <div onClick={() => setShowForecast(f => !f)} style={{
          position: 'absolute',
          top: fullscreen ? '108px' : '10px',
          left: '10px', zIndex: 1,
          background: 'rgba(10,10,8,0.86)',
          border: `1px solid ${alertMsg ? 'rgba(232,35,26,0.6)' : 'rgba(244,240,235,0.12)'}`,
          borderRadius: '8px', padding: '8px 12px',
          color: '#F4F0EB', backdropFilter: 'blur(10px)',
          minWidth: '150px', cursor: 'pointer',
        }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '3px' }}>{wmo.emoji} {wmo.label}</div>
          <div style={{ fontSize: '12px', color: '#bbb', display: 'flex', gap: '10px' }}>
            <span>🌡️ {weather.temp}°C</span><span>💨 {weather.wind} km/h</span>
          </div>
          {alertMsg && <div style={{ marginTop: '5px', fontSize: '11px', color: '#E8231A', fontWeight: 700 }}>{alertMsg}</div>}
          {showForecast && weather.forecast.length > 0 && (
            <div style={{ marginTop: '8px', borderTop: '1px solid rgba(244,240,235,0.1)', paddingTop: '8px' }}>
              <div style={{ fontSize: '10px', color: '#888', marginBottom: '5px', letterSpacing: '1px', textTransform: 'uppercase' as const }}>
                Pronóstico 5 días
              </div>
              {weather.forecast.map(day => {
                const d = new Date(day.date + 'T12:00:00')
                const wd = getWMO(day.code)
                return (
                  <div key={day.date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', padding: '2px 0' }}>
                    <span style={{ color: '#aaa', minWidth: '30px' }}>{d.toLocaleDateString('es-MX', { weekday: 'short' })}</span>
                    <span>{wd.emoji}</span>
                    <span style={{ color: '#F4F0EB' }}>{day.maxTemp}° <span style={{ color: '#666' }}>{day.minTemp}°</span></span>
                  </div>
                )
              })}
            </div>
          )}
          <div style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>{showForecast ? '▲ Ocultar' : '▼ Pronóstico 5 días'}</div>
        </div>
      )}

      {/* ── POI message ─────────────────────────────────────────────────── */}
      {poiMsg && (
        <div style={{
          position: 'absolute', top: fullscreen ? '164px' : 'auto', bottom: fullscreen ? 'auto' : '100px',
          left: '10px', zIndex: 2,
          background: 'rgba(10,10,8,0.9)', color: '#F4F0EB',
          padding: '6px 12px', borderRadius: '6px', fontSize: '12px',
          border: '1px solid rgba(244,240,235,0.15)',
        }}>
          {poiMsg}
        </div>
      )}

      {/* ── FULLSCREEN: top horizontal bar ───────────────────────────────── */}
      {interactive && fullscreen && (
        <>
          <div style={{
            position: 'absolute', top: '60px', left: '8px', right: '55px', zIndex: 1,
            display: 'flex', gap: '5px', overflowX: 'auto',
            // Hide scrollbar
            msOverflowStyle: 'none' as any,
            scrollbarWidth: 'none' as any,
          }}>
            <button onClick={toggleGas}  style={btn(showGas,  '#FFD700', '#111')}>⛽ Gasolineras</button>
            <button onClick={toggleHosp} style={btn(showHosp, '#3B82F6')}       >🏥 Hospitales</button>
            {OWM_LAYERS.map(l => (
              <button key={l.id} onClick={() => setOwmLayer(owmLayer === l.id ? null : l.id)} style={btn(owmLayer === l.id, '#0EA5E9')}>
                {l.label}
              </button>
            ))}
            <button onClick={() => setShowStylePicker(p => !p)} style={btn(showStylePicker, '#E8231A')}>⊞ Vista</button>
          </div>

          {showStylePicker && (
            <div style={{
              position: 'absolute', top: '100px', right: '8px', zIndex: 3,
              background: 'rgba(10,10,8,0.94)', borderRadius: '8px',
              padding: '6px', display: 'flex', flexDirection: 'column', gap: '3px',
              border: '1px solid rgba(244,240,235,0.15)', backdropFilter: 'blur(12px)',
            }}>
              {ESTILOS.map(e => (
                <button key={e.id} onClick={() => changeStyle(e.id, e.url)} style={{
                  ...btn(estiloActual === e.id, '#E8231A'),
                  textAlign: 'left' as const, padding: '7px 14px',
                  background: estiloActual === e.id ? '#E8231A' : 'transparent',
                }}>
                  {e.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── NON-FULLSCREEN: bottom-left controls ──────────────────────────── */}
      {interactive && !fullscreen && (
        <div style={{
          position: 'absolute', bottom: '28px', left: '10px', zIndex: 1,
          display: 'flex', flexDirection: 'column', gap: '5px',
          maxWidth: 'calc(100% - 60px)',
        }}>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' as const }}>
            <button onClick={toggleGas}  style={btn(showGas,  '#FFD700', '#111')}>⛽ Gasolineras</button>
            <button onClick={toggleHosp} style={btn(showHosp, '#3B82F6')}       >🏥 Hospitales</button>
            {OWM_LAYERS.map(l => (
              <button key={l.id} onClick={() => setOwmLayer(owmLayer === l.id ? null : l.id)} style={btn(owmLayer === l.id, '#0EA5E9')}>
                {l.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' as const }}>
            {ESTILOS.map(e => (
              <button key={e.id} onClick={() => changeStyle(e.id, e.url)} style={btn(estiloActual === e.id, '#E8231A')}>
                {e.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
