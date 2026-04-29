import { AlertTriangle, Clock } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import ProfileViewer from "@/components/ProfileViewer";

export const dynamic = 'force-dynamic';

interface ProfileProps {
    params: Promise<{ id: string }>;
    searchParams?: Promise<{ preview?: string }>;
}

export default async function ProfilePage({ params, searchParams }: ProfileProps) {
    const { id: rawId } = await params;
    const id = decodeURIComponent(rawId);
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const isPreview = resolvedSearchParams?.preview === 'true';
    // Lecturas de chips/profiles/scan_tokens requieren service_role tras el cierre de RLS.
    // El storage 'polizas' sigue usando signed URLs (admin las firma igual).
    const supabase = createAdminClient();
    const cleanId = id.trim();

    // --- DEMO / RSC-DEMO handling (unchanged) ---
    if (cleanId.toUpperCase() === "RSC-001" || cleanId.toUpperCase() === "DEMO" || cleanId.toUpperCase() === "RSC-DEMO") {
        let demoPolizaUrl = null;
        const { data: chip4 } = await supabase.from('chips').select('id').eq('folio', 'RSC-004').single();
        if (chip4) {
            const { data: profile4 } = await supabase.from('profiles').select('poliza_url').eq('chip_id', chip4.id).single();
            if (profile4) demoPolizaUrl = profile4.poliza_url;
        }
        const demoChip = { id: 'demo-chip', folio: cleanId.toUpperCase(), activated: true };
        const demoProfile = {
            id: 'demo-profile', chip_id: 'demo-chip', full_name: 'Carlos Martínez López', age: 32,
            blood_type: 'O+', location: '+52 55 1234 5678', allergies: 'Penicilina, Sulfonamidas',
            medical_conditions: 'Asma leve', important_medications: 'Salbutamol (inhalador de rescate)',
            additional_notes: 'Usa lentes de contacto', medical_system: 'Seguro Privado (Gastos Médicos Mayores)',
            aseguradora: 'AXA', numero_poliza: 'GMM-2025-84723', nombre_asegurado: 'Carlos Martínez López',
            vigencia_poliza: '2026-12-31T00:00:00.000Z', telefono_aseguradora: '800-900-1292',
            poliza_url: demoPolizaUrl,
            emergency_contacts: [
                { name: 'María López (Madre)', phone: '+52 55 9876 5432' },
                { name: 'Ana Martínez (Esposa)', phone: '+52 55 5555 1234' }
            ],
            organ_donor: false, is_motorcyclist: true, photo_url: null
        };
        const allergiesArray = demoProfile.allergies.split(',').map((a: string) => a.trim());
        return (
            <ProfileViewer chip={demoChip} profile={demoProfile} isDemo={true}
                signedPolizaUrl={demoPolizaUrl} emergencyContactsArray={demoProfile.emergency_contacts}
                allergiesArray={allergiesArray} isPreview={false} />
        );
    }

    // --- Determine if this is a token or a folio ---
    const isToken = /^[0-9a-f]{32}$/.test(cleanId);
    const isFolio = /^RSC-/i.test(cleanId);

    // --- FOLIO: generate token and redirect ---
    if (isFolio) {
        // First verify the chip exists and is activated
        const { data: chip, error: chipError } = await supabase
            .from('chips').select('*').ilike('folio', cleanId).single();

        if (chipError || !chip) {
            return (
                <div style={{ minHeight: '100vh', backgroundColor: '#0A0A08', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
                    <div style={{ backgroundColor: '#131311', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxWidth: '448px', width: '100%', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <AlertTriangle size={48} style={{ margin: '0 auto', color: '#E8231A', marginBottom: '24px' }} />
                        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px', color: '#F4F0EB' }}>Chip no válido</h1>
                        <p style={{ color: '#9E9A95', marginBottom: '32px' }}>Este folio no existe en nuestro sistema.</p>
                        <Link href="/" style={{ backgroundColor: '#E8231A', color: '#F4F0EB', padding: '12px 24px', borderRadius: '9999px', fontWeight: 700, display: 'inline-block', marginTop: '16px', textDecoration: 'none' }}>
                            Volver al inicio
                        </Link>
                    </div>
                </div>
            );
        }

        const isChipFullyActivated = chip.status === 'activado' || chip.activated === true;
        if (!isChipFullyActivated) {
            redirect(`/activate?folio=${encodeURIComponent(chip.folio)}`);
        }

        // Load profile directly without token generation to prevent 307 caching loops on Safari
        let profile: any = null;
        let pQuery = supabase.from('profiles').select('*');
        if (chip.owner_profile_id) {
            pQuery = pQuery.eq('id', chip.owner_profile_id);
        } else {
            pQuery = pQuery.eq('chip_id', chip.id);
        }
        const { data: dbProfile } = await pQuery.single();
        profile = dbProfile;
        if (!profile) return <div>Error al cargar el perfil médico.</div>;

        let signedPolizaUrl = null;
        if (profile.poliza_url) {
            const { data: urlData } = await supabase.storage.from('polizas').createSignedUrl(profile.poliza_url, 3600);
            if (urlData) signedPolizaUrl = urlData.signedUrl;
        }
        let emergencyContactsArray: any[] = [];
        if (profile.emergency_contacts) {
            try {
                emergencyContactsArray = Array.isArray(profile.emergency_contacts) ? profile.emergency_contacts : [profile.emergency_contacts];
            } catch (e) { console.error(e); }
        }
        const allergiesArray = profile.allergies ? profile.allergies.split(',').map((a: string) => a.trim()) : [];
        return (
            <ProfileViewer chip={chip} profile={profile} isDemo={false}
                signedPolizaUrl={signedPolizaUrl} emergencyContactsArray={emergencyContactsArray}
                allergiesArray={allergiesArray} isPreview={isPreview} />
        );
    }

    // --- TOKEN: validate and show profile ---
    if (isToken) {
        const { data: tokenRecord, error: tokenError } = await supabase
            .from('scan_tokens')
            .select('*')
            .eq('token', cleanId)
            .single();

        if (tokenError || !tokenRecord) {
            return (
                <div style={{ minHeight: '100vh', backgroundColor: '#0A0A08', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
                    <div style={{ backgroundColor: '#131311', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxWidth: '448px', width: '100%', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <AlertTriangle size={48} style={{ margin: '0 auto', color: '#E8231A', marginBottom: '24px' }} />
                        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px', color: '#F4F0EB' }}>Enlace no válido</h1>
                        <p style={{ color: '#9E9A95', marginBottom: '32px' }}>Este enlace ha expirado o no existe. Escanea el chip o QR nuevamente.</p>
                        <Link href="/" style={{ backgroundColor: '#E8231A', color: '#F4F0EB', padding: '12px 24px', borderRadius: '9999px', fontWeight: 700, display: 'inline-block', marginTop: '16px', textDecoration: 'none' }}>
                            Volver al inicio
                        </Link>
                    </div>
                </div>
            );
        }

        // Check expiration
        const now = new Date();
        const expiresAt = new Date(tokenRecord.expires_at);
        if (now > expiresAt) {
            return (
                <div style={{ minHeight: '100vh', backgroundColor: '#0A0A08', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
                    <div style={{ backgroundColor: '#131311', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxWidth: '448px', width: '100%', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Clock size={48} style={{ margin: '0 auto', color: '#E8231A', marginBottom: '24px' }} />
                        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px', color: '#F4F0EB' }}>Sesión expirada</h1>
                        <p style={{ color: '#9E9A95', marginBottom: '32px' }}>Tu acceso ha expirado por seguridad. Escanea el chip NFC o el código QR nuevamente para acceder al perfil.</p>
                        <Link href="/" style={{ backgroundColor: '#E8231A', color: '#F4F0EB', padding: '12px 24px', borderRadius: '9999px', fontWeight: 700, display: 'inline-block', marginTop: '16px', textDecoration: 'none' }}>
                            Volver al inicio
                        </Link>
                    </div>
                </div>
            );
        }

        // Token valid — load chip and profile
        const { data: chip, error: chipErr } = await supabase
            .from('chips').select('*').ilike('folio', tokenRecord.chip_folio).single();

        if (chipErr || !chip) return <div>Error al cargar chip.</div>;

        let profile: any = null;
        let pQuery = supabase.from('profiles').select('*');
        if (chip.owner_profile_id) {
            pQuery = pQuery.eq('id', chip.owner_profile_id);
        } else {
            pQuery = pQuery.eq('chip_id', chip.id);
        }
        const { data: dbProfile, error: pError } = await pQuery.single();
        profile = dbProfile;
        if (pError || !profile) return <div>Error al cargar el perfil médico.</div>;

        let signedPolizaUrl = null;
        if (profile.poliza_url) {
            const { data: urlData } = await supabase.storage.from('polizas').createSignedUrl(profile.poliza_url, 3600);
            if (urlData) signedPolizaUrl = urlData.signedUrl;
        }
        let emergencyContactsArray: any[] = [];
        if (profile.emergency_contacts) {
            try {
                emergencyContactsArray = Array.isArray(profile.emergency_contacts) ? profile.emergency_contacts : [profile.emergency_contacts];
            } catch (e) { console.error(e); }
        }
        const allergiesArray = profile.allergies ? profile.allergies.split(',').map((a: string) => a.trim()) : [];

        return (
            <ProfileViewer chip={chip} profile={profile} isDemo={false}
                signedPolizaUrl={signedPolizaUrl} emergencyContactsArray={emergencyContactsArray}
                allergiesArray={allergiesArray} isPreview={false} scanToken={tokenRecord.token}
                tokenExpiresAt={tokenRecord.expires_at} />
        );
    }

    // --- Neither token nor folio ---
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0A0A08', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
            <div style={{ backgroundColor: '#131311', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxWidth: '448px', width: '100%', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
                <AlertTriangle size={48} style={{ margin: '0 auto', color: '#E8231A', marginBottom: '24px' }} />
                <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px', color: '#F4F0EB' }}>Enlace no válido</h1>
                <p style={{ color: '#9E9A95', marginBottom: '32px' }}>Escanea el chip NFC o el código QR para acceder al perfil.</p>
                <Link href="/" style={{ backgroundColor: '#E8231A', color: '#F4F0EB', padding: '12px 24px', borderRadius: '9999px', fontWeight: 700, display: 'inline-block', marginTop: '16px', textDecoration: 'none' }}>
                    Volver al inicio
                </Link>
            </div>
        </div>
    );
}
