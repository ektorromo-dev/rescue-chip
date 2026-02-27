import { HeartPulse, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProfileViewer from "@/components/ProfileViewer";

interface ProfileProps {
    params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: ProfileProps) {
    const { id: rawId } = await params;
    const id = decodeURIComponent(rawId);

    const supabase = await createClient();

    const cleanId = id.trim();
    console.log("Perfil - Buscando chip con folio:", cleanId);

    // 1. Fetch or Mock the chip by folio
    let chip: any = null;
    let profile: any = null;
    let chipError: any = null;
    let profileError: any = null;

    if (cleanId.toUpperCase() === "RSC-001" || cleanId.toUpperCase() === "DEMO") {
        chip = { id: 'demo-chip', folio: cleanId.toUpperCase(), activated: true };

        let demoPolizaUrl = null;
        const { data: chip4 } = await supabase.from('chips').select('id').eq('folio', 'RSC-004').single();
        if (chip4) {
            const { data: profile4 } = await supabase.from('profiles').select('poliza_url').eq('chip_id', chip4.id).single();
            if (profile4) demoPolizaUrl = profile4.poliza_url;
        }

        profile = {
            id: 'demo-profile',
            chip_id: 'demo-chip',
            full_name: 'Carlos Martínez López',
            age: 32,
            blood_type: 'O+',
            location: '+52 55 1234 5678',
            allergies: 'Penicilina, Sulfonamidas',
            medical_conditions: 'Asma leve',
            important_medications: 'Salbutamol (inhalador de rescate)',
            additional_notes: 'Usa lentes de contacto',
            medical_system: 'Seguro Privado (Gastos Médicos Mayores)',
            aseguradora: 'AXA',
            numero_poliza: 'GMM-2025-84723',
            nombre_asegurado: 'Carlos Martínez López',
            vigencia_poliza: '2026-12-31T00:00:00.000Z',
            telefono_aseguradora: '800-900-1292',
            poliza_url: demoPolizaUrl,
            emergency_contacts: [
                { name: 'María López (Madre)', phone: '+52 55 9876 5432' },
                { name: 'Ana Martínez (Esposa)', phone: '+52 55 5555 1234' }
            ],
            organ_donor: false,
            is_motorcyclist: true,
            photo_url: null
        };
    } else {
        const { data: dbChip, error: cError } = await supabase
            .from('chips')
            .select('*')
            .ilike('folio', cleanId)
            .single();
        chip = dbChip;
        chipError = cError;
    }

    if (chipError || !chip) {
        console.error("Error al buscar el chip o no se encontró:", chipError);
        return (
            <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
                <div className="bg-card p-10 rounded-3xl shadow-xl max-w-md text-center border border-border">
                    <AlertTriangle size={48} className="mx-auto text-destructive mb-6" />
                    <h1 className="text-2xl font-bold mb-4">Chip no válido</h1>
                    <p className="text-muted-foreground mb-8">Este folio no existe en nuestro sistema.</p>
                    <Link href="/" className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors inline-block mt-4">
                        Volver al inicio
                    </Link>
                </div>
            </div>
        );
    }

    // Compatibilidad para evitar que chips "viejos" ya activados fallen (status = null pero activated = true)
    const isChipFullyActivated = chip.status === 'activado' || chip.activated === true;

    // Si el folio EXISTE pero NO está activado (ej. disponible o vendido)
    if (!isChipFullyActivated) {
        return (
            <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
                <div className="bg-card p-10 rounded-3xl shadow-xl max-w-md text-center border border-border">
                    <HeartPulse size={48} className="mx-auto text-primary/50 mb-6" />
                    <h1 className="text-2xl font-bold mb-4">Redirigiendo...</h1>
                    <p className="text-muted-foreground mb-8">Este dispositivo está pendiente de registro.</p>
                    <meta httpEquiv="refresh" content={`0; url=/activate?folio=${encodeURIComponent(chip.folio)}`} />
                    <Link href={`/activate?folio=${encodeURIComponent(chip.folio)}`} className="text-primary underline font-bold mt-4">
                        Haz clic aquí si no te redirige automáticamente.
                    </Link>
                </div>
            </div>
        );
    }

    // 2. Fetch the profile for this chip if not mocked
    if (!profile) {
        let pQuery = supabase.from('profiles').select('*');

        if (chip.owner_profile_id) {
            // Flujo nuevo multi-chip: buscar el perfil base usando el owner_profile_id
            pQuery = pQuery.eq('id', chip.owner_profile_id);
        } else {
            // Flujo heredado (fallback): buscar el perfil donde su campo original chip_id sea este chip
            pQuery = pQuery.eq('chip_id', chip.id);
        }

        const { data: dbProfile, error: pError } = await pQuery.single();
        profile = dbProfile;
        profileError = pError;
    }

    if (profileError || !profile) {
        console.error(profileError);
        return <div>Error al cargar el perfil médico.</div>;
    }

    // Generate Signed URL for Policy Document
    let signedPolizaUrl = null;
    if (profile.poliza_url) {
        const { data: urlData, error: urlError } = await supabase.storage
            .from('polizas')
            .createSignedUrl(profile.poliza_url, 60 * 60); // 1 hour valid

        if (!urlError && urlData) {
            signedPolizaUrl = urlData.signedUrl;
        } else {
            console.error("Error generating signed url:", urlError);
        }
    }

    // Safe extraction of multiple contacts
    let emergencyContactsArray: any[] = [];
    if (profile.emergency_contacts) {
        try {
            if (Array.isArray(profile.emergency_contacts)) {
                emergencyContactsArray = profile.emergency_contacts;
            } else if (typeof profile.emergency_contacts === 'object') {
                emergencyContactsArray = [profile.emergency_contacts];
            }
        } catch (e) {
            console.error(e);
        }
    }

    const allergiesArray = profile.allergies ? profile.allergies.split(',').map((a: string) => a.trim()) : [];

    return (
        <ProfileViewer
            chip={chip}
            profile={profile}
            isDemo={cleanId.toUpperCase() === "RSC-001" || cleanId.toUpperCase() === "DEMO"}
            signedPolizaUrl={signedPolizaUrl}
            emergencyContactsArray={emergencyContactsArray}
            allergiesArray={allergiesArray}
        />
    );
}
