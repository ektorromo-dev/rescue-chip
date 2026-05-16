'use client'
import { useEffect, useRef, useCallback } from 'react'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!
const MAPBOX_JS = 'https://api.mapbox.com/mapbox-gl-js/v3.23.1/mapbox-gl.js'

const COLORES: Record<string, string> = {
  accidente: '#E8231A',
  zona_peligrosa: '#FF8C00',
  obstruccion: '#FFD700',
  desvio: '#00BFFF',
  emergencia: '#E8231A',
}

interface Punto {
  id: string
  tipo: string
  latitud: number
  longitud: number
  fuente: 'reporte' | 'emergencia'
  descripcion?: string
}

interface Props {
  puntos?: Punto[]
  interactive?: boolean
  height?: string
}

function loadMapboxScript(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).mapboxgl) { resolve(); return }
    const existing = document.getElementById('mapbox-gl-js')
    if (existing) { existing.addEventListener('load', () => resolve()); return }
    const script = document.createElement('script')
    script.id = 'mapbox-gl-js'
    script.src = MAPBOX_JS
    script.onload = () => resolve()
    document.head.appendChild(script)
  })
}

export default function MapaRescueChip({ puntos = [], interactive = true, height = '500px' }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  const updateMarkers = useCallback(() => {
    const mapboxgl = (window as any).mapboxgl
    if (!mapRef.current || !mapboxgl) return
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
    puntos.forEach(punto => {
      const el = document.createElement('div')
      el.style.cssText = `width:14px;height:14px;border-radius:50%;background:${COLORES[punto.tipo] ?? COLORES.accidente};border:2px solid white;box-shadow:0 0 8px ${COLORES[punto.tipo] ?? COLORES.accidente};cursor:pointer;`
      const popup = new mapboxgl.Popup({ offset: 12, closeButton: false })
        .setHTML(`<div style="font-family:sans-serif;font-size:13px;color:#111;padding:4px 2px"><strong style="text-transform:capitalize">${punto.tipo.replace('_', ' ')}</strong>${punto.descripcion ? `<p style="margin:4px 0 0;color:#555">${punto.descripcion}</p>` : ''}<p style="margin:4px 0 0;font-size:11px;color:#999">${punto.fuente === 'emergencia' ? '🚨 Emergencia real' : '⚠️ Reporte de rider'}</p></div>`)
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([punto.longitud, punto.latitud])
        .setPopup(popup)
        .addTo(mapRef.current)
      markersRef.current.push(marker)
    })
  }, [puntos])

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      await loadMapboxScript()
      if (cancelled || !mapContainer.current) return
      const mapboxgl = (window as any).mapboxgl
      mapboxgl.accessToken = MAPBOX_TOKEN
      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-99.1332, 19.4326],
        zoom: 5,
        interactive,
      })
      if (interactive) {
        mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
        mapRef.current.addControl(new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }), 'top-right')
      }
      mapRef.current.on('load', updateMarkers)
    }
    init()
    return () => {
      cancelled = true
      markersRef.current.forEach(m => m.remove())
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [interactive, updateMarkers])

  useEffect(() => {
    if (mapRef.current?.isStyleLoaded()) updateMarkers()
  }, [puntos, updateMarkers])

  return <div ref={mapContainer} style={{ width: '100%', height }} />
}
