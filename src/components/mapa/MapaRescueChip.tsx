'use client'
import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

interface Punto {
  id: string
  tipo: string
  latitud: number
  longitud: number
  fuente: 'reporte' | 'emergencia'
  descripcion?: string
}

interface MapaRescueChipProps {
  puntos?: Punto[]
  interactive?: boolean
  height?: string
}

const COLORES: Record<string, string> = {
  accidente: '#E8231A',
  zona_peligrosa: '#FF8C00',
  obstruccion: '#FFD700',
  desvio: '#00BFFF',
  emergencia: '#E8231A',
}

export default function MapaRescueChip({
  puntos = [],
  interactive = true,
  height = '500px',
}: MapaRescueChipProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])

  useEffect(() => {
    if (map.current || !mapContainer.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-99.1332, 19.4326],
      zoom: 5,
      interactive,
    })

    if (interactive) {
      map.current.addControl(
        new mapboxgl.NavigationControl(),
        'top-right'
      )
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
        }),
        'top-right'
      )
    }

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [interactive])

  useEffect(() => {
    if (!map.current) return

    markers.current.forEach(m => m.remove())
    markers.current = []

    puntos.forEach(punto => {
      const el = document.createElement('div')
      el.style.cssText = `
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: ${COLORES[punto.tipo] ?? COLORES.accidente};
        border: 2px solid white;
        box-shadow: 0 0 8px ${COLORES[punto.tipo] ?? COLORES.accidente};
        cursor: pointer;
      `

      const popup = new mapboxgl.Popup({ offset: 12, closeButton: false })
        .setHTML(`
          <div style="font-family:sans-serif; font-size:13px; color:#111; padding:4px 2px;">
            <strong style="text-transform:capitalize;">${punto.tipo.replace('_', ' ')}</strong>
            ${punto.descripcion ? `<p style="margin:4px 0 0; color:#555;">${punto.descripcion}</p>` : ''}
            <p style="margin:4px 0 0; font-size:11px; color:#999;">${punto.fuente === 'emergencia' ? '🚨 Emergencia real' : '⚠️ Reporte de rider'}</p>
          </div>
        `)

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([punto.longitud, punto.latitud])
        .setPopup(popup)
        .addTo(map.current!)

      markers.current.push(marker)
    })
  }, [puntos])

  return (
    <div
      ref={mapContainer}
      style={{ width: '100%', height }}
    />
  )
}
