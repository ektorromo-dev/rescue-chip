import { Metadata } from 'next';
import EmergencyFamilyClient from '@/app/emergencia/[token]/EmergencyFamilyClient';

export const metadata: Metadata = {
  title: 'Alerta de Emergencia (DEMO) — RescueChip',
  description: 'Demostración de la vista de contacto de emergencia.',
  robots: 'noindex, nofollow',
};

export default function EmergenciaDemoPage() {
  const demoIncidente = {
    token: 'demo',
    chipFolio: 'RSC-DEMO',
    latitud: 19.4326,
    longitud: -99.1332,
    locationShared: true,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    familiarEnCamino: false,
  };

  const demoProfile = {
    fullName: 'Carlos Martínez',
    bloodType: null,
    medicalConditions: null,
    importantMedications: null,
    allergies: null,
    sexo: null,
    age: null,
    city: null,
  };

  return (
    <EmergencyFamilyClient
      incidente={demoIncidente}
      profile={demoProfile}
      isDemo={true}
    />
  );
}
