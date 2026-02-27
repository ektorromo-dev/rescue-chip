"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2, LogOut, LayoutDashboard, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
    const router = useRouter();
    const supabase = createClient();

    const [loadingAuth, setLoadingAuth] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Device detection state
    const [deviceVerificationStatus, setDeviceVerificationStatus] = useState<"checking" | "pending" | "verified" | "revoked">("checking");
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

    useEffect(() => {
        let pollingInterval: NodeJS.Timeout;

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
                    body: JSON.stringify({ deviceId: localDeviceId })
                });
            } catch (e) {
                console.error("Error pidiendo verif por correo", e);
            }
            return false;
        };

        const fetchUserData = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.replace("/login");
                return;
            }

            // --- MANEJO DE NUEVO DISPOSITIVO POR EMAIL ---
            let currentDeviceId = localStorage.getItem("rescuechip_device_id");
            if (!currentDeviceId) {
                currentDeviceId = crypto.randomUUID();
                localStorage.setItem("rescuechip_device_id", currentDeviceId);
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

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
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
                })
                .eq('id', profileId);

            if (updateError) {
                throw new Error("No se pudieron guardar los cambios: " + updateError.message);
            }

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

    if (loadingAuth) {
        return (
            <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
                <Loader2 size={48} className="animate-spin text-primary/30 mb-4" />
                <p className="font-medium animate-pulse text-muted-foreground">
                    {deviceVerificationStatus === "pending" || deviceVerificationStatus === "checking"
                        ? "Verificando seguridad del dispositivo..."
                        : "Cargando tu panel de control..."}
                </p>
            </div>
        );
    }

    if (deviceVerificationStatus === "pending") {
        return (
            <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
                <div className="bg-card w-full max-w-md p-10 rounded-[2rem] shadow-2xl border border-primary/20 text-center animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-primary/10 text-primary mx-auto rounded-full flex items-center justify-center mb-8 shadow-inner relative">
                        <Loader2 size={48} className="animate-spin absolute opacity-20" />
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z"></path><path d="m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10"></path></svg>
                    </div>
                    <h2 className="text-2xl font-black tracking-tight mb-4">Verifica tu correo</h2>
                    <p className="text-muted-foreground font-medium mb-6 leading-relaxed">
                        Por seguridad, hemos enviado un enlace de autorización temporal a tu correo electrónico.
                    </p>
                    <div className="p-4 bg-yellow-500/10 rounded-xl text-yellow-700 text-sm font-semibold flex flex-col gap-2 items-center mb-2">
                        <span>Abre tu correo y haz clic en "Permitir acceso".</span>
                        <span className="text-xs opacity-70">Revisaremos automáticamente...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-0 md:p-4">
            <div className="w-full max-w-3xl bg-card md:rounded-[2.5rem] shadow-2xl border-x md:border border-border/50 overflow-hidden">
                {/* Header */}
                <div className="bg-destructive px-8 pt-10 pb-12 text-destructive-foreground relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

                    <div className="flex justify-between items-center mb-8 relative z-10 w-full">
                        <Link href="/" className="inline-flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full text-white/90 hover:bg-white/30 hover:text-white transition-colors font-medium text-xs uppercase tracking-wider">
                            <ArrowLeft size={16} /> Volver
                        </Link>
                        <button onClick={handleSignOut} className="inline-flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full text-white/90 hover:bg-white/30 hover:text-white transition-colors font-medium text-xs uppercase tracking-wider">
                            Cerrar Sesión <LogOut size={16} />
                        </button>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3 relative z-10 flex items-center gap-3">
                        <LayoutDashboard size={40} className="hidden sm:block" />
                        Mi Panel de Control
                    </h1>
                    <p className="text-white/90 relative z-10 text-lg md:text-xl font-medium max-w-lg">
                        Actualiza tu información médica en cualquier momento.
                    </p>
                </div>

                <div className="p-8 md:p-12 -mt-6 rounded-t-[2.5rem] relative z-20 bg-card">

                    {errorMsg && (
                        <div className="mb-8 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm font-semibold flex items-center gap-2">
                            <AlertCircle size={18} /> {errorMsg}
                        </div>
                    )}

                    {successMsg && (
                        <div className="mb-8 p-4 bg-green-500/10 text-green-700 border border-green-500/20 rounded-xl text-sm font-semibold flex items-center gap-2">
                            <CheckCircle2 size={18} /> {successMsg}
                        </div>
                    )}

                    {!profileId ? (
                        <div className="text-center py-6 mb-8 bg-primary/5 rounded-2xl border border-primary/20">
                            <p className="text-muted-foreground text-lg mb-3">No tienes un perfil médico vinculado todavía.</p>
                            <Link href="/activate" className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold hover:bg-primary/90 transition-colors">Activar Nuevo Chip</Link>
                        </div>
                    ) : (
                        <>
                            <form onSubmit={handleUpdate} className="space-y-10">

                                {/* ENLACE PUBLICO */}
                                {folio && (
                                    <section className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div>
                                            <h3 className="font-bold text-primary mb-1 flex items-center gap-2">
                                                <CheckCircle2 size={18} /> Chips Vinculados: {folio.toUpperCase()}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">Este es el enlace al que accederán los paramédicos al escanear uno de tus chips.</p>

                                            {/* Restricción de Perfil Compartido */}
                                            {(window as any)._sharedProfileFlag && (
                                                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded max-w-xl">
                                                    <p className="text-xs text-blue-800 font-semibold mb-1 flex items-center gap-1"><AlertCircle size={14} /> Perfil Compartido</p>
                                                    <p className="text-xs text-muted-foreground">La configuración maestra y control de desvinculación de este chip es manejada por otra persona. Si precisas desligar este chip contáctanos.</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
                                            <a href={`/profile/${folio.split(',')[0].trim()}`} target="_blank" rel="noopener noreferrer"
                                                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-center flex items-center justify-center gap-2 whitespace-nowrap">
                                                Ver mi Perfil Público
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                            </a>
                                        </div>
                                    </section>
                                )}

                                {/* IDENTIFICACIÓN */}
                                <section className="space-y-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2 border-b border-border pb-2">
                                        <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                                        Identificación
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-4 md:col-span-2 mt-2 mb-4">
                                            <label className="text-sm font-semibold">Foto de Perfil</label>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                                {photoFile ? (
                                                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary bg-muted shrink-0 shadow-md">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={URL.createObjectURL(photoFile)} alt="Preview" className="w-full h-full object-cover" />
                                                    </div>
                                                ) : currentPhotoUrl ? (
                                                    <div className="w-20 h-20 rounded-2xl border-2 border-border/50 bg-muted shrink-0 shadow-sm relative group">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={currentPhotoUrl} alt="Foto actual" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <span className="text-[10px] text-white font-bold">Actual</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-muted-foreground flex items-center justify-center bg-muted/50 text-muted-foreground shrink-0 text-2xl">
                                                        📷
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            if (e.target.files && e.target.files[0]) {
                                                                setPhotoFile(e.target.files[0]);
                                                            }
                                                        }}
                                                        className="w-full flex h-14 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer shadow-sm"
                                                    />
                                                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed font-medium">Sube una nueva foto si deseas cambiar la actual.</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label htmlFor="fullName" className="text-sm font-semibold">Nombre Completo *</label>
                                            <input type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" required />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="age" className="text-sm font-semibold">Edad</label>
                                            <input type="number" id="age" value={age} onChange={(e) => setAge(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" min="0" max="130" />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="location" className="text-sm font-semibold">Ciudad / País *</label>
                                            <input type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" required />
                                        </div>
                                    </div>
                                </section>

                                {/* CONTACTOS DE EMERGENCIA */}
                                <section className="space-y-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2 border-b border-border pb-2">
                                        <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                                        Contactos de Emergencia
                                    </h3>

                                    <div className="p-4 border border-border rounded-xl space-y-4 bg-muted/20">
                                        <h4 className="text-sm font-bold text-primary">Contacto 1 (Requerido)</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-muted-foreground">Nombre</label>
                                                <input type="text" value={contact1Name} onChange={(e) => setContact1Name(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" required />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-muted-foreground">Teléfono</label>
                                                <input type="tel" value={contact1Phone} onChange={(e) => setContact1Phone(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" required />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-sm font-semibold text-muted-foreground">Email (Opcional, para recibir alertas)</label>
                                                <input type="email" value={contact1Email} onChange={(e) => setContact1Email(e.target.value)} placeholder="Email del contacto" className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 border border-border rounded-xl space-y-4 bg-muted/10">
                                        <h4 className="text-sm font-bold opacity-70">Contacto 2 (Opcional)</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-muted-foreground">Nombre</label>
                                                <input type="text" value={contact2Name} onChange={(e) => setContact2Name(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-muted-foreground">Teléfono</label>
                                                <input type="tel" value={contact2Phone} onChange={(e) => setContact2Phone(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-sm font-semibold text-muted-foreground">Email (Opcional, para recibir alertas)</label>
                                                <input type="email" value={contact2Email} onChange={(e) => setContact2Email(e.target.value)} placeholder="Email del contacto" className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 border border-border rounded-xl space-y-4 bg-muted/10">
                                        <h4 className="text-sm font-bold opacity-70">Contacto 3 (Opcional)</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-muted-foreground">Nombre</label>
                                                <input type="text" value={contact3Name} onChange={(e) => setContact3Name(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-muted-foreground">Teléfono</label>
                                                <input type="tel" value={contact3Phone} onChange={(e) => setContact3Phone(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-sm font-semibold text-muted-foreground">Email (Opcional, para recibir alertas)</label>
                                                <input type="email" value={contact3Email} onChange={(e) => setContact3Email(e.target.value)} placeholder="Email del contacto" className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* INFORMACIÓN MÉDICA */}
                                <section className="space-y-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2 border-b border-border pb-2">
                                        <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
                                        Información Médica
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label htmlFor="bloodType" className="text-sm font-semibold">Tipo de Sangre *</label>
                                            <select id="bloodType" value={bloodType} onChange={(e) => setBloodType(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" required>
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
                                        <div className="space-y-2 md:col-span-2">
                                            <label htmlFor="allergies" className="text-sm font-semibold">Alergias Conocidas</label>
                                            <input type="text" id="allergies" value={allergies} onChange={(e) => setAllergies(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label htmlFor="medicalConditions" className="text-sm font-semibold">Condiciones Médicas</label>
                                            <textarea id="medicalConditions" value={medicalConditions} onChange={(e) => setMedicalConditions(e.target.value)} className="w-full flex min-h-[100px] rounded-xl border border-input bg-background px-4 py-3 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label htmlFor="importantMedications" className="text-sm font-semibold">Medicamentos Importantes</label>
                                            <textarea id="importantMedications" value={importantMedications} onChange={(e) => setImportantMedications(e.target.value)} className="w-full flex min-h-[100px] rounded-xl border border-input bg-background px-4 py-3 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                        </div>
                                    </div>
                                </section>

                                {/* MI SEGURO MÉDICO (UNIFIED) */}
                                <section className="space-y-4">
                                    <h3 className="text-xl font-bold flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-2 gap-4">
                                        <div className="flex items-center gap-3">
                                            <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0">4</span>
                                            <span>Mi Seguro Médico</span>
                                        </div>
                                        {(medicalSystem || currentPolizaUrl) && (
                                            <button type="button" onClick={handleDeleteInsuranceInfo} className="text-destructive text-sm font-bold flex items-center gap-1 hover:underline shrink-0">
                                                Eliminar información
                                            </button>
                                        )}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-5 rounded-2xl border border-border">
                                        <div className="space-y-2 lg:col-span-2">
                                            <label htmlFor="medicalSystem" className="text-sm font-semibold">Sistema médico *</label>
                                            <select id="medicalSystem" value={medicalSystem} onChange={(e) => setMedicalSystem(e.target.value)} required className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all">
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
                                                <div className="space-y-2 lg:col-span-2">
                                                    <label htmlFor="aseguradora" className="text-sm font-semibold">Aseguradora</label>
                                                    <select id="aseguradora" value={aseguradora} onChange={(e) => setAseguradora(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all">
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
                                                    <div className="space-y-2 animate-in fade-in duration-300 md:col-span-2">
                                                        <label htmlFor="aseguradoraOtra" className="text-sm font-semibold text-primary">Especificar Aseguradora *</label>
                                                        <input type="text" id="aseguradoraOtra" value={aseguradoraOtra} onChange={(e) => setAseguradoraOtra(e.target.value)} required className="w-full flex h-12 rounded-xl border border-primary/50 bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                                    </div>
                                                )}
                                                <div className="space-y-2">
                                                    <label htmlFor="numeroPoliza" className="text-sm font-semibold">Número de Póliza *</label>
                                                    <input type="text" id="numeroPoliza" value={numeroPoliza} onChange={(e) => setNumeroPoliza(e.target.value)} required className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label htmlFor="nombreAsegurado" className="text-sm font-semibold">Nombre Asegurado Titular *</label>
                                                    <input type="text" id="nombreAsegurado" value={nombreAsegurado} onChange={(e) => setNombreAsegurado(e.target.value)} required className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label htmlFor="vigenciaPoliza" className="text-sm font-semibold">Vigencia (Opcional)</label>
                                                    <input type="date" id="vigenciaPoliza" value={vigenciaPoliza} onChange={(e) => setVigenciaPoliza(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all text-foreground" style={{ colorScheme: 'dark' }} />
                                                </div>
                                                <div className="space-y-2 md:col-span-2">
                                                    <label htmlFor="telefonoAseguradora" className="text-sm font-semibold">Teléfono de Emergencias (Opcional)</label>
                                                    <input type="tel" id="telefonoAseguradora" value={telefonoAseguradora} onChange={(e) => setTelefonoAseguradora(e.target.value)} placeholder="Ej: 800-123-4567" className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                                </div>

                                                {/* Subida de Póliza */}
                                                <div className="space-y-4 md:col-span-2 mt-4 pt-4 border-t border-border/50">
                                                    <div>
                                                        <label className="text-sm font-semibold">Documento Póliza (PDF, JPG, PNG)</label>
                                                        <p className="text-xs text-muted-foreground mt-1">Sube el extracto de tu póliza (máx 5MB). Se mostrará a paramédicos.</p>
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                                        {polizaFile ? (
                                                            <div className="px-4 py-3 bg-primary/10 border border-primary/20 rounded-xl text-primary font-bold text-sm flex items-center gap-2">
                                                                📄 {polizaFile.name}
                                                            </div>
                                                        ) : currentPolizaUrl ? (
                                                            <div className="px-4 py-3 bg-background border border-border rounded-xl text-foreground font-bold text-sm flex items-center gap-2 relative group overflow-hidden">
                                                                📄 Póliza Actual
                                                            </div>
                                                        ) : null}

                                                        <div className="flex-1 w-full relative">
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
                                                                className="w-full flex h-14 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer shadow-sm relative z-10"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {medicalSystem === "IMSS" && (
                                            <>
                                                <div className="space-y-2">
                                                    <label htmlFor="nss" className="text-sm font-semibold">NSS - Número de Seguridad Social *</label>
                                                    <input type="text" id="nss" value={nss} onChange={(e) => setNss(e.target.value)} required maxLength={11} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label htmlFor="clinicaAsignada" className="text-sm font-semibold">UMF / Clínica asignada (Opcional)</label>
                                                    <input type="text" id="clinicaAsignada" value={clinicaAsignada} onChange={(e) => setClinicaAsignada(e.target.value)} placeholder="Ej: UMF 28, Monterrey" className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                                </div>
                                                <div className="space-y-2 md:col-span-2">
                                                    <label htmlFor="curpSeguro" className="text-sm font-semibold">CURP (Opcional)</label>
                                                    <input type="text" id="curpSeguro" value={curpSeguro} onChange={(e) => setCurpSeguro(e.target.value.toUpperCase())} maxLength={18} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all uppercase" />
                                                </div>
                                            </>
                                        )}

                                        {medicalSystem === "ISSSTE" && (
                                            <>
                                                <div className="space-y-2 md:col-span-2">
                                                    <label htmlFor="numeroAfiliacion" className="text-sm font-semibold">Número de afiliación ISSSTE *</label>
                                                    <input type="text" id="numeroAfiliacion" value={numeroAfiliacion} onChange={(e) => setNumeroAfiliacion(e.target.value)} required className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label htmlFor="clinicaAsignada" className="text-sm font-semibold">Clínica asignada (Opcional)</label>
                                                    <input type="text" id="clinicaAsignada" value={clinicaAsignada} onChange={(e) => setClinicaAsignada(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label htmlFor="curpSeguro" className="text-sm font-semibold">CURP (Opcional)</label>
                                                    <input type="text" id="curpSeguro" value={curpSeguro} onChange={(e) => setCurpSeguro(e.target.value.toUpperCase())} maxLength={18} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all uppercase" />
                                                </div>
                                            </>
                                        )}

                                        {medicalSystem === "IMSS-BIENESTAR" && (
                                            <>
                                                <div className="space-y-2">
                                                    <label htmlFor="curpSeguro" className="text-sm font-semibold">CURP *</label>
                                                    <input type="text" id="curpSeguro" value={curpSeguro} onChange={(e) => setCurpSeguro(e.target.value.toUpperCase())} required maxLength={18} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all uppercase" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label htmlFor="clinicaAsignada" className="text-sm font-semibold">Centro de salud asignado (Opcional)</label>
                                                    <input type="text" id="clinicaAsignada" value={clinicaAsignada} onChange={(e) => setClinicaAsignada(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                                </div>
                                            </>
                                        )}

                                        {(medicalSystem === "PEMEX" || medicalSystem === "SEDENA / SEMAR") && (
                                            <>
                                                <div className="space-y-2">
                                                    <label htmlFor="numeroAfiliacion" className="text-sm font-semibold">Número de afiliación *</label>
                                                    <input type="text" id="numeroAfiliacion" value={numeroAfiliacion} onChange={(e) => setNumeroAfiliacion(e.target.value)} required className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label htmlFor="clinicaAsignada" className="text-sm font-semibold">Unidad médica asignada (Opcional)</label>
                                                    <input type="text" id="clinicaAsignada" value={clinicaAsignada} onChange={(e) => setClinicaAsignada(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                                </div>
                                            </>
                                        )}

                                        {medicalSystem === "Sin seguro médico" && (
                                            <div className="col-span-1 md:col-span-2 p-4 bg-muted/50 rounded-xl border border-border text-sm text-muted-foreground">
                                                <p className="font-semibold text-foreground mb-1">Aviso:</p>
                                                En caso de emergencia serás atendido en el hospital público más cercano. Te recomendamos considerar un seguro de gastos médicos mayores para una mejor atención.
                                            </div>
                                        )}

                                        <div className="space-y-2 flex items-center gap-3 pt-6 rounded-xl border border-border p-4 bg-muted/20 md:col-span-2">
                                            <input type="checkbox" id="organDonor" checked={organDonor} onChange={(e) => setOrganDonor(e.target.checked)} className="w-5 h-5 rounded border-input accent-primary text-primary" />
                                            <label htmlFor="organDonor" className="text-sm font-semibold cursor-pointer">Soy donante oficial de órganos</label>
                                        </div>

                                    </div>
                                </section>

                                {/* NOTAS Y UBICACIÓN */}
                                <section className="space-y-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2 border-b border-border pb-2">
                                        <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">5</span>
                                        Notas y Ubicación
                                    </h3>

                                    <div className="space-y-2 flex items-center gap-3 pt-2 rounded-xl border border-primary/30 p-5 bg-primary/5 mb-6">
                                        <input type="checkbox" id="isMotorcyclist" checked={isMotorcyclist} onChange={(e) => setIsMotorcyclist(e.target.checked)} className="w-5 h-5 rounded border-input accent-primary text-primary" />
                                        <label htmlFor="isMotorcyclist" className="text-sm font-bold cursor-pointer text-primary">Mostrar Alerta de "No Retirar Casco" (Motociclistas)</label>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2 md:col-span-2">
                                            <label htmlFor="additionalNotes" className="text-sm font-semibold">Notas Adicionales</label>
                                            <textarea id="additionalNotes" value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} className="w-full flex min-h-[100px] rounded-xl border border-input bg-background px-4 py-3 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                        </div>
                                        <div className="space-y-4 md:col-span-2 mt-2">
                                            <div className="space-y-2">
                                                <label htmlFor="googleMapsLink" className="text-sm font-semibold">Hospital o clínica de preferencia</label>
                                                <input type="text" id="googleMapsLink" value={googleMapsLink} onChange={(e) => setGoogleMapsLink(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Ejemplo: Hospital Ángeles Lindavista" />
                                                <p className="text-xs text-muted-foreground mt-1">En caso de emergencia, el personal médico determinará el hospital más adecuado según tu estado de salud y criterio profesional. Este dato es solo una referencia.</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground h-16 rounded-2xl text-xl font-black hover:scale-[1.02] hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 mt-8 disabled:opacity-70 disabled:pointer-events-none disabled:transform-none">
                                    {saving ? <Loader2 size={24} className="animate-spin" /> : <CheckCircle2 size={24} />}
                                    {saving ? "Guardando Cambios..." : "Guardar Cambios"}
                                </button>
                            </form>

                            {/* HISTORIAL DE ACCESOS */}
                            <div className="mt-12 border-t border-border pt-8 pb-12">
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                                    <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">6</span>
                                    Historial de Accesos al Chip
                                </h3>

                                {loadingLogs ? (
                                    <div className="flex justify-center items-center py-8">
                                        <Loader2 className="animate-spin text-primary" size={32} />
                                    </div>
                                ) : accessLogs.length === 0 ? (
                                    <div className="bg-muted/50 rounded-2xl p-6 text-center text-muted-foreground border border-border">
                                        No hay registros de acceso a tu chip todavía.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {accessLogs.map((log) => {
                                            const isExpanded = expandedLogId === log.id;
                                            return (
                                                <div key={log.id} className={`rounded-xl border ${log.tipo === 'emergencia' ? 'bg-destructive/10 border-destructive/30' : 'bg-card border-border'} overflow-hidden`}>
                                                    <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${log.tipo === 'emergencia' ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground'}`}>
                                                                    {log.tipo}
                                                                </span>
                                                                <span className="text-sm font-semibold text-foreground">
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
                                                            <p className="text-sm text-muted-foreground">
                                                                {log.latitud && log.longitud ? (
                                                                    <a href={`https://www.google.com/maps?q=${log.latitud},${log.longitud}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                                                                        Ver ubicación <ExternalLink size={12} />
                                                                    </a>
                                                                ) : (
                                                                    "Ubicación no disponible"
                                                                )}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                                            className="text-xs font-semibold bg-background hover:bg-muted border border-input px-3 py-1.5 rounded-md transition-colors"
                                                            type="button"
                                                        >
                                                            {isExpanded ? "Ocultar" : "Más detalles"}
                                                        </button>
                                                    </div>

                                                    {isExpanded && (
                                                        <div className="p-4 border-t border-border/50 bg-background/50 space-y-2 text-xs font-mono text-muted-foreground break-all">
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
