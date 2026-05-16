'use client'
import { useState } from 'react'
import Map, {
  Marker,
  Popup,
  NavigationControl,
  GeolocateControl,
} from 'react-map-gl'

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
  const [popupInfo, setPopupInfo] = useState<Punto | null>(null)

  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{
        longitude: -99.1332,
        latitude: 19.4326,
        zoom: 5,
      }}
      style={{ width: '100%', height }}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      interactive={interactive}
    >
      {interactive && (
        <>
          <NavigationControl position="top-right" />
          <GeolocateControl
            position="top-right"
            positionOptions={{ enableHighAccuracy: true }}
            trackUserLocation
          />
        </>
      )}

      {puntos.map(punto => (
        <Marker
          key={punto.id}
          longitude={punto.longitud}
          latitude={punto.latitud}
          onClick={e => {
            e.originalEvent.stopPropagation()
            setPopupInfo(punto)
          }}
        >
          <div style={{
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: COLORES[punto.tipo] ?? COLORES.accidente,
            border: '2px solid white',
            boxShadow: `0 0 8px ${COLORES[punto.tipo] ?? COLORES.accidente}`,
            cursor: 'pointer',
          }} />
        </Marker>
      ))}

      {popupInfo && (
        <Popup
          longitude={popupInfo.longitud}
          latitude={popupInfo.latitud}
          offset={12}
          closeButton
          onClose={() => setPopupInfo(null)}
        >
          <div style={{
            fontFamily: 'sans-serif',
            fontSize: '13px',
            color: '#111',
            padding: '4px 2px',
          }}>
            <strong style={{ textTransform: 'capitalize' }}>
              {popupInfo.tipo.replace('_', ' ')}
            </strong>
            {popupInfo.descripcion && (
              <p style={{ margin: '4px 0 0', color: '#555' }}>
                {popupInfo.descripcion}
              </p>
            )}
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#999' }}>
              {popupInfo.fuente === 'emergencia'
                ? '🚨 Emergencia real'
                : '⚠️ Reporte de rider'}
            </p>
          </div>
        </Popup>
      )}
    </Map>
  )
}
