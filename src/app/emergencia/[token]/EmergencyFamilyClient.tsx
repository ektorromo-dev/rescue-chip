'use client';

import { useEffect, useRef, useState } from 'react';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
const MAPBOX_JS = 'https://api.mapbox.com/mapbox-gl-js/v3.23.1/mapbox-gl.js';
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

function formatTimeSince(isoString: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return `hace ${seconds} segundos`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} minuto${minutes === 1 ? '' : 's'}`;
  const hours = Math.floor(minutes / 60);
  return `hace ${hours} hora${hours === 1 ? '' : 's'}`;
}

interface IncidenteData {
  token: string;
  chipFolio: string;
  latitud: number | null;
  longitud: number | null;
  locationShared: boolean;
  createdAt: string;
  expiresAt: string;
  familiarEnCamino: boolean;
}

interface ProfileData {
  fullName: string;
  bloodType: string | null;
  medicalConditions: string | null;
  importantMedications: string | null;
  allergies: string | null;
  sexo: string | null;
  age: string | null;
  city: string | null;
}

interface Props {
  incidente: IncidenteData;
  profile: ProfileData | null;
  isDemo?: boolean;
}

export default function EmergencyFamilyClient({ incidente, profile, isDemo = false }: Props) {
  const [enCamino, setEnCamino] = useState(incidente.familiarEnCamino);
  const [sending, setSending] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [liveLocation, setLiveLocation] = useState<{
    latitude: number;
    longitude: number;
    tripActive: boolean;
    updatedAt: string;
  } | null>(null);
  const [tick, setTick] = useState(0);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const effectiveLat = liveLocation?.latitude ?? incidente.latitud;
  const effectiveLng = liveLocation?.longitude ?? incidente.longitud;
  const mapsUrl = effectiveLat && effectiveLng
    ? `https://www.google.com/maps?q=${effectiveLat},${effectiveLng}`
    : null;
  const wazeUrl = effectiveLat && effectiveLng
    ? `https://waze.com/ul?ll=${effectiveLat},${effectiveLng}&navigate=yes`
    : null;
  const coordsText = effectiveLat && effectiveLng
    ? `${effectiveLat.toFixed(6)}, ${effectiveLng.toFixed(6)}`
    : null;

  useEffect(() => {
    if (isDemo) return;

    let cancelled = false;

    const fetchLocation = async () => {
      try {
        const res = await fetch(`/api/emergencia/${incidente.token}/ubicacion`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.available) {
          setLiveLocation({
            latitude: data.latitude,
            longitude: data.longitude,
            tripActive: data.tripActive,
            updatedAt: data.updatedAt,
          });
        }
      } catch (err) {
        console.error('Error consultando ubicación en vivo:', err);
      }
    };

    fetchLocation();
    const interval = setInterval(fetchLocation, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [incidente.token, isDemo]);

  useEffect(() => {
    const displayLat = liveLocation?.latitude ?? effectiveLat;
    const displayLng = liveLocation?.longitude ?? effectiveLng;
    if (!displayLat || !displayLng || !mapContainerRef.current) return;

    let cancelled = false;

    const initOrUpdateMap = async () => {
      await loadMapbox();
      if (cancelled || !mapContainerRef.current) return;
      const mapboxgl = (window as any).mapboxgl;
      mapboxgl.accessToken = MAPBOX_TOKEN;

      if (!mapRef.current) {
        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [displayLng, displayLat],
          zoom: 15,
          interactive: true,
          cooperativeGestures: true,
          locale: {
            'TouchPanBlocker.Message': 'Usa dos dedos para mover el mapa',
            'ScrollZoomBlocker.CtrlMessage': 'Mantén Ctrl y haz scroll para hacer zoom',
            'ScrollZoomBlocker.CmdMessage': 'Mantén ⌘ y haz scroll para hacer zoom',
          },
        });
        mapRef.current = map;
        map.addControl(new mapboxgl.FullscreenControl(), 'top-right');

        map.on('load', () => {
          if (cancelled) return;
          const marker = new mapboxgl.Marker({ color: '#E11D48' })
            .setLngLat([displayLng, displayLat])
            .addTo(map);
          markerRef.current = marker;
        });
      } else {
        mapRef.current.easeTo({
          center: [displayLng, displayLat],
          duration: 1000,
        });
        markerRef.current?.setLngLat([displayLng, displayLat]);
      }
    };

    initOrUpdateMap();

    return () => {
      cancelled = true;
    };
  }, [liveLocation, effectiveLat, effectiveLng]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const userName = profile?.fullName || 'Usuario RescueChip';
  const firstName = profile?.fullName?.split(' ')[0] || 'tu ser querido';
  const scanTime = new Date(incidente.createdAt).toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    dateStyle: 'short',
    timeStyle: 'short',
  });

  const handleEnCamino = async () => {
    if (isDemo) {
      setEnCamino(true);
      return;
    }
    setSending(true);
    try {
      await fetch('/api/emergencia/en-camino', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: incidente.token }),
      });
      setEnCamino(true);
    } catch (err) {
      console.error('Error:', err);
    }
    setSending(false);
  };

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#0D0D0C',
    color: '#F4F0EB',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    padding: '0',
  };

  const sectionStyle: React.CSSProperties = {
    padding: '20px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#1A1A18',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
    border: '1px solid rgba(255,255,255,0.06)',
  };

  const buttonPrimary: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '16px',
    borderRadius: '12px',
    border: 'none',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center' as const,
    textDecoration: 'none',
    marginBottom: '12px',
    boxSizing: 'border-box' as const,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#9E9A95',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '4px',
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 500,
  };

  const steps = [
    {
      time: 'Ahora',
      title: 'Respira y lee todo esto antes de actuar',
      detail: 'Tienes unos minutos antes de necesitar hacer algo. Leer estas instrucciones completas primero te ahorrará tiempo.',
    },
    {
      time: '5 min',
      title: 'Verifica la ubicación',
      detail: incidente.locationShared
        ? 'Abre el mapa arriba. Si conoces la zona, calcula cuánto tardas en llegar. Si no, busca el hospital más cercano al punto.'
        : 'No hay ubicación GPS disponible. Llama al 911 con el folio del chip y pregunta si ya hay un reporte.',
    },
    {
      time: '10 min',
      title: 'Si no tienes más información, llama al 911',
      detail: `Proporciona: nombre completo (${userName})${profile?.bloodType ? `, tipo de sangre (${profile.bloodType})` : ''}, y la ubicación del mapa si la tienes.`,
    },
    {
      time: '15 min',
      title: 'Prepara lo que vas a necesitar',
      detail: 'INE/identificación de la persona (si la tienes), tu propia INE, póliza de seguro médico si aplica, efectivo o tarjeta, y cargador de celular.',
    },
    {
      time: '30 min',
      title: 'Si vas al hospital',
      detail: 'Lleva los documentos de arriba. Al llegar, di que la persona tiene perfil médico digital en RescueChip — los paramédicos ya tienen acceso a los datos.',
    },
  ];

  const checklistItems = [
    'INE o identificación de la persona accidentada',
    'Tu propia INE (te la pedirán)',
    'Póliza de seguro médico (si existe)',
    'Efectivo o tarjeta (estacionamiento, farmacia)',
    'Cargador de celular',
    'Ropa cómoda para esperar',
  ];

  return (
    <div style={pageStyle}>
      {/* ── HEADER ROJO ── */}
      <div style={{
        backgroundColor: '#E11D48',
        padding: '20px 16px',
        textAlign: 'center' as const,
      }}>
        <div style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '1px', marginBottom: '4px', opacity: 0.9 }}>
          ⚠️ ALERTA DE EMERGENCIA
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '8px 0 4px' }}>
          El chip de {userName} fue escaneado
        </h1>
        <p style={{ fontSize: '14px', opacity: 0.85, margin: 0 }}>
          {scanTime} · Folio {incidente.chipFolio}
        </p>
      </div>

      {/* ── MENSAJE ANTI-SHOCK ── */}
      <div style={{ ...sectionStyle, backgroundColor: '#1A1A18' }}>
        <p style={{ fontSize: '16px', lineHeight: '1.6', margin: '0 0 12px', fontWeight: 500 }}>
          Mantén la calma. Si estás leyendo esto, significa que alguien ya encontró a {firstName} y está recibiendo atención.
        </p>
        <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#9E9A95', margin: 0 }}>
          Abajo encontrarás toda la información que necesitas: ubicación, datos médicos, y pasos exactos de qué hacer.
        </p>
      </div>

      {/* ── UBICACIÓN ── */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', marginTop: 0 }}>
          📍 Ubicación del escaneo
        </h2>
        {incidente.locationShared && mapsUrl ? (
          <>
            <div style={cardStyle}>
              <div style={labelStyle}>Coordenadas (para dar al 911)</div>
              <div style={{ ...valueStyle, fontFamily: 'monospace', fontSize: '14px' }}>
                {coordsText}
              </div>
            </div>
            {(liveLocation || (effectiveLat && effectiveLng)) && (
              <div style={{ marginBottom: '12px' }}>
                <div
                  ref={mapContainerRef}
                  style={{
                    width: '100%',
                    height: '220px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    marginBottom: '8px',
                  }}
                />
                <p key={tick} style={{ fontSize: '12px', color: '#9E9A95', textAlign: 'center' as const, margin: 0 }}>
                  {liveLocation
                    ? `🟢 Compartiendo ubicación en vivo — actualizado ${formatTimeSince(liveLocation.updatedAt)}`
                    : '📍 Ubicación del momento de la alerta'}
                </p>
              </div>
            )}
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
              style={{ ...buttonPrimary, backgroundColor: '#1a73e8', color: 'white' }}>
              Abrir en Google Maps
            </a>
            <a href={wazeUrl!} target="_blank" rel="noopener noreferrer"
              style={{ ...buttonPrimary, backgroundColor: '#33ccff', color: '#000' }}>
              Abrir en Waze (navegación directa)
            </a>
          </>
        ) : (
          <div style={cardStyle}>
            <p style={{ fontSize: '14px', color: '#9E9A95', margin: 0, lineHeight: '1.6' }}>
              La persona que escaneó el chip <strong style={{ color: '#F4F0EB' }}>no compartió su ubicación GPS</strong>, por lo que no podemos mostrarte el punto exacto.
            </p>
            <p style={{ fontSize: '14px', color: '#9E9A95', margin: '12px 0 0', lineHeight: '1.6' }}>
              <strong style={{ color: '#F4F0EB' }}>¿Qué puedes hacer?</strong>
            </p>
            <ul style={{ fontSize: '14px', color: '#9E9A95', margin: '8px 0 0', paddingLeft: '20px', lineHeight: '1.8' }}>
              <li>Intenta llamar o enviar mensaje a {firstName} directamente</li>
              <li>Contacta a otros familiares o amigos que puedan saber su ruta</li>
              <li>Si no logras contacto en 10 minutos, llama al 911</li>
            </ul>
          </div>
        )}
      </div>

      {/* ── DATOS MÉDICOS ── */}
      {!isDemo && profile && (
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px', marginTop: 0 }}>
            🏥 Datos médicos de {firstName}
          </h2>
          <p style={{ fontSize: '13px', color: '#9E9A95', marginBottom: '12px', marginTop: '4px' }}>
            Si llegas al hospital, confirma esta información con el personal médico.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {profile.bloodType && (
              <div style={cardStyle}>
                <div style={labelStyle}>Tipo de sangre</div>
                <div style={{ ...valueStyle, fontSize: '20px', color: '#E11D48' }}>
                  {profile.bloodType}
                </div>
              </div>
            )}
            {profile.sexo && (
              <div style={cardStyle}>
                <div style={labelStyle}>Sexo</div>
                <div style={valueStyle}>
                  {profile.sexo === 'masculino' ? 'Masculino' : profile.sexo === 'femenino' ? 'Femenino' : 'No especificado'}
                </div>
              </div>
            )}
            {profile.age && (
              <div style={cardStyle}>
                <div style={labelStyle}>Edad</div>
                <div style={valueStyle}>{profile.age} años</div>
              </div>
            )}
            {profile.city && (
              <div style={cardStyle}>
                <div style={labelStyle}>Ciudad</div>
                <div style={valueStyle}>{profile.city}</div>
              </div>
            )}
          </div>
          {profile.allergies && (
            <div style={{ ...cardStyle, borderColor: '#E11D48', borderWidth: '1px', borderStyle: 'solid' }}>
              <div style={{ ...labelStyle, color: '#E11D48' }}>⚠️ Alergias</div>
              <div style={valueStyle}>{profile.allergies}</div>
            </div>
          )}
          {profile.medicalConditions && (
            <div style={cardStyle}>
              <div style={labelStyle}>Condiciones médicas</div>
              <div style={{ fontSize: '14px' }}>{profile.medicalConditions}</div>
            </div>
          )}
          {profile.importantMedications && (
            <div style={cardStyle}>
              <div style={labelStyle}>Medicamentos</div>
              <div style={{ fontSize: '14px' }}>{profile.importantMedications}</div>
            </div>
          )}
        </div>
      )}

      {/* ── PROTOCOLO PASO A PASO ── */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', marginTop: 0 }}>
          📋 Qué hacer ahora — paso a paso
        </h2>
        {steps.map((step, i) => (
          <div key={i} style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '16px',
            alignItems: 'flex-start',
          }}>
            <div style={{
              minWidth: '52px',
              padding: '4px 8px',
              backgroundColor: i === 0 ? '#E11D48' : '#2A2A28',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              textAlign: 'center' as const,
              color: i === 0 ? 'white' : '#9E9A95',
              flexShrink: 0,
            }}>
              {step.time}
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>
                {step.title}
              </div>
              <div style={{ fontSize: '13px', color: '#9E9A95', lineHeight: '1.5' }}>
                {step.detail}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── QUÉ LLEVAR AL HOSPITAL ── */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', marginTop: 0 }}>
          🎒 Qué llevar al hospital
        </h2>
        <div style={cardStyle}>
          {checklistItems.map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 0',
              borderBottom: i < checklistItems.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              fontSize: '14px',
            }}>
              <div
                onClick={() => setCheckedItems(prev => ({ ...prev, [i]: !prev[i] }))}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  border: checkedItems[i] ? '1.5px solid #4ade80' : '1.5px solid #9E9A95',
                  backgroundColor: checkedItems[i] ? '#166534' : 'transparent',
                  flexShrink: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
              >
                {checkedItems[i] && (
                  <span style={{ color: '#4ade80', fontSize: '14px', lineHeight: 1 }}>✓</span>
                )}
              </div>
              <span style={{
                textDecoration: checkedItems[i] ? 'line-through' : 'none',
                opacity: checkedItems[i] ? 0.5 : 1,
                transition: 'all 0.2s',
              }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── BOTONES DE ACCIÓN ── */}
      <div style={{ padding: '20px 16px 40px' }}>
        <a href="tel:911"
          style={{ ...buttonPrimary, backgroundColor: '#E11D48', color: 'white', fontSize: '18px' }}>
          📞 Llamar al 911
        </a>

        {!enCamino ? (
          <button
            onClick={handleEnCamino}
            disabled={sending}
            style={{
              ...buttonPrimary,
              backgroundColor: '#166534',
              color: 'white',
              opacity: sending ? 0.6 : 1,
            }}>
            {sending ? 'Enviando...' : '✅ Ya estoy en camino'}
          </button>
        ) : (
          <div style={{
            ...cardStyle,
            textAlign: 'center' as const,
            backgroundColor: '#14532d',
            border: '1px solid #166534',
          }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#4ade80' }}>
              ✅ Registrado — los demás contactos pueden ver que alguien va en camino
            </div>
          </div>
        )}

        {mapsUrl && (
          <a href={wazeUrl!} target="_blank" rel="noopener noreferrer"
            style={{ ...buttonPrimary, backgroundColor: '#2A2A28', color: '#F4F0EB', border: '1px solid rgba(255,255,255,0.1)' }}>
            🗺️ Navegar con Waze
          </a>
        )}
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        padding: '20px 16px',
        textAlign: 'center' as const,
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        <p style={{ fontSize: '12px', color: '#9E9A95', margin: '0 0 4px' }}>
          Este enlace expira el{' '}
          {new Date(incidente.expiresAt).toLocaleString('es-MX', {
            timeZone: 'America/Mexico_City',
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </p>
        <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
          RescueChip · rescue-chip.com
        </p>
      </div>

            {/* DISCLAIMER LEGAL */}
            <div style={{ marginTop: "48px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "24px", textAlign: "center", padding: "24px 16px" }}>
                <p style={{ fontSize: "11px", color: "#6A6763", lineHeight: 1.6, maxWidth: "380px", margin: "0 auto" }}>
                    <strong style={{ color: "#9E9A95" }}>RESCUECHIP</strong> es un sistema de identificación médica. No sustituye servicios de emergencia. Llame al <strong style={{ color: "#E8231A", fontSize: "12px" }}>911</strong> ante cualquier emergencia. La información mostrada fue proporcionada por el usuario y puede no estar actualizada.{" "}
                    <a href="/terminos" style={{ color: "#9E9A95", textDecoration: "underline" }}>Términos</a>
                    {" | "}
                    <a href="/privacidad" style={{ color: "#9E9A95", textDecoration: "underline" }}>Privacidad</a>
                </p>
            </div>
    </div>
  );
}
