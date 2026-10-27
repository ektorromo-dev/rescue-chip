import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import EmergencyFamilyClient from './EmergencyFamilyClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Alerta de Emergencia — RescueChip',
    description: 'Información de emergencia y pasos a seguir.',
    robots: 'noindex, nofollow',
  };
}

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function EmergenciaPage({ params }: PageProps) {
  const { token } = await params;

  // ── DEMO MODE ──
  if (token.toLowerCase() === 'demo') {
    const demoIncidente = {
      token: 'demo',
      chipFolio: 'RSC-DEMO',
      latitud: 19.4326,
      longitud: -99.1332,
      locationShared: true,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      familiarEnCamino: false,
      status: 'open',
      enCaminoPor: null,
      atendido: false,
      atendidoPor: null,
    };

    const demoProfile = {
      fullName: 'Carlos Martínez',
      bloodType: 'O+',
      medicalConditions: 'Asma leve controlada',
      importantMedications: 'Salbutamol inhalador',
      allergies: 'Penicilina, látex',
      sexo: 'masculino',
      age: '32',
      city: 'Monterrey, NL',
    };

    return (
      <EmergencyFamilyClient
        incidente={demoIncidente}
        profile={demoProfile}
        isDemo={true}
      />
    );
  }

  // Lecturas/escrituras de incidentes requieren service_role tras el cierre de RLS.
  const supabase = createAdminClient();

  // 1. Buscar incidente por token
  const { data: incidente, error } = await supabase
    .from('incidentes')
    .select('id, token, chip_folio, latitud, longitud, location_shared, created_at, expires_at, familiar_en_camino, familiar_views, profile_id, status, en_camino_por, atendido, atendido_por')
    .eq('token', token)
    .single();

  if (error || !incidente) {
    notFound();
  }

  // 2. Cargar perfil médico (para nombre del rider y datos de salud)
  let profileData = null;
  if (incidente.profile_id) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, blood_type, medical_conditions, important_medications, allergies, emergency_contacts, sexo, age, location')
      .eq('id', incidente.profile_id)
      .single();
    profileData = data;
  }

  const primerNombre = profileData?.full_name?.trim().split(/\s+/)[0] || 'El usuario';

  // 3. Si status = 'closed', mostrar pantalla verde (sin botones de 911)
  if (incidente.status === 'closed') {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0D0D0C',
        color: '#F4F0EB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '440px',
          width: '100%',
          backgroundColor: '#131311',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '16px',
          padding: '40px 24px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#4ade80', marginBottom: '12px' }}>
            ✅ {primerNombre} está bien
          </h1>
          <p style={{ fontSize: '15px', color: '#D4D0CA', lineHeight: '1.6', margin: 0 }}>
            Cerró la alerta. Ya no se comparte su ubicación.
          </p>
        </div>
      </div>
    );
  }

  // 4. Token expirado (solo si venció por 24 h y no fue cerrado)
  if (new Date(incidente.expires_at) < new Date()) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0D0D0C',
        color: '#F4F0EB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏰</div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '8px' }}>
            Enlace expirado
          </h1>
          <p style={{ fontSize: '15px', color: '#9E9A95' }}>
            Este enlace de emergencia ha expirado después de 24 horas.
            Si necesitas asistencia, llama al 911.
          </p>
          <a href="tel:911" style={{
            display: 'inline-block',
            marginTop: '20px',
            padding: '14px 28px',
            backgroundColor: '#E11D48',
            color: 'white',
            borderRadius: '10px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '16px',
          }}>
            Llamar al 911
          </a>
        </div>
      </div>
    );
  }

  // 5. Incrementar contador de vistas
  await supabase
    .from('incidentes')
    .update({ familiar_views: (incidente.familiar_views || 0) + 1 })
    .eq('id', incidente.id);

  // 6. Renderizar
  return (
    <EmergencyFamilyClient
      incidente={{
        token: incidente.token,
        chipFolio: incidente.chip_folio,
        latitud: incidente.latitud,
        longitud: incidente.longitud,
        locationShared: incidente.location_shared,
        createdAt: incidente.created_at,
        expiresAt: incidente.expires_at,
        familiarEnCamino: incidente.familiar_en_camino,
        status: incidente.status ?? null,
        enCaminoPor: incidente.en_camino_por ?? null,
        atendido: incidente.atendido ?? false,
        atendidoPor: incidente.atendido_por ?? null,
      }}
      profile={profileData ? {
        fullName: profileData.full_name || 'Usuario',
        bloodType: profileData.blood_type || null,
        medicalConditions: profileData.medical_conditions || null,
        importantMedications: profileData.important_medications || null,
        allergies: profileData.allergies || null,
        sexo: profileData.sexo || null,
        age: profileData.age || null,
        city: profileData.location || null,
      } : null}
      isDemo={false}
    />
  );
}
