import { createClient } from '@/lib/supabase/server';
import { Metadata } from 'next';
import QuienConoceClient, { PersonalCapacitado } from './QuienConoceClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Personal Capacitado — RescueChip',
  description: 'Directorio oficial de paramédicos y personal de emergencias capacitados para identificar y utilizar RescueChip en atención prehospitalaria.',
};

interface PageProps {
  searchParams?: Promise<{ folio?: string }>;
}

export default async function QuienConocePage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialFolio = resolvedSearchParams?.folio?.trim() || '';

  const supabase = await createClient();
  const { data: personalData, error } = await supabase
    .from('personal_capacitado')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error al consultar personal_capacitado en Supabase:', error.message);
  }

  const personal: PersonalCapacitado[] = (personalData as PersonalCapacitado[]) || [];

  return (
    <QuienConoceClient
      personal={personal}
      initialFolio={initialFolio}
    />
  );
}