"use client";
import { useEffect, useRef } from 'react';

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

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
const MAPBOX_JS  = 'https://api.mapbox.com/mapbox-gl-js/v3.23.1/mapbox-gl.js';
const MAPBOX_CSS = 'https://api.mapbox.com/mapbox-gl-js/v3.23.1/mapbox-gl.css';

function loadMapbox(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).mapboxgl) { resolve(); return; }
    if (!document.getElementById('mapbox-gl-css')) {
      const link = document.createElement('link');
      link.id = 'mapbox-gl-css'; link.rel = 'stylesheet'; link.href = MAPBOX_CSS;
      document.head.appendChild(link);
    }
    const existing = document.getElementById('mapbox-gl-js');
    if (existing) { existing.addEventListener('load', () => resolve()); return; }
    const script = document.createElement('script');
    script.id = 'mapbox-gl-js'; script.src = MAPBOX_JS;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

export default function MapaPuntosDeVenta({ puntos }: { puntos: PuntoDeVenta[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      await loadMapbox();
      if (cancelled || !containerRef.current) return;

      const mapboxgl = (window as any).mapboxgl;
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/standard',
        center: [-99.13, 19.43],
        zoom: 5,
        pitch: 45,
        bearing: -10,
        interactive: true,
        cooperativeGestures: true,
        language: 'es',
        locale: {
          'TouchPanBlocker.Message': 'Usa dos dedos para mover el mapa',
          'ScrollZoomBlocker.CtrlMessage': 'Mantén Ctrl y haz scroll para hacer zoom',
          'ScrollZoomBlocker.CmdMessage': 'Mantén ⌘ y haz scroll para hacer zoom',
        },
      });

      mapRef.current = map;

      map.on('load', () => {
        if (cancelled) return;
        try { (map as any).setConfigProperty('basemap', 'lightPreset', 'day'); } catch {}
        try { (map as any).setConfigProperty('basemap', 'show3dObjects', true); } catch {}

        puntos.forEach((punto) => {
          const el = document.createElement('div');
          el.style.cssText = [
            'width:38px', 'height:38px',
            'background:#E8231A',
            'border-radius:50% 50% 50% 0',
            'transform:rotate(-45deg)',
            'border:2.5px solid white',
            'box-shadow:0 4px 14px rgba(232,35,26,0.55)',
            'cursor:pointer',
            'display:flex', 'align-items:center', 'justify-content:center',
          ].join(';');
          const inner = document.createElement('div');
          inner.style.cssText = 'transform:rotate(45deg);color:white;font-size:10px;font-weight:900;font-family:sans-serif;letter-spacing:-0.5px;line-height:1;';
          inner.textContent = 'RC';
          el.appendChild(inner);

          const popup = new mapboxgl.Popup({ offset: 28, closeButton: true, maxWidth: '260px' })
            .setHTML(`
              <div style="font-family:sans-serif;padding:6px;min-width:200px">
                ${punto.foto_url ? `<img src="${punto.foto_url}" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-bottom:10px" />` : ''}
                <strong style="font-size:14px;color:#111;display:block;margin-bottom:4px">${punto.nombre}</strong>
                <span style="font-size:12px;color:#666;display:block;margin-bottom:3px">📍 ${punto.direccion}, ${punto.ciudad}</span>
                ${punto.horario ? `<span style="font-size:12px;color:#666;display:block;margin-bottom:3px">🕒 ${punto.horario}</span>` : ''}
                ${punto.telefono ? `<span style="font-size:12px;color:#666;display:block;margin-bottom:8px">📞 ${punto.telefono}</span>` : ''}
                <a href="https://maps.google.com/?q=${punto.lat},${punto.lng}" target="_blank" rel="noreferrer"
                  style="display:block;background:#E8231A;color:white;padding:9px;border-radius:7px;font-size:12px;text-decoration:none;font-weight:700;text-align:center">
                  Ver en Google Maps →
                </a>
              </div>
            `);

          new mapboxgl.Marker({ element: el, anchor: 'bottom-left' })
            .setLngLat([punto.lng, punto.lat])
            .setPopup(popup)
            .addTo(map);
        });

        if (puntos.length > 0) {
          const lngs = puntos.map(p => p.lng);
          const lats = puntos.map(p => p.lat);
          const pad = puntos.length === 1 ? 1.5 : 0.4;
          map.fitBounds(
            [[Math.min(...lngs) - pad, Math.min(...lats) - pad], [Math.max(...lngs) + pad, Math.max(...lats) + pad]],
            { padding: 80, duration: 1400, pitch: 45 }
          );
        }
      });
    };

    init();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [puntos]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
