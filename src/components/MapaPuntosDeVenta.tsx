"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-gesture-handling/dist/leaflet-gesture-handling.css';
import { GestureHandling } from 'leaflet-gesture-handling';

export interface PuntoDeVenta {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  lat: number;
  lng: number;
  telefono: string | null;
  horario: string | null;
  foto_url: string | null;
  activo: boolean;
}

// Fix para los íconos por defecto de Leaflet en Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '',
  iconUrl: '',
  shadowUrl: '',
});

L.Map.addInitHook('addHandler', 'gestureHandling', GestureHandling);

const customMarkerIcon = L.divIcon({
  html: '<div style="background:#E8231A;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.5);"></div>',
  className: 'custom-marker',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function MapaPuntosDeVenta({ puntos }: { puntos: PuntoDeVenta[] }) {
  useEffect(() => {
    // Necesario para forzar actualización de tamaño cuando el contenedor padre cambie (ej. rotación de pantalla)
    const handleResize = () => {
      window.dispatchEvent(new Event('resize'));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <MapContainer 
      center={[19.35, -99.13]} 
      zoom={11} 
      style={{ height: '100%', width: '100%', zIndex: 1 }}
      gestureHandling={true}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      
      {puntos.map((punto) => (
        <Marker key={punto.id} position={[punto.lat, punto.lng]} icon={customMarkerIcon}>
          <Popup>
            <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <strong style={{ fontSize: '14px', color: '#131311', display: 'block', marginBottom: '2px' }}>{punto.nombre}</strong>
              <span style={{ fontSize: '12px', color: '#666', display: 'block' }}>{punto.direccion}</span>
              <a 
                href={`https://maps.google.com/?q=${punto.lat},${punto.lng}`} 
                target="_blank" 
                rel="noreferrer"
                style={{ 
                  display: 'inline-block', 
                  backgroundColor: '#E8231A', 
                  color: 'white', 
                  padding: '6px 12px', 
                  borderRadius: '6px', 
                  fontSize: '12px', 
                  textDecoration: 'none', 
                  fontWeight: 600,
                  textAlign: 'center',
                  marginTop: '4px'
                }}
              >
                Ver en Google Maps
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
