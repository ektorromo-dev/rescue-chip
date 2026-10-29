import { redirect } from 'next/navigation';
import { isValidFolio } from '@/lib/folio';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ folio: string }>;
}

export default async function AppActivarPage({ params }: PageProps) {
    const { folio } = await params;
    const rawFolio = (folio || '').trim();

    let cleanFolio = rawFolio;
    try {
        cleanFolio = decodeURIComponent(rawFolio).trim();
    } catch {
        cleanFolio = rawFolio;
    }

    if (isValidFolio(cleanFolio)) {
        redirect(`/activate?folio=${encodeURIComponent(cleanFolio)}`);
    }

    redirect('/activate');
}
