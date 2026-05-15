"use client";

import dynamic from 'next/dynamic';
import { PuntoDeVenta } from './MapaPuntosDeVenta';

const MapaCliente = dynamic(() => import('./MapaPuntosDeVenta'), {
  ssr: false,
  loading: () => (
    <div style={{ 
      height: '100%', width: '100%', backgroundColor: '#1A1A18', 
      display: 'flex', alignItems: 'center', justifyContent: 'center', 
      color: '#9E9A95' 
    }}>
      Cargando mapa...
    </div>
  ),
});

export default function MapaWrapper({ puntos }: { puntos: PuntoDeVenta[] }) {
  return <MapaCliente puntos={puntos} />;
}
