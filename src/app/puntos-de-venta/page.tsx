import { createClient } from '@/lib/supabase/server';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { PuntoDeVenta } from '@/components/MapaPuntosDeVenta';

const MapaCliente = dynamic(() => import('@/components/MapaPuntosDeVenta'), { 
  ssr: false,
  loading: () => <div style={{ height: '100%', width: '100%', backgroundColor: '#1A1A18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9E9A95' }}>Cargando mapa...</div>
});

export const metadata = {
  title: 'Puntos de Venta | RescueChip',
  description: 'Encuentra los puntos de venta autorizados de RescueChip cerca de ti.',
};

export default async function PuntosDeVentaPage() {
  const supabase = await createClient();
  
  const { data: puntosData } = await supabase
    .from('puntos_de_venta')
    .select('*')
    .eq('activo', true);

  const puntos: PuntoDeVenta[] = puntosData || [];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0D0D0C', color: '#F4F0EB', fontFamily: "'Inter', -apple-system, sans-serif", display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <header style={{ padding: '40px 20px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '36px', fontWeight: 700, margin: '0 0 8px 0', color: '#FFFFFF' }}>
          Puntos de venta
        </h1>
        <p style={{ color: '#9E9A95', fontSize: '18px', margin: 0 }}>
          Encuentra RescueChip cerca de ti
        </p>
      </header>

      {/* Mapa (Ancho 100%, Alto responsive) */}
      <section style={{ width: '100%', height: '50vh', minHeight: '300px', maxHeight: '500px', position: 'relative', zIndex: 1 }}>
        <MapaCliente puntos={puntos} />
      </section>

      {/* Grid de Tiendas */}
      <main style={{ flex: 1, padding: '40px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {puntos.map((punto) => (
            <article key={punto.id} style={{ backgroundColor: '#1A1A18', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
              
              {/* Imagen */}
              <div style={{ position: 'relative', height: '220px', width: '100%' }}>
                <Image 
                  src={punto.foto_url || '/tiendas/placeholder.jpg'} 
                  alt={punto.nombre}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>

              {/* Contenido Card */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3 style={{ margin: '0', fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>{punto.nombre}</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#888888', lineHeight: 1.4 }}>{punto.direccion}</p>
                
                {punto.horario && (
                  <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#888888', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🕒 {punto.horario}
                  </p>
                )}

                <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {punto.telefono && (
                    <a 
                      href={`tel:${punto.telefono}`} 
                      style={{ flex: 1, textAlign: 'center', backgroundColor: '#1A1A18', border: '1px solid #333333', color: '#FFFFFF', padding: '10px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 600, transition: 'background-color 0.2s' }}
                    >
                      Llamar
                    </a>
                  )}
                  <a 
                    href={`https://maps.google.com/?q=${punto.lat},${punto.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ flex: 1, textAlign: 'center', backgroundColor: '#E8231A', color: '#FFFFFF', padding: '10px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 600, transition: 'background-color 0.2s', border: '1px solid transparent' }}
                  >
                    Ver en Google Maps
                  </a>
                </div>
              </div>

            </article>
          ))}
          
          {puntos.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: '#9E9A95' }}>
              <p>No se encontraron puntos de venta activos en este momento.</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: '32px 20px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ color: '#888888', fontSize: '14px', margin: 0 }}>
          ¿Quieres ser punto de venta? Escríbenos a <a href="mailto:contacto@rescue-chip.com" style={{ color: '#E8231A', textDecoration: 'none' }}>contacto@rescue-chip.com</a>
        </p>
      </footer>

    </div>
  );
}
