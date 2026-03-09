"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2, LogOut, LayoutDashboard, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateProfileSafe } from "@/app/actions/sanitize";

export default function DashboardPage() {
    const router = useRouter();
    const supabase = createClient();

    const [loadingAuth, setLoadingAuth] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Device detection state
    const [deviceVerificationStatus, setDeviceVerificationStatus] = useState<"idle" | "checking" | "pending" | "verified" | "revoked">("idle");
    const [deviceId, setDeviceId] = useState("");

    const [profileId, setProfileId] = useState("");
    const [folio, setFolio] = useState("");

    // Photo
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);

    // Form fields
    const [fullName, setFullName] = useState("");
    const [age, setAge] = useState("");
    const [location, setLocation] = useState("");
    const [bloodType, setBloodType] = useState("");
    const [allergies, setAllergies] = useState("");
    const [medicalConditions, setMedicalConditions] = useState("");
    const [importantMedications, setImportantMedications] = useState("");
    const [insuranceProvider, setInsuranceProvider] = useState("");
    const [policyNumber, setPolicyNumber] = useState("");
    const [medicalSystem, setMedicalSystem] = useState("");

    // Public / Inst. Insurance fields
    const [nss, setNss] = useState("");
    const [numeroAfiliacion, setNumeroAfiliacion] = useState("");
    const [clinicaAsignada, setClinicaAsignada] = useState("");
    const [curpSeguro, setCurpSeguro] = useState("");

    // Private Insurance fields
    const [aseguradora, setAseguradora] = useState("");
    const [aseguradoraOtra, setAseguradoraOtra] = useState("");
    const [numeroPoliza, setNumeroPoliza] = useState("");
    const [tipoSeguro, setTipoSeguro] = useState("");
    const [nombreAsegurado, setNombreAsegurado] = useState("");
    const [vigenciaPoliza, setVigenciaPoliza] = useState("");
    const [telefonoAseguradora, setTelefonoAseguradora] = useState("");

    const [polizaFile, setPolizaFile] = useState<File | null>(null);
    const [currentPolizaUrl, setCurrentPolizaUrl] = useState<string | null>(null);

    const [organDonor, setOrganDonor] = useState(false);
    const [isMotorcyclist, setIsMotorcyclist] = useState(false);
    const [additionalNotes, setAdditionalNotes] = useState("");
    const [googleMapsLink, setGoogleMapsLink] = useState("");

    // Contacts
    const [contact1Name, setContact1Name] = useState("");
    const [contact1Phone, setContact1Phone] = useState("");
    const [contact1Email, setContact1Email] = useState("");
    const [contact2Name, setContact2Name] = useState("");
    const [contact2Phone, setContact2Phone] = useState("");
    const [contact2Email, setContact2Email] = useState("");
    const [contact3Name, setContact3Name] = useState("");
    const [contact3Phone, setContact3Phone] = useState("");
    const [contact3Email, setContact3Email] = useState("");

    // Access Logs
    const [accessLogs, setAccessLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

    // Este useEffect corre SIEMPRE que el usuario esté autenticado en el dashboard
    useEffect(() => {
        const sessionCheck = setInterval(async () => {
            console.log('Checking session...');
            // Leer device_id desde las cookies
            const localDeviceId = document.cookie.split('; ').find(row => row.startsWith('rescuechip_device_id='))?.split('=')[1];
            if (!localDeviceId) return;

            const { data } = await supabase
                .from('user_sessions')
                .select('status')
                .eq('device_id', localDeviceId)
                .single();

            if (!data || data.status === 'revoked') {
                clearInterval(sessionCheck);
                await supabase.auth.signOut();
                window.location.href = '/login';
            }
        }, 5000);

        return () => clearInterval(sessionCheck);
    }, []);

    useEffect(() => {
        let pollingInterval: NodeJS.Timeout;

        const fetchUserData = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            console.log('SESSION USER ID:', session?.user?.id);
            console.log('SESSION USER EMAIL:', session?.user?.email);

            if (!session || !session.user) {
                router.push('/login');
                return;
            }


            const checkDeviceSession = async (userSessionData: any, token: string, localDeviceId: string) => {
                const { data: userSessions } = await supabase
                    .from('user_sessions')
                    .select('id, device_id, status')
                    .eq('user_id', userSessionData.user.id);

                const currentSession = userSessions?.find(s => s.device_id === localDeviceId);
                const verifiedSessions = userSessions?.filter(s => s.status === 'verified' && s.device_id !== localDeviceId);

                // 1. Si el dispositivo actual ya está verificado, permitir y actualizar last_seen
                if (currentSession?.status === 'verified') {
                    setDeviceVerificationStatus('verified');
                    supabase.from('user_sessions')
                        .update({ last_seen: new Date().toISOString() })
                        .eq('id', currentSession.id)
                        .then(); // bg task
                    return true;
                }

                // 2. Si no hay NINGÚN otro dispositivo verificado, este es técnicamente el "primer"
                // dispositivo real validado. Autorizamos silenciosamente.
                if (!verifiedSessions || verifiedSessions.length === 0) {
                    if (currentSession) {
                        await supabase.from('user_sessions').update({
                            status: 'verified',
                            last_seen: new Date().toISOString()
                        }).eq('id', currentSession.id);
                    } else {
                        await supabase.from('user_sessions').insert({
                            user_id: userSessionData.user.id,
                            device_id: localDeviceId,
                            device_info: navigator.userAgent || 'Unknown Device',
                            status: 'verified'
                        });
                    }
                    setDeviceVerificationStatus("verified");
                    return true;
                }

                // 3. A este punto, SÍ hay otros dispositivos verificados, y este NO lo está.
                // Por lo tanto, enviamos correo y esperamos confirmación.
                setDeviceVerificationStatus("pending");
                try {
                    await fetch('/api/request-device-verification', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            deviceId: localDeviceId,
                            deviceInfo: navigator.userAgent || 'Unknown Device'
                        })
                    });
                } catch (e) {
                    console.error("Error pidiendo verif por correo", e);
                }
                return false;
            };

            // --- MANEJO DE NUEVO DISPOSITIVO POR EMAIL CON COOKIES ---
            let currentDeviceId = document.cookie.split('; ').find(row => row.startsWith('rescuechip_device_id='))?.split('=')[1];
            if (!currentDeviceId) {
                currentDeviceId = crypto.randomUUID();
                // Guardar la cookie por 30 días
                document.cookie = `rescuechip_device_id=${currentDeviceId}; max-age=${30 * 24 * 60 * 60}; path=/; SameSite=Lax`;
            }
            setDeviceId(currentDeviceId);

            try {
                const isVerified = await checkDeviceSession(session, session.access_token, currentDeviceId);

                if (!isVerified) {
                    // Start polling
                    pollingInterval = setInterval(async () => {
                        const { data: dbCurrent } = await supabase
                            .from('user_sessions')
                            .select('status')
                            .eq('user_id', session.user.id)
                            .eq('device_id', currentDeviceId)
                            .maybeSingle();

                        if (dbCurrent?.status) {
                            setDeviceVerificationStatus(dbCurrent.status as any);
                            if (dbCurrent.status === 'verified') {
                                clearInterval(pollingInterval);
                                // Refresh entire component state to load data now that it's verified
                                window.location.reload();
                            } else if (dbCurrent.status === 'revoked') {
                                clearInterval(pollingInterval);
                                await supabase.auth.signOut({ scope: 'global' });
                                window.location.href = "/login";
                            }
                        }
                    }, 3000);
                    setLoadingAuth(false);
                    return; // Detener flujo para no cargar datos reales de perfil, se esconde tras pantalla de pending
                }

            } catch (err) {
                console.error("Error checking device session:", err);
                setDeviceVerificationStatus("verified"); // Failsafe para no bloquear si hay error de DB
            }
            // --- FIN MANEJO DE NUEVO DISPOSITIVO ---

            try {
                // Fetch profile associated with this user_id resiliently
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .limit(1)
                    .maybeSingle();

                if (profileError || !profile) {
                    throw new Error("No se encontró un perfil médico asociado a esta cuenta. Si acabas de adquirir tu Chip NFC o Pulsera, actívalo ahora.");
                }

                // Populate state
                setProfileId(profile.id);

                // Fetch associated chips robustly
                const { data: chipsData } = await supabase
                    .from('chips')
                    .select('folio, perfil_compartido')
                    .eq('owner_profile_id', profile.id);

                let associatedFolios: string[] = [];
                let sharedProfileFlag = false;

                if (chipsData && chipsData.length > 0) {
                    associatedFolios = chipsData.map((c: any) => c.folio);
                    sharedProfileFlag = chipsData.some((c: any) => c.perfil_compartido);
                }

                setFolio(associatedFolios.join(', ')); // Para mostrar o gestionar en estado simple actual
                (window as any)._hasChips = associatedFolios.length > 0; // Marcar bandera temporal para la UI

                setCurrentPhotoUrl(profile.photo_url || null);

                setFullName(profile.full_name || "");
                setAge(profile.age ? profile.age.toString() : "");
                setLocation(profile.location || "");
                setBloodType(profile.blood_type || "");
                setAllergies(profile.allergies || "");
                setMedicalConditions(profile.medical_conditions || "");
                setImportantMedications(profile.important_medications || "");
                setInsuranceProvider(profile.insurance_provider || "");
                setPolicyNumber(profile.policy_number || "");
                setMedicalSystem(profile.medical_system || "");

                const knownAseguradoras = ['AXA', 'GNP', 'Seguros Monterrey (SMNYL)', 'Allianz', 'MetLife', 'Zurich', 'BUPA', 'Mapfre', 'Seguros Atlas'];
                if (profile.aseguradora && !knownAseguradoras.includes(profile.aseguradora)) {
                    setAseguradora("Otro");
                    setAseguradoraOtra(profile.aseguradora);
                } else {
                    setAseguradora(profile.aseguradora || "");
                }
                setNumeroPoliza(profile.numero_poliza || "");
                setTipoSeguro(profile.tipo_seguro || "");
                setNombreAsegurado(profile.nombre_asegurado || "");
                setVigenciaPoliza(profile.vigencia_poliza || "");
                setTelefonoAseguradora(profile.telefono_aseguradora || "");
                setCurrentPolizaUrl(profile.poliza_url || null);

                setNss(profile.nss || "");
                setNumeroAfiliacion(profile.numero_afiliacion || "");
                setClinicaAsignada(profile.clinica_asignada || "");
                setCurpSeguro(profile.curp_seguro || "");

                setOrganDonor(profile.organ_donor || false);
                setIsMotorcyclist(profile.is_motorcyclist || false);
                setAdditionalNotes(profile.additional_notes || "");

                setGoogleMapsLink(profile.google_maps_link || "");

                if (profile.emergency_contacts && Array.isArray(profile.emergency_contacts)) {
                    const c1 = profile.emergency_contacts[0];
                    if (c1) { setContact1Name(c1.name || ""); setContact1Phone(c1.phone || ""); setContact1Email(c1.email || ""); }

                    const c2 = profile.emergency_contacts[1];
                    if (c2) { setContact2Name(c2.name || ""); setContact2Phone(c2.phone || ""); setContact2Email(c2.email || ""); }

                    const c3 = profile.emergency_contacts[2];
                    if (c3) { setContact3Name(c3.name || ""); setContact3Phone(c3.phone || ""); setContact3Email(c3.email || ""); }
                }

                // Fetch access logs
                if (associatedFolios.length > 0) {
                    setLoadingLogs(true);
                    const { data: logsData, error: logsError } = await supabase
                        .from('chip_accesos')
                        .select('*')
                        .in('chip_folio', associatedFolios)
                        .order('created_at', { ascending: false });

                    if (!logsError && logsData) {
                        setAccessLogs(logsData);
                    }
                    setLoadingLogs(false);
                }

                // Temporary states to pass to render
                (window as any)._sharedProfileFlag = sharedProfileFlag;

            } catch (err: any) {
                setErrorMsg(err.message);
            } finally {
                setLoadingAuth(false);
            }
        };

        fetchUserData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    // handlers removed since validation happens in email now

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            const emergencyContacts = [];
            if (contact1Name && contact1Phone) emergencyContacts.push({ name: contact1Name, phone: contact1Phone, email: contact1Email });
            if (contact2Name && contact2Phone) emergencyContacts.push({ name: contact2Name, phone: contact2Phone, email: contact2Email });
            if (contact3Name && contact3Phone) emergencyContacts.push({ name: contact3Name, phone: contact3Phone, email: contact3Email });

            if (emergencyContacts.length === 0) {
                throw new Error("Debes proporcionar al menos un contacto de emergencia.");
            }

            let newPhotoUrl = currentPhotoUrl;
            if (photoFile) {
                const fileExt = photoFile.name.split('.').pop();
                const fileName = `${folio}-${Math.random()}.${fileExt}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('profile-photos')
                    .upload(fileName, photoFile);

                if (uploadError) {
                    throw new Error("No se pudo subir la nueva foto de perfil. Inténtalo de nuevo.");
                }

                const { data: publicUrlData } = supabase.storage
                    .from('profile-photos')
                    .getPublicUrl(fileName);

                newPhotoUrl = publicUrlData.publicUrl;
            }

            let newPolizaUrl = currentPolizaUrl;
            if (polizaFile) {
                const sessionResponse = await supabase.auth.getSession();
                const userId = sessionResponse.data.session?.user.id;
                const fileExt = polizaFile.name.split('.').pop();
                const fileName = `poliza.${fileExt}`;
                const fullPath = `${userId}/${fileName}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('polizas')
                    .upload(fullPath, polizaFile, { upsert: true });

                if (uploadError) {
                    throw new Error("No se pudo subir el archivo de la póliza. Inténtalo de nuevo.");
                }

                newPolizaUrl = fullPath;
            }

            const finalAseguradora = aseguradora === "Otro" ? aseguradoraOtra : (aseguradora || null);

            const profileToUpdate = {
                full_name: fullName,
                photo_url: newPhotoUrl,
                age: age ? parseInt(age, 10) : null,
                location: location,
                emergency_contacts: emergencyContacts,
                blood_type: bloodType,
                allergies: allergies,
                medical_conditions: medicalConditions,
                important_medications: importantMedications,
                insurance_provider: insuranceProvider,
                policy_number: policyNumber,
                medical_system: medicalSystem,
                organ_donor: organDonor,
                is_motorcyclist: isMotorcyclist,
                additional_notes: additionalNotes,
                google_maps_link: googleMapsLink,
                aseguradora: finalAseguradora,
                numero_poliza: numeroPoliza || null,
                tipo_seguro: tipoSeguro || null,
                nombre_asegurado: nombreAsegurado || null,
                vigencia_poliza: vigenciaPoliza || null,
                telefono_aseguradora: telefonoAseguradora || null,
                poliza_url: newPolizaUrl,
                nss: nss || null,
                numero_afiliacion: numeroAfiliacion || null,
                clinica_asignada: clinicaAsignada || null,
                curp_seguro: curpSeguro || null,
                updated_at: new Date().toISOString()
            };

            await updateProfileSafe(profileId, profileToUpdate);

            setSuccessMsg("¡Perfil actualizado con éxito!");
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (err: any) {
            setErrorMsg(err.message || "Ocurrió un error inesperado al guardar.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteInsuranceInfo = async () => {
        if (!confirm("¿Estás seguro de que deseas eliminar toda la información y documento de tu seguro?")) return;
        setSaving(true);
        try {
            if (currentPolizaUrl) {
                await supabase.storage.from('polizas').remove([currentPolizaUrl]);
            }
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    medical_system: null,
                    aseguradora: null,
                    numero_poliza: null,
                    tipo_seguro: null,
                    nombre_asegurado: null,
                    vigencia_poliza: null,
                    telefono_aseguradora: null,
                    poliza_url: null,
                    nss: null,
                    numero_afiliacion: null,
                    clinica_asignada: null,
                    curp_seguro: null,
                })
                .eq('id', profileId);

            if (updateError) throw updateError;

            setMedicalSystem("");
            setAseguradora("");
            setAseguradoraOtra("");
            setNumeroPoliza("");
            setTipoSeguro("");
            setNombreAsegurado("");
            setVigenciaPoliza("");
            setTelefonoAseguradora("");
            setPolizaFile(null);
            setCurrentPolizaUrl(null);
            setNss("");
            setNumeroAfiliacion("");
            setClinicaAsignada("");
            setCurpSeguro("");

            setSuccessMsg("Información de seguro eliminada.");
        } catch (err: any) {
            setErrorMsg(err.message || "Error al eliminar información.");
        } finally {
            setSaving(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    if (loadingAuth || deviceVerificationStatus === "idle") {
        return (
            <div style={{ minHeight: "100vh", backgroundColor: "#1A1A18", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px" }}>
                <Loader2 size={48} style={{ animation: 'spin 1s linear infinite', color: 'rgba(232,35,26,0.3)', marginBottom: '16px' }} />
                <p style={{ fontWeight: 500, color: "#9E9A95" }}>Cargando tu panel de control...</p>
            </div>
        );
    }

    if (deviceVerificationStatus === "pending") {
        return (
            <div style={{ minHeight: "100vh", backgroundColor: "#0A0A08", display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 0" }}>
                <div style={{ backgroundColor: "#131311", width: "100%", maxWidth: "448px", borderRadius: "16px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", border: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
                    <div style={{ width: "96px", height: "96px", color: "#E8231A", margin: "0 auto", borderRadius: "9999px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "32px", position: "relative" }}>
                        <Loader2 size={48} style={{ position: "absolute" }} />
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z"></path><path d="m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10"></path></svg>
                    </div>
                    <h2 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "16px" }}>Verifica tu correo</h2>
                    <p style={{ color: "#9E9A95", fontWeight: 500, marginBottom: "24px" }}>
                        Por seguridad, hemos enviado un enlace de autorización temporal a tu correo electrónico.
                    </p>
                    <div style={{ padding: "16px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, display: "flex", flexDirection: "column", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                        <span>Abre tu correo y haz clic en "Permitir acceso".</span>
                        <span style={{ fontSize: "12px" }}>Revisaremos automáticamente...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#0A0A08", display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 0" }}>
            <div style={{ colorScheme: 'dark', maxWidth: '768px', width: '100%', backgroundColor: "#1A1A18", borderRadius: "16px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", border: "1px solid rgba(255,255,255,0.08)", padding: "32px" }}>
                {/* Header */}
                <div style={{ position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, right: 0, width: "320px", height: "320px", borderRadius: "9999px" }} />

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", position: "relative", zIndex: 10, width: "100%" }}>
                        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", borderRadius: "9999px", transition: "color 0.2s, background-color 0.2s, border-color 0.2s", fontWeight: 500, fontSize: "12px" }}>
                            <ArrowLeft size={16} /> Volver
                        </Link>
                        <button onClick={handleSignOut} style={{ display: "inline-flex", alignItems: "center", gap: "8px", borderRadius: "9999px", transition: "color 0.2s, background-color 0.2s, border-color 0.2s", fontWeight: 500, fontSize: "12px" }}>
                            Cerrar Sesión <LogOut size={16} />
                        </button>
                    </div>

                    <h1 style={{ fontSize: "36px", fontWeight: 900, position: "relative", zIndex: 10, display: "flex", alignItems: "center", gap: "12px" }}>
                        <LayoutDashboard size={40} style={{ display: "block" }} />
                        Mi Panel de Control
                    </h1>
                    <p style={{ position: "relative", zIndex: 10, fontSize: "20px", fontWeight: 500, maxWidth: "512px" }}>
                        Actualiza tu información médica en cualquier momento.
                    </p>
                </div>

                <div style={{ padding: "48px", position: "relative", backgroundColor: "#131311" }}>

                    {errorMsg && (
                        <div style={{ marginBottom: "32px", padding: "16px", color: "#E8231A", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                            <AlertCircle size={18} /> {errorMsg}
                        </div>
                    )}

                    {successMsg && (
                        <div style={{ marginBottom: "32px", padding: "16px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                            <CheckCircle2 size={18} /> {successMsg}
                        </div>
                    )}

                    {!profileId ? (
                        <div style={{ textAlign: "center", padding: "24px 0", marginBottom: "32px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)" }}>
                            <p style={{ color: "#9E9A95", fontSize: "18px" }}>No tienes un perfil médico vinculado todavía.</p>
                            <Link href="/activate" style={{ display: "inline-block", padding: "8px 0", borderRadius: "12px", fontWeight: 700, transition: "color 0.2s, background-color 0.2s, border-color 0.2s" }}>Activar Nuevo Chip</Link>
                        </div>
                    ) : (
                        <>
                            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

                                {/* ENLACE PUBLICO */}
                                {folio && (
                                    <section style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                                        <div>
                                            <h3 style={{ fontWeight: 700, color: "#E8231A", display: "flex", alignItems: "center", gap: "8px" }}>
                                                <CheckCircle2 size={18} /> Chips Vinculados: {folio.toUpperCase()}
                                            </h3>
                                            <p style={{ fontSize: "14px", color: "#9E9A95" }}>Este es el enlace al que accederán los paramédicos al escanear uno de tus chips.</p>

                                            {/* Restricción de Perfil Compartido */}
                                            {(window as any)._sharedProfileFlag && (
                                                <div style={{ marginTop: "16px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", maxWidth: "576px" }}>
                                                    <p style={{ fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center" }}><AlertCircle size={14} /> Perfil Compartido</p>
                                                    <p style={{ fontSize: "12px", color: "#9E9A95" }}>La configuración maestra y control de desvinculación de este chip es manejada por otra persona. Si precisas desligar este chip contáctanos.</p>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "row", gap: "8px", width: "NaNpx" }}>
                                            <a href={`/profile/${folio.split(',')[0].trim()}`} target="_blank" rel="noopener noreferrer"
                                                style={{ padding: "8px 16px", borderRadius: "8px", fontWeight: 700, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                                Ver mi Perfil Público
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                            </a>
                                        </div>
                                    </section>
                                )}

                                {/* IDENTIFICACIÓN */}
                                <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <h3 style={{ fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", marginBottom: "16px", color: "#F4F0EB" }}>
                                        <span style={{ backgroundColor: "rgba(232,35,26,0.12)", color: "#E8231A", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0, fontWeight: 600 }}>1</span>
                                        Identificación
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "16px" }}>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Foto de Perfil</label>
                                            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "16px" }}>
                                                {photoFile ? (
                                                    <div style={{ width: "80px", height: "80px", borderRadius: "16px", overflow: "hidden", backgroundColor: "#1A1A18", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={URL.createObjectURL(photoFile)} alt="Preview" style={{ width: "100%", height: "100%" }} />
                                                    </div>
                                                ) : currentPhotoUrl ? (
                                                    <div style={{ width: "80px", height: "80px", borderRadius: "16px", backgroundColor: "#1A1A18", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", position: "relative" }}>
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={currentPhotoUrl} alt="Foto actual" style={{ width: "100%", height: "100%" }} />
                                                        <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                            <span style={{ fontWeight: 700 }}>Actual</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ width: "80px", height: "80px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", color: "#9E9A95", fontSize: "24px" }}>
                                                        📷
                                                    </div>
                                                )}
                                                <div >
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            if (e.target.files && e.target.files[0]) {
                                                                setPhotoFile(e.target.files[0]);
                                                            }
                                                        }}
                                                        style={{ width: "100%", display: "flex", height: "56px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "#1E1E1C", padding: "8px 16px", fontSize: "14px", transition: "all 0.2s ease-in-out", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}
                                                    />
                                                    <p style={{ fontSize: "12px", color: "#9E9A95", fontWeight: 500 }}>Sube una nueva foto si deseas cambiar la actual.</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                                            <label htmlFor="fullName" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Nombre Completo *</label>
                                            <input type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                                onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} required />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label htmlFor="age" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Edad</label>
                                            <input type="number" id="age" value={age} onChange={(e) => setAge(e.target.value)} style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                                onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} min="0" max="130" />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label htmlFor="location" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Ciudad / País *</label>
                                            <input type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)} style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                                onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} required />
                                        </div>
                                    </div>
                                </section>

                                {/* CONTACTOS DE EMERGENCIA */}
                                <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <h3 style={{ fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", marginBottom: "16px", color: "#F4F0EB" }}>
                                        <span style={{ backgroundColor: "rgba(232,35,26,0.12)", color: "#E8231A", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0, fontWeight: 600 }}>2</span>
                                        Contactos de Emergencia
                                    </h3>

                                    <div style={{ padding: "16px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "16px" }}>
                                        <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#E8231A" }}>Contacto 1 (Requerido)</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Nombre</label>
                                                <input type="text" value={contact1Name} onChange={(e) => setContact1Name(e.target.value)} style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                                    onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} required />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Teléfono</label>
                                                <input type="tel" value={contact1Phone} onChange={(e) => setContact1Phone(e.target.value)} style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                                    onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} required />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                                                <label style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Email (Opcional, para recibir alertas)</label>
                                                <input type="email" value={contact1Email} onChange={(e) => setContact1Email(e.target.value)} placeholder="Email del contacto" style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                                    onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ padding: "16px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "16px" }}>
                                        <h4 style={{ fontSize: "14px", fontWeight: 700 }}>Contacto 2 (Opcional)</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Nombre</label>
                                                <input type="text" value={contact2Name} onChange={(e) => setContact2Name(e.target.value)} style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                                    onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Teléfono</label>
                                                <input type="tel" value={contact2Phone} onChange={(e) => setContact2Phone(e.target.value)} style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                                    onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                                                <label style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Email (Opcional, para recibir alertas)</label>
                                                <input type="email" value={contact2Email} onChange={(e) => setContact2Email(e.target.value)} placeholder="Email del contacto" style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                                    onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ padding: "16px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "16px" }}>
                                        <h4 style={{ fontSize: "14px", fontWeight: 700 }}>Contacto 3 (Opcional)</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Nombre</label>
                                                <input type="text" value={contact3Name} onChange={(e) => setContact3Name(e.target.value)} style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                                    onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Teléfono</label>
                                                <input type="tel" value={contact3Phone} onChange={(e) => setContact3Phone(e.target.value)} style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                                    onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                                                <label style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Email (Opcional, para recibir alertas)</label>
                                                <input type="email" value={contact3Email} onChange={(e) => setContact3Email(e.target.value)} placeholder="Email del contacto" style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                                    onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* INFORMACIÓN MÉDICA */}
                                <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <h3 style={{ fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", marginBottom: "16px", color: "#F4F0EB" }}>
                                        <span style={{ backgroundColor: "rgba(232,35,26,0.12)", color: "#E8231A", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0, fontWeight: 600 }}>3</span>
                                        Información Médica
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label htmlFor="bloodType" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Tipo de Sangre *</label>
                                            <select id="bloodType" value={bloodType} onChange={(e) => setBloodType(e.target.value)} style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                                onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} required>
                                                <option value="">Selecciona tu tipo de sangre</option>
                                                <option value="A+">A+</option>
                                                <option value="A-">A-</option>
                                                <option value="B+">B+</option>
                                                <option value="B-">B-</option>
                                                <option value="AB+">AB+</option>
                                                <option value="AB-">AB-</option>
                                                <option value="O+">O+</option>
                                                <option value="O-">O-</option>
                                                <option value="Desconocido">Lo desconozco</option>
                                            </select>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                                            <label htmlFor="allergies" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Alergias Conocidas</label>
                                            <input type="text" id="allergies" value={allergies} onChange={(e) => setAllergies(e.target.value)} style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                                onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                                            <label htmlFor="medicalConditions" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Condiciones Médicas</label>
                                            <textarea id="medicalConditions" value={medicalConditions} onChange={(e) => setMedicalConditions(e.target.value)} style={{ width: "100%", display: "flex", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "#1E1E1C", padding: "0 16px", fontSize: "14px", transition: "all 0.2s ease-in-out" }} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                                            <label htmlFor="importantMedications" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Medicamentos Importantes</label>
                                            <textarea id="importantMedications" value={importantMedications} onChange={(e) => setImportantMedications(e.target.value)} style={{ width: "100%", display: "flex", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "#1E1E1C", padding: "0 16px", fontSize: "14px", transition: "all 0.2s ease-in-out" }} />
                                        </div>
                                    </div>
                                </section>

                                {/* MI SEGURO MÉDICO (UNIFIED) */}
                                <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <h3 style={{ fontSize: "20px", fontWeight: 700, display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.08)", gap: "16px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <span style={{ color: "#E8231A", width: "32px", height: "32px", borderRadius: "9999px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>4</span>
                                            <span>Mi Seguro Médico</span>
                                        </div>
                                        {(medicalSystem || currentPolizaUrl) && (
                                            <button type="button" onClick={handleDeleteInsuranceInfo} style={{ color: "#E8231A", fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center" }}>
                                                Eliminar información
                                            </button>
                                        )}
                                    </h3>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)" }}>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                            <label htmlFor="medicalSystem" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Sistema médico *</label>
                                            <select id="medicalSystem" value={medicalSystem} onChange={(e) => setMedicalSystem(e.target.value)} required style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                                onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}>
                                                <option value="">Selecciona un sistema</option>
                                                <option value="Seguro Privado (Gastos Médicos Mayores)">Seguro Privado (Gastos Médicos Mayores)</option>
                                                <option value="IMSS">IMSS</option>
                                                <option value="ISSSTE">ISSSTE</option>
                                                <option value="IMSS-BIENESTAR">IMSS-BIENESTAR</option>
                                                <option value="PEMEX">PEMEX</option>
                                                <option value="SEDENA / SEMAR">SEDENA / SEMAR</option>
                                                <option value="Sin seguro médico">Sin seguro médico</option>
                                            </select>
                                        </div>

                                        {/* CONDITIONAL RENDERINGS */}
                                        {medicalSystem === "Seguro Privado (Gastos Médicos Mayores)" && (
                                            <>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                                    <label htmlFor="aseguradora" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Aseguradora</label>
                                                    <select id="aseguradora" value={aseguradora} onChange={(e) => setAseguradora(e.target.value)} style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                                        onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}>
                                                        <option value="">Selecciona una aseguradora</option>
                                                        <option value="AXA">AXA</option>
                                                        <option value="GNP">GNP</option>
                                                        <option value="Seguros Monterrey (SMNYL)">Seguros Monterrey (SMNYL)</option>
                                                        <option value="Allianz">Allianz</option>
                                                        <option value="MetLife">MetLife</option>
                                                        <option value="Zurich">Zurich</option>
                                                        <option value="BUPA">BUPA</option>
                                                        <option value="Mapfre">Mapfre</option>
                                                        <option value="Seguros Atlas">Seguros Atlas</option>
                                                        <option value="Otro">Otro</option>
                                                    </select>
                                                </div>
                                                {aseguradora === "Otro" && (
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                                        <label htmlFor="aseguradoraOtra" style={{ fontSize: "14px", fontWeight: 600, color: "#E8231A" }}>Especificar Aseguradora *</label>
                                                        <input type="text" id="aseguradoraOtra" value={aseguradoraOtra} onChange={(e) => setAseguradoraOtra(e.target.value)} required style={{ width: "100%", display: "flex", height: "48px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "#1E1E1C", padding: "8px 16px", fontSize: "14px", transition: "all 0.2s ease-in-out" }} />
                                                    </div>
                                                )}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <label htmlFor="numeroPoliza" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Número de Póliza *</label>
                                                    <input type="text" id="numeroPoliza" value={numeroPoliza} onChange={(e) => setNumeroPoliza(e.target.value)} required style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                                        onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <label htmlFor="nombreAsegurado" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Nombre Asegurado Titular *</label>
                                                    <input type="text" id="nombreAsegurado" value={nombreAsegurado} onChange={(e) => setNombreAsegurado(e.target.value)} required style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                                        onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <label htmlFor="vigenciaPoliza" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Vigencia (Opcional)</label>
                                                    <input type="date" id="vigenciaPoliza" value={vigenciaPoliza} onChange={(e) => setVigenciaPoliza(e.target.value)} style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }} onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'} onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                                                    <label htmlFor="telefonoAseguradora" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Teléfono de Emergencias (Opcional)</label>
                                                    <input type="tel" id="telefonoAseguradora" value={telefonoAseguradora} onChange={(e) => setTelefonoAseguradora(e.target.value)} placeholder="Ej: 800-123-4567" style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                                        onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                                </div>

                                                {/* Subida de Póliza */}
                                                <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Documento Póliza (PDF, JPG, PNG)</label>
                                                        <p style={{ fontSize: "12px", color: "#9E9A95" }}>Sube el extracto de tu póliza (máx 5MB). Se mostrará a paramédicos.</p>
                                                    </div>
                                                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "16px" }}>
                                                        {polizaFile ? (
                                                            <div style={{ padding: "0 16px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "#E8231A", fontWeight: 700, fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                                                                📄 {polizaFile.name}
                                                            </div>
                                                        ) : currentPolizaUrl ? (
                                                            <div style={{ padding: "0 16px", backgroundColor: "#0A0A08", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "#F4F0EB", fontWeight: 700, fontSize: "14px", display: "flex", alignItems: "center", gap: "8px", position: "relative", overflow: "hidden" }}>
                                                                📄 Póliza Actual
                                                            </div>
                                                        ) : null}

                                                        <div style={{ width: "100%", position: "relative" }}>
                                                            <input
                                                                type="file"
                                                                accept=".pdf,image/png,image/jpeg,image/jpg"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) {
                                                                        if (file.size > 5 * 1024 * 1024) {
                                                                            alert("El archivo no debe pesar más de 5MB");
                                                                            e.target.value = '';
                                                                            return;
                                                                        }
                                                                        setPolizaFile(file);
                                                                    }
                                                                }}
                                                                style={{ width: "100%", display: "flex", height: "56px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "#1E1E1C", padding: "8px 16px", fontSize: "14px", transition: "all 0.2s ease-in-out", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", position: "relative", zIndex: 10 }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {medicalSystem === "IMSS" && (
                                            <>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <label htmlFor="nss" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>NSS - Número de Seguridad Social *</label>
                                                    <input type="text" id="nss" value={nss} onChange={(e) => setNss(e.target.value)} required maxLength={11} style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                                        onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <label htmlFor="clinicaAsignada" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>UMF / Clínica asignada (Opcional)</label>
                                                    <input type="text" id="clinicaAsignada" value={clinicaAsignada} onChange={(e) => setClinicaAsignada(e.target.value)} placeholder="Ej: UMF 28, Monterrey" style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                                        onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                                                    <label htmlFor="curpSeguro" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>CURP (Opcional)</label>
                                                    <input type="text" id="curpSeguro" value={curpSeguro} onChange={(e) => setCurpSeguro(e.target.value.toUpperCase())} maxLength={18} style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                                        onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                                </div>
                                            </>
                                        )}

                                        {medicalSystem === "ISSSTE" && (
                                            <>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                                                    <label htmlFor="numeroAfiliacion" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Número de afiliación ISSSTE *</label>
                                                    <input type="text" id="numeroAfiliacion" value={numeroAfiliacion} onChange={(e) => setNumeroAfiliacion(e.target.value)} required style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                                        onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <label htmlFor="clinicaAsignada" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Clínica asignada (Opcional)</label>
                                                    <input type="text" id="clinicaAsignada" value={clinicaAsignada} onChange={(e) => setClinicaAsignada(e.target.value)} style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                                        onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <label htmlFor="curpSeguro" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>CURP (Opcional)</label>
                                                    <input type="text" id="curpSeguro" value={curpSeguro} onChange={(e) => setCurpSeguro(e.target.value.toUpperCase())} maxLength={18} style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                                        onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                                </div>
                                            </>
                                        )}

                                        {medicalSystem === "IMSS-BIENESTAR" && (
                                            <>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <label htmlFor="curpSeguro" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>CURP *</label>
                                                    <input type="text" id="curpSeguro" value={curpSeguro} onChange={(e) => setCurpSeguro(e.target.value.toUpperCase())} required maxLength={18} style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                                        onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <label htmlFor="clinicaAsignada" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Centro de salud asignado (Opcional)</label>
                                                    <input type="text" id="clinicaAsignada" value={clinicaAsignada} onChange={(e) => setClinicaAsignada(e.target.value)} style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                                        onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                                </div>
                                            </>
                                        )}

                                        {(medicalSystem === "PEMEX" || medicalSystem === "SEDENA / SEMAR") && (
                                            <>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <label htmlFor="numeroAfiliacion" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Número de afiliación *</label>
                                                    <input type="text" id="numeroAfiliacion" value={numeroAfiliacion} onChange={(e) => setNumeroAfiliacion(e.target.value)} required style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                                        onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <label htmlFor="clinicaAsignada" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Unidad médica asignada (Opcional)</label>
                                                    <input type="text" id="clinicaAsignada" value={clinicaAsignada} onChange={(e) => setClinicaAsignada(e.target.value)} style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                                        onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                                </div>
                                            </>
                                        )}

                                        {medicalSystem === "Sin seguro médico" && (
                                            <div style={{ padding: "16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", fontSize: "14px", color: "#9E9A95" }}>
                                                <p style={{ fontWeight: 600, color: "#F4F0EB" }}>Aviso:</p>
                                                En caso de emergencia serás atendido en el hospital público más cercano. Te recomendamos considerar un seguro de gastos médicos mayores para una mejor atención.
                                            </div>
                                        )}

                                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", padding: "16px" }}>
                                            <input type="checkbox" id="organDonor" checked={organDonor} onChange={(e) => setOrganDonor(e.target.checked)} style={{ width: "20px", height: "20px", borderRadius: "4px", color: "#E8231A" }} />
                                            <label htmlFor="organDonor" style={{ fontSize: "14px", fontWeight: 600 }}>Soy donante oficial de órganos</label>
                                        </div>

                                    </div>
                                </section>

                                {/* NOTAS Y UBICACIÓN */}
                                <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <h3 style={{ fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", marginBottom: "16px", color: "#F4F0EB" }}>
                                        <span style={{ backgroundColor: "rgba(232,35,26,0.12)", color: "#E8231A", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0, fontWeight: 600 }}>5</span>
                                        Notas y Ubicación
                                    </h3>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "24px" }}>
                                        <input type="checkbox" id="isMotorcyclist" checked={isMotorcyclist} onChange={(e) => setIsMotorcyclist(e.target.checked)} style={{ width: "20px", height: "20px", borderRadius: "4px", color: "#E8231A" }} />
                                        <label htmlFor="isMotorcyclist" style={{ fontSize: "14px", fontWeight: 700, color: "#E8231A" }}>Mostrar Alerta de "No Retirar Casco" (Motociclistas)</label>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                                            <label htmlFor="additionalNotes" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Notas Adicionales</label>
                                            <textarea id="additionalNotes" value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} style={{ width: "100%", display: "flex", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "#1E1E1C", padding: "0 16px", fontSize: "14px", transition: "all 0.2s ease-in-out" }} />
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label htmlFor="googleMapsLink" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Hospital o clínica de preferencia</label>
                                                <input type="text" id="googleMapsLink" value={googleMapsLink} onChange={(e) => setGoogleMapsLink(e.target.value)} style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                                    onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} placeholder="Ejemplo: Hospital Ángeles Lindavista" />
                                                <p style={{ fontSize: "12px", color: "#9E9A95" }}>En caso de emergencia, el personal médico determinará el hospital más adecuado según tu estado de salud y criterio profesional. Este dato es solo una referencia.</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <button type="submit" disabled={saving} style={{ marginTop: '32px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#E8231A', color: '#fff', height: '64px', borderRadius: '16px', fontSize: '20px', fontWeight: 900, border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}>
                                    {saving ? <Loader2 size={24} /> : <CheckCircle2 size={24} />}
                                    {saving ? "Guardando Cambios..." : "Guardar Cambios"}
                                </button>
                            </form>

                            {/* HISTORIAL DE ACCESOS */}
                            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                <h3 style={{ fontSize: "20px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                                    <span style={{ backgroundColor: "rgba(232,35,26,0.12)", color: "#E8231A", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0, fontWeight: 600 }}>6</span>
                                    Historial de Accesos al Chip
                                </h3>

                                {loadingLogs ? (
                                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "32px 0" }}>
                                        <Loader2 style={{ color: "#E8231A" }} size={32} />
                                    </div>
                                ) : accessLogs.length === 0 ? (
                                    <div style={{ borderRadius: "16px", padding: "24px", textAlign: "center", color: "#9E9A95", border: "1px solid rgba(255,255,255,0.08)" }}>
                                        No hay registros de acceso a tu chip todavía.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {accessLogs.map((log) => {
                                            const isExpanded = expandedLogId === log.id;
                                            return (
                                                <div key={log.id} >

                                                    <div style={{ padding: "16px", display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
                                                        <div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                <span >
                                                                    {log.tipo}
                                                                </span>
                                                                <span style={{ fontSize: "14px", fontWeight: 600, color: "#F4F0EB" }}>
                                                                    {new Date(log.created_at + (log.created_at.endsWith('Z') ? '' : 'Z')).toLocaleString('es-MX', {
                                                                        timeZone: 'America/Mexico_City',
                                                                        year: 'numeric',
                                                                        month: 'short',
                                                                        day: '2-digit',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                        second: '2-digit'
                                                                    })}
                                                                </span>
                                                            </div>
                                                            <p style={{ fontSize: "14px", color: "#9E9A95" }}>
                                                                {log.latitud && log.longitud ? (
                                                                    <a href={`https://www.google.com/maps?q=${log.latitud},${log.longitud}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", color: "#E8231A" }}>
                                                                        Ver ubicación <ExternalLink size={12} />
                                                                    </a>
                                                                ) : (
                                                                    "Ubicación no disponible"
                                                                )}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                                            style={{ fontSize: "12px", fontWeight: 600, backgroundColor: "#1A1A18", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", transition: "color 0.2s, background-color 0.2s, border-color 0.2s" }}
                                                            type="button"
                                                        >
                                                            {isExpanded ? "Ocultar" : "Más detalles"}
                                                        </button>
                                                    </div>

                                                    {isExpanded && (
                                                        <div style={{ padding: "16px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px", color: "#9E9A95" }}>
                                                            <p><strong>IP:</strong> {log.ip_address || 'Desconocida'}</p>
                                                            <p><strong>Dispositivo:</strong> {log.user_agent || 'Desconocido'}</p>
                                                            <p><strong>Token:</strong> {log.session_token || 'N/A'}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div >
    );
}
