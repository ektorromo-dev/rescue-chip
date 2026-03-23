import { createClient } from '@/lib/supabase/server';
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
  const supabase = await createClient();

  // 1. Buscar incidente por token
  const { data: incidente, error } = await supabase
    .from('incidentes')
    .select('*')
    .eq('token', token)
    .single();

  if (error || !incidente) {
    notFound();
  }

  // 2. Token expirado
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

  // 3. Cargar perfil médico
  let profileData = null;
  if (incidente.profile_id) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, blood_type, medical_conditions, important_medications, allergies, emergency_contacts, sexo, age, city')
      .eq('id', incidente.profile_id)
      .single();
    profileData = data;
  }

  // 4. Incrementar contador de vistas
  await supabase
    .from('incidentes')
    .update({ familiar_views: (incidente.familiar_views || 0) + 1 })
    .eq('id', incidente.id);

  // 5. Renderizar
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
      }}
      profile={profileData ? {
        fullName: profileData.full_name || 'Usuario',
        bloodType: profileData.blood_type || null,
        medicalConditions: profileData.medical_conditions || null,
        importantMedications: profileData.important_medications || null,
        allergies: profileData.allergies || null,
        sexo: profileData.sexo || null,
        age: profileData.age || null,
        city: profileData.city || null,
      } : null}
    />
  );
}
