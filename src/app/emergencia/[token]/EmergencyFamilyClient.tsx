'use client';

import { useState } from 'react';

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
}

export default function EmergencyFamilyClient({ incidente, profile }: Props) {
  const [enCamino, setEnCamino] = useState(incidente.familiarEnCamino);
  const [sending, setSending] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const userName = profile?.fullName || 'Usuario RescueChip';
  const firstName = profile?.fullName?.split(' ')[0] || 'tu ser querido';
  const scanTime = new Date(incidente.createdAt).toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    dateStyle: 'short',
    timeStyle: 'short',
  });

  const mapsUrl = incidente.latitud && incidente.longitud
    ? `https://www.google.com/maps?q=${incidente.latitud},${incidente.longitud}`
    : null;

  const wazeUrl = incidente.latitud && incidente.longitud
    ? `https://waze.com/ul?ll=${incidente.latitud},${incidente.longitud}&navigate=yes`
    : null;

  const coordsText = incidente.latitud && incidente.longitud
    ? `${incidente.latitud.toFixed(6)}, ${incidente.longitud.toFixed(6)}`
    : null;

  const handleEnCamino = async () => {
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
            <p style={{ fontSize: '14px', color: '#9E9A95', margin: 0 }}>
              La persona que escaneó el chip no compartió su ubicación GPS.
              Si necesitas localizarlo, llama al 911 y proporciona el folio
              del chip: <strong>{incidente.chipFolio}</strong>
            </p>
          </div>
        )}
      </div>

      {/* ── DATOS MÉDICOS ── */}
      {profile && (
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
    </div>
  );
}
