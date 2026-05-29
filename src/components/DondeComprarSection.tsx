"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import dynamic from "next/dynamic";
const MapaPuntosDeVenta = dynamic(() => import("./MapaPuntosDeVenta"), {
  ssr: false,
  loading: () => (
    <div style={{ width: "100%", height: "400px", background: "#1A1A18", display: "flex", alignItems: "center", justifyContent: "center", color: "#9E9A95", borderRadius: "12px" }}>
      Cargando mapa...
    </div>
  ),
});
import { MapPin, Phone, Clock } from "lucide-react";

interface PuntoDeVenta {
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

export default function DondeComprarSection() {
  const [puntos, setPuntos] = useState<PuntoDeVenta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPuntos = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("puntos_de_venta")
          .select("*")
          .eq("activo", true);
        
        if (error) throw error;
        setPuntos(data || []);
      } catch (err) {
        console.error("Error fetching puntos de venta:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPuntos();
  }, []);

  return (
    <section className="donde-comprar" id="donde-comprar" style={{ padding: '80px 60px', backgroundColor: '#0D0D0C', borderTop: '1px solid rgba(244,240,235,0.08)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 'clamp(36px,5vw,60px)', lineHeight: 1, letterSpacing: '1px', marginBottom: '16px', color: '#F4F0EB', textAlign: 'center' }}>
          Ya disponible en los siguientes puntos de venta
        </h2>
        <p style={{ fontSize: '16px', color: '#9E9A95', marginBottom: '48px', textAlign: 'center' }}>
          Llévalo hoy mismo, sin esperar envío
        </p>

        {loading ? (
          <div style={{ color: '#9E9A95', padding: '40px' }}>Cargando tiendas...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', width: '100%', marginBottom: '48px' }}>
            {puntos.map(punto => (
              <div key={punto.id} style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#1A1A18', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(244,240,235,0.08)' }}>
                {punto.foto_url && (
                  <div style={{ width: '100%', height: '200px', backgroundImage: `url(${punto.foto_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                )}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#F4F0EB', margin: 0 }}>{punto.nombre}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: '#9E9A95', fontSize: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <MapPin size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#E8231A' }} />
                      <span>{punto.direccion}, {punto.ciudad}</span>
                    </div>
                    {punto.horario && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={16} style={{ flexShrink: 0, color: '#E8231A' }} />
                        <span>{punto.horario}</span>
                      </div>
                    )}
                    {punto.telefono && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Phone size={16} style={{ flexShrink: 0, color: '#E8231A' }} />
                        <span>{punto.telefono}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', gap: '8px' }}>
                    <a 
                      href={`https://maps.google.com/?q=${punto.lat},${punto.lng}`} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        backgroundColor: '#E8231A', 
                        color: 'white', 
                        padding: '12px', 
                        borderRadius: '6px', 
                        fontSize: '13px', 
                        textDecoration: 'none', 
                        fontWeight: 600,
                        textAlign: 'center',
                        flex: 1,
                        transition: 'background 0.2s'
                      }}
                    >
                      <MapPin size={16} /> Ver en Google Maps
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ width: '100%', height: '420px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(244,240,235,0.08)' }}>
          <MapaPuntosDeVenta puntos={puntos} />
        </div>
      </div>
      <style>{`
        @media(max-width: 900px) {
          #donde-comprar {
            padding: 80px 24px !important;
          }
        }
        @media(max-width: 480px) {
          #donde-comprar {
            padding: 52px 16px !important;
          }
        }
      `}</style>
    </section>
  );
}
