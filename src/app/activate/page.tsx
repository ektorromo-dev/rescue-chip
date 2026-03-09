"use client";
export const dynamic = 'force-dynamic';


import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { sanitizeProfileInput } from "@/app/actions/sanitize";

function ActivationFormContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const supabase = createClient();

    const folioFromUrl = searchParams.get("folio") || "";

    const [folio, setFolio] = useState(folioFromUrl);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [isMotorcyclist, setIsMotorcyclist] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [phone, setPhone] = useState("");
    const [whatsappOptedIn, setWhatsappOptedIn] = useState(true);

    // Estado del flujo "Chip extra"
    const [existingProfileToLink, setExistingProfileToLink] = useState<any>(null);
    const [showLinkPrompt, setShowLinkPrompt] = useState(false);
    const [pendingAuthData, setPendingAuthData] = useState<{ userId: string, email: string } | null>(null);
    const [pendingChip, setPendingChip] = useState<any>(null);

    // Insurance state for conditional rendering
    const [medicalSystem, setMedicalSystem] = useState("");
    const [aseguradora, setAseguradora] = useState("");
    const [polizaFile, setPolizaFile] = useState<File | null>(null);

    // Pre-validación en carga
    const [isLoadingPreCheck, setIsLoadingPreCheck] = useState(false);
    const [preValidationError, setPreValidationError] = useState("");

    // Rate Limit State
    const [isLockedOut, setIsLockedOut] = useState(false);
    const [lockCountdown, setLockCountdown] = useState(0);

    useEffect(() => {
        if (folioFromUrl) {
            setFolio(folioFromUrl);
            const validateChipStatus = async () => {
                setIsLoadingPreCheck(true);
                try {
                    const cleanFolio = folioFromUrl.trim();
                    const res = await fetch(`/api/activate/validate?folio=${encodeURIComponent(cleanFolio)}`);
                    const data = await res.json();

                    if (!res.ok) {
                        if (res.status === 429) {
                            setIsLockedOut(true);
                            setLockCountdown(60 * 60); // 1 hora

                            const interval = setInterval(() => {
                                setLockCountdown((prev) => {
                                    if (prev <= 1) {
                                        clearInterval(interval);
                                        setIsLockedOut(false);
                                        return 0;
                                    }
                                    return prev - 1;
                                });
                            }, 1000);
                            return;
                        }
                        setPreValidationError(data.error || 'Este folio no es válido o ya fue activado.');
                    }
                } catch (e) {
                    console.error("Error validando el chip al cargar", e);
                } finally {
                    setIsLoadingPreCheck(false);
                }
            };
            validateChipStatus();
        }
    }, [folioFromUrl]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        const formData = new FormData(e.currentTarget);

        if (phone.length < 10) {
            setErrorMsg("El número de celular debe tener 10 dígitos.");
            setLoading(false);
            return;
        }

        try {
            // Limpiar el folio de espacios innecesarios
            const cleanFolio = folio.trim();
            console.log("Activación - Buscando chip con folio:", cleanFolio);

            // 1. Verify chip exists and is not activated using the server endpoint
            const activationRes = await fetch(`/api/activate/validate?folio=${encodeURIComponent(cleanFolio)}`);
            const activationData = await activationRes.json();

            if (!activationRes.ok) {
                if (activationRes.status === 429) {
                    setIsLockedOut(true);
                    setLockCountdown(60 * 60); // 1 hora

                    const interval = setInterval(() => {
                        setLockCountdown((prev) => {
                            if (prev <= 1) {
                                clearInterval(interval);
                                setIsLockedOut(false);
                                return 0;
                            }
                            return prev - 1;
                        });
                    }, 1000);
                    setLoading(false);
                    return;
                }
                throw new Error(activationData.error || "Este folio no es válido o ya fue activado.");
            }

            // Retrive chip for possible subsequent references if needed
            const chip = activationData.chip;

            // 1.5 Try Sign Up or Sign In
            const email = formData.get("email") as string;
            const password = formData.get("password") as string;

            if (!email || !password) {
                throw new Error("El correo electrónico y la contraseña son obligatorios para crear tu cuenta o iniciar sesión.");
            }

            let userId = "";

            // Intento de registro
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (signUpError) {
                if (signUpError.message.includes("User already registered") || signUpError.message.toLowerCase().includes("already registered")) {
                    // Si ya existe y es este flujo, intentemos hacer login para vincular
                    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                        email,
                        password,
                    });
                    if (signInError) {
                        throw new Error("El usuario ya existe, pero la contraseña es incorrecta. Si ya tienes cuenta, ingresa tu contraseña correctamente.");
                    }
                    userId = signInData.user?.id || "";
                } else {
                    throw new Error("Error al crear cuenta: " + signUpError.message);
                }
            } else {
                userId = signUpData.user?.id || "";

                // Asegurar que exista una sesión activa explícita antes de interactuar con tablas RLS (profiles)
                if (!signUpData.session) {
                    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                        email,
                        password,
                    });
                    if (signInError) {
                        throw new Error("Cuenta creada, pero hubo un error de sesión: " + signInError.message + ". Intenta iniciar sesión manualmente.");
                    }
                    if (!signInData.session) {
                        throw new Error("Falló la sesión automática posterior a la creación de cuenta.");
                    }
                }

                // Delay corto para asegurar que Supabase propague las credenciales Auth internamente
                await new Promise(resolve => setTimeout(resolve, 800));
            }

            if (!userId) {
                throw new Error("No se pudo confirmar la cuenta.");
            }

            // NUEVA LÓGICA: Verificar activamente folios vinculados antes de intentar registrar un perfil nuevo
            const { data: userProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', userId)
                .limit(1)
                .maybeSingle();

            if (userProfile) {
                const { count: chipsCount, error: countError } = await supabase
                    .from('chips')
                    .select('*', { count: 'exact', head: true })
                    .eq('owner_profile_id', userProfile.id);

                console.log(`Verificación multi-chip (Pre-registro): El usuario tiene ${chipsCount || 0} chips vinculados a su perfil.`);

                if (chipsCount && chipsCount > 0) {
                    // El usuario YA tiene chips. Interceptamos el flujo pidiendo confirmación.
                    setPendingAuthData({ userId, email });
                    setPendingChip(chip);
                    setExistingProfileToLink(userProfile);
                    setShowLinkPrompt(true);
                    setLoading(false);
                    return; // Detenemos la ejecución aquí, el modal tomará el control.
                }
            }

            // Si no tiene perfil o no tiene chips, procedemos a crear un perfil nuevo/único.
            await proceedWithRegistration(userId, chip, formData, email);

        } catch (err: any) {
            console.error("Error detallado en handleSubmit:", err);
            setErrorMsg(err.message || "Ocurrió un error inesperado.");
            setLoading(false);
        }
    };

    const proceedWithRegistration = async (userId: string, chip: any, formData: FormData, email: string) => {
        try {
            // ================= CONTINUAR FLUJO NORMAL DE REGISTRO =================
            // Build emergency contacts array dynamically
            const emergencyContacts = [];

            // Contact 1 (Required)
            emergencyContacts.push({
                name: formData.get("contact1Name") as string,
                phone: formData.get("contact1Phone") as string,
                email: formData.get("contact1Email") as string || ""
            });

            // Contact 2 (Optional)
            const contact2Name = formData.get("contact2Name") as string;
            const contact2Phone = formData.get("contact2Phone") as string;
            if (contact2Name && contact2Phone) {
                emergencyContacts.push({ name: contact2Name, phone: contact2Phone, email: formData.get("contact2Email") as string || "" });
            }

            // Contact 3 (Optional)
            const contact3Name = formData.get("contact3Name") as string;
            const contact3Phone = formData.get("contact3Phone") as string;
            if (contact3Name && contact3Phone) {
                emergencyContacts.push({ name: contact3Name, phone: contact3Phone, email: formData.get("contact3Email") as string || "" });
            }

            // Optional integer parsing
            const ageStr = formData.get("age") as string;
            const age = ageStr ? parseInt(ageStr, 10) : null;

            // Optional boolean parsing
            const organDonor = formData.get("organDonor") === "on";

            let photoUrl = null;
            if (photoFile) {
                const fileExt = photoFile.name.split('.').pop();
                const fileName = `${chip.id}-${Math.random()}.${fileExt}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('profile-photos')
                    .upload(fileName, photoFile);

                if (uploadError) {
                    throw new Error("No se pudo subir la foto de perfil. Inténtalo de nuevo.");
                }

                const { data: publicUrlData } = supabase.storage
                    .from('profile-photos')
                    .getPublicUrl(fileName);

                photoUrl = publicUrlData.publicUrl;
            }

            let polizaUrl = null;
            if (polizaFile) {
                const fileExt = polizaFile.name.split('.').pop();
                const fileName = `poliza.${fileExt}`;
                const fullPath = `${userId}/${fileName}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('polizas')
                    .upload(fullPath, polizaFile, { upsert: true });

                if (uploadError) {
                    throw new Error("No se pudo subir el archivo de la póliza. Inténtalo de nuevo.");
                }

                polizaUrl = fullPath;
            }

            const finalAseguradora = aseguradora === "Otro" ? (formData.get("aseguradoraOtra") as string) : aseguradora;

            // Assigned plan defaults to individual or whatever was set in webhook
            const chipAssignedPlan = chip.assigned_plan || 'individual';

            // 2. Insert profile
            const profileToInsert = {
                chip_id: chip.id,
                user_id: userId,
                plan: chipAssignedPlan,
                photo_url: photoUrl,
                full_name: formData.get("fullName") as string,
                phone: `+52${phone}`,
                whatsapp_opted_in: whatsappOptedIn,
                age: age,
                location: formData.get("location") as string,
                emergency_contacts: emergencyContacts,
                blood_type: formData.get("bloodType") as string,
                allergies: formData.get("allergies") as string,
                medical_conditions: formData.get("medicalConditions") as string,
                important_medications: formData.get("importantMedications") as string,
                medical_system: medicalSystem,
                organ_donor: organDonor,
                is_motorcyclist: isMotorcyclist,
                additional_notes: formData.get("additionalNotes") as string,
                google_maps_link: formData.get("googleMapsLink") as string,
                aseguradora: finalAseguradora || null,
                numero_poliza: formData.get("numeroPoliza") as string || null,
                tipo_seguro: formData.get("tipoSeguro") as string || null,
                nombre_asegurado: formData.get("nombreAsegurado") as string || null,
                vigencia_poliza: formData.get("vigenciaPoliza") as string || null,
                telefono_aseguradora: formData.get("telefonoAseguradora") as string || null,
                poliza_url: polizaUrl,
                nss: formData.get("nss") as string || null,
                numero_afiliacion: formData.get("numeroAfiliacion") as string || null,
                clinica_asignada: formData.get("clinicaAsignada") as string || null,
                curp_seguro: formData.get("curpSeguro") as string || null,
            };

            // Filtrar y sanitizar en el servidor antes de guardar (XSS, Length Limits)
            const sanitizedProfile = await sanitizeProfileInput(profileToInsert);

            console.log("Activación - Intentando insertar en perfiles sanitize:", sanitizedProfile);

            const { data: insertedProfileData, error: profileError } = await supabase
                .from('profiles')
                .insert(sanitizedProfile)
                .select()
                .single();

            if (profileError) {
                // Verificar si es un error de clave única violada (el usuario ya tiene un perfil)
                if (profileError.code === '23505') {
                    console.log("Activación - Perfil ya existente detectado vía constraint única. Preparando modal multi-chip.");
                    // Obtenemos el ID de ese perfil existente para poder vincularlo
                    const { data: existingProfile } = await supabase.from('profiles').select('id, user_id').eq('user_id', userId).single();

                    if (existingProfile) {
                        setPendingAuthData({ userId, email });
                        setPendingChip(chip);
                        setExistingProfileToLink(existingProfile);
                        setShowLinkPrompt(true);
                        setLoading(false);
                        return; // Detener flujo, esperar interacción del usuario
                    }
                }

                console.error("Error devuelto por Supabase al insertar perfil:", JSON.stringify(profileError, null, 2), profileError);
                throw new Error(`Error BD (${profileError.code || 'Desconocido'}): ${profileError.message || 'Fallo al guardar el perfil'}`);
            }

            // 3. Update chip as activated (using inserted profile ID and with rollback capability)
            try {
                const { error: activateError } = await supabase
                    .from('chips')
                    .update({
                        status: 'activado',
                        activated: true,
                        activated_by: userId,
                        owner_profile_id: insertedProfileData.id, // ID real del `profiles` insertado
                        activated_at: new Date().toISOString()
                    })
                    .eq('id', chip.id);

                if (activateError) {
                    console.error("Error devuelto por Supabase al actualizar chip:", JSON.stringify(activateError, null, 2), activateError);
                    throw activateError;
                }
            } catch (chipUpdateError: any) {
                console.error("Fallo crítico al actualizar el chip. Iniciando ROLLBACK del perfil...", chipUpdateError);
                // Rollback: eliminar el perfil recién creado para no dejarlo huérfano
                const { error: rollbackError } = await supabase.from('profiles').delete().eq('id', insertedProfileData.id);
                if (rollbackError) {
                    console.error("Error crítico durante el rollback (perfil huérfano):", JSON.stringify(rollbackError, null, 2));
                }
                throw new Error(`Fallo al vincular el chip (${chipUpdateError.code || 'Desconocido'}). Se deshizo la creación del perfil.`);
            }

            // --- N8N WEBHOOK CALL (New Profile) ---
            try {
                await fetch('https://rescuechip.app.n8n.cloud/webhook/4882f6c2-6163-41a3-b60e-556f76717486', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-rescuechip-secret': 'rescuechip2026'
                    },
                    body: JSON.stringify({
                        phone: `+52${phone}`,
                        name: formData.get("fullName") as string,
                        folio: chip.folio
                    })
                });
                console.log("N8N Webhook disparado exitosamente (Nuevo Perfil).");
            } catch (n8nError) {
                console.error("Fallo al disparar webhook de N8N (ignorado):", n8nError);
            }

            // 4. Redirect to the dashboard to let them edit their new profile instead of returning directly to public profile
            router.push(`/dashboard`);

        } catch (err: any) {
            console.error("Error completo en proceedWithRegistration:", JSON.stringify(err, null, 2), err);
            setErrorMsg(err.message || "Ocurrió un error inesperado al registrar el perfil. Revisa la consola para más detalles.");
        } finally {
            setLoading(false);
        }
    };

    const handleLinkToMine = async () => {
        if (!pendingAuthData || !pendingChip || !existingProfileToLink) return;
        setLoading(true);
        setErrorMsg("");

        try {
            // Actualizamos solo el chip para vincularlo al perfil existente
            const { error: activateError } = await supabase
                .from('chips')
                .update({
                    status: 'activado',
                    activated: true,
                    activated_by: pendingAuthData.userId,
                    owner_profile_id: existingProfileToLink.id,
                    perfil_compartido: true,
                    activated_at: new Date().toISOString()
                })
                .eq('id', pendingChip.id);

            if (activateError) {
                throw new Error("Error al vincular el chip con tu perfil.");
            }

            // --- N8N WEBHOOK CALL (Existing Profile) ---
            try {
                await fetch('https://rescuechip.app.n8n.cloud/webhook/4882f6c2-6163-41a3-b60e-556f76717486', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-rescuechip-secret': 'rescuechip2026'
                    },
                    body: JSON.stringify({
                        phone: existingProfileToLink.phone || "Desconocido",
                        name: existingProfileToLink.full_name || "Desconocido",
                        folio: pendingChip.folio
                    })
                });
                console.log("N8N Webhook disparado exitosamente (Perfil Existente).");
            } catch (n8nError) {
                console.error("Fallo al disparar webhook de N8N (ignorado):", n8nError);
            }

            router.push(`/dashboard`);
        } catch (err: any) {
            setErrorMsg(err.message || "Ocurrió un error al vincular el chip.");
            setLoading(false);
        }
    };

    const handleLinkToOther = async () => {
        // Para otra persona -> forzamos logout y ocultamos todo
        await supabase.auth.signOut();
        setShowLinkPrompt(false);
        setPendingAuthData(null);
        setPendingChip(null);
        setExistingProfileToLink(null);
        setErrorMsg("Por favor, ingresa un correo electrónico distinto (nuevo) para crear la cuenta de esta persona.");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    if (showLinkPrompt) {
        return (
            <div className="p-8 md:p-12 text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-primary/10 text-primary flex items-center justify-center rounded-full mb-4">
                    <AlertCircle size={32} />
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-foreground">Cuenta Existente Encontrada</h2>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                    Detectamos que el correo <strong>{pendingAuthData?.email}</strong> ya tiene un perfil médico activo.
                </p>

                <div className="bg-muted p-6 rounded-2xl border border-border mt-8 max-w-lg mx-auto">
                    <h3 className="font-bold text-lg mb-2">¿Este chip es para ti o para otra persona?</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                        Si es para ti, compartirá la misma información médica. Si es para otra persona, deberás usar un correo distinto.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={handleLinkToMine}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground h-14 rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
                        >
                            {loading && <Loader2 size={18} className="animate-spin" />}
                            Es para mí (Vincular a mi perfil)
                        </button>
                        <button
                            onClick={handleLinkToOther}
                            disabled={loading}
                            className="w-full h-14 rounded-xl border-2 border-primary/20 bg-background font-bold hover:bg-muted text-foreground transition-all disabled:opacity-50"
                        >
                            Es para otra persona
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoadingPreCheck) {
        return (
            <div className="p-24 flex flex-col items-center justify-center text-muted-foreground">
                <Loader2 size={48} className="animate-spin text-primary/30 mb-4" />
                <p className="font-medium animate-pulse">Verificando estado del chip...</p>
            </div>
        );
    }

    if (preValidationError) {
        return (
            <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-2">
                    <AlertCircle size={40} />
                </div>
                <h2 className="text-2xl font-black text-foreground">Acceso Denegado</h2>
                <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
                    {preValidationError}
                </p>
                <div className="pt-6 w-full max-w-sm mx-auto">
                    <Link href="/shop" className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground h-14 rounded-xl font-bold hover:bg-primary/90 transition-all">
                        Comprar mi RescueChip
                    </Link>
                </div>
            </div>
        );
    }

    if (isLockedOut) {
        const formatTime = (seconds: number) => {
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
        };

        return (
            <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-2">
                    <AlertCircle size={40} />
                </div>
                <h2 className="text-2xl font-black text-foreground">Límite de intentos excedido</h2>
                <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
                    Por motivos de seguridad, los intentos de activación para este folio han sido temporalmente bloqueados.
                </p>
                <div className="bg-destructive/10 text-destructive font-mono text-2xl md:text-3xl font-bold py-4 px-8 rounded-xl tracking-wider">
                    {formatTime(lockCountdown)}
                </div>
                <p className="text-sm font-semibold text-muted-foreground">
                    Podrás intentar activar tu chip de nuevo cuando finalice el contador.
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0A08] flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-2xl bg-card rounded-2xl shadow-xl border border-primary/20 p-8">
                <style dangerouslySetInnerHTML={{
                    __html: `
        input, select, textarea { background-color: #1C1C1A !important; color: #F4F0EB !important; border: 1px solid rgba(255,255,255,0.25) !important; border-radius: 12px !important; padding: 10px 16px !important; }
        input::placeholder, textarea::placeholder { color: rgba(244,240,235,0.3) !important; }
        input:focus, select:focus, textarea:focus { border-color: rgba(232,35,26,0.5) !important; outline: none !important; box-shadow: 0 0 0 2px rgba(232,35,26,0.15) !important; }
        select option { background-color: #1A1A18; color: #F4F0EB; }
        label { color: #C8C0B4 !important; }
      `}} />

                <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", padding: "16px", marginBottom: "32px", backgroundColor: "rgba(232,35,26,0.08)", border: "1px solid rgba(232,35,26,0.2)", borderRadius: "12px", color: "#F4F0EB" }}>
                    <div className="mt-1">
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <h4 className="font-semibold mb-1">Aviso de Privacidad</h4>
                        <p className="text-sm opacity-90 leading-relaxed">
                            La información que proporciones aquí será accesible únicamente al escanear físicamente el chip NFC asociado a este folio. Por favor revisa que tus datos sean correctos para asegurar la mejor atención médica posible en caso de emergencia.
                        </p>
                    </div>
                </div>

                {errorMsg && (
                    <div style={{ padding: "12px 16px", marginBottom: "32px", backgroundColor: "rgba(232,35,26,0.1)", color: "#E8231A", border: "1px solid rgba(232,35,26,0.25)", borderRadius: "10px", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                        <AlertCircle size={18} /> {errorMsg}
                    </div>
                )}

                <form className="space-y-10" onSubmit={handleSubmit}>

                    {/* Confirmación del Chip */}
                    <section className="space-y-4">
                        <h3 style={{ fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", marginBottom: "16px", color: "#F4F0EB" }}>
                            <span style={{ backgroundColor: "rgba(232,35,26,0.12)", color: "#E8231A", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0, fontWeight: 600 }}>✓</span>
                            Verificación del Chip
                        </h3>
                        <div className="space-y-2">
                            <label htmlFor="folio" className="text-sm font-semibold">Número de Folio (incluido en tu paquete) *</label>
                            <input type="text" id="folio" name="folio" value={folio} onChange={(e) => setFolio(e.target.value)} className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all uppercase placeholder:normal-case font-mono" placeholder="Ej. RSC-0001" required />
                        </div>
                    </section>

                    {/* CREAR CUENTA */}
                    <section className="space-y-4">
                        <h3 style={{ fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", marginBottom: "16px", color: "#F4F0EB" }}>
                            <span style={{ backgroundColor: "rgba(232,35,26,0.12)", color: "#E8231A", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0, fontWeight: 600 }}>✉</span>
                            Crear Cuenta
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-semibold">Correo Electrónico *</label>
                                <input type="email" id="email" name="email" className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="tu@correo.com" required />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm font-semibold">Contraseña *</label>
                                <div className="relative">
                                    <input type={showPassword ? "text" : "password"} id="password" name="password" className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 pr-12 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Mínimo 6 caracteres" required minLength={6} />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-0 top-0 h-12 px-4 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">Esta cuenta te servirá para iniciar sesión en tu panel (dashboard) y actualizar tus datos en el futuro.</p>
                    </section>

                    {/* IDENTIFICACIÓN */}
                    <section className="space-y-4">
                        <h3 style={{ fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", marginBottom: "16px", color: "#F4F0EB" }}>
                            <span style={{ backgroundColor: "rgba(232,35,26,0.12)", color: "#E8231A", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0, fontWeight: 600 }}>1</span>
                            Identificación
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-4 md:col-span-2 mt-2 mb-4">
                                <label className="text-sm font-semibold">Foto de Perfil (Opcional pero Recomendado)</label>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    {photoFile ? (
                                        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary bg-muted shrink-0 shadow-md">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={URL.createObjectURL(photoFile)} alt="Preview" className="w-full h-full object-cover" />
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
                                            className="w-full flex h-14 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer shadow-sm"
                                        />
                                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed font-medium">Sube o toma una foto clara de tu rostro.<br />Establece tu identidad rápidamente ante los paramédicos.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label htmlFor="fullName" className="text-sm font-semibold">Nombre Completo *</label>
                                <input type="text" id="fullName" name="fullName" className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Juan Pérez" required />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold">Número de Celular *</label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-input bg-muted text-muted-foreground text-sm font-medium">
                                        🇲🇽 +52
                                    </span>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        placeholder="55 1234 5678"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        className="flex-1 rounded-r-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all"
                                        required
                                    />
                                </div>
                                <label className="flex items-start gap-3 cursor-pointer mt-3 p-3 bg-muted/40 rounded-xl border border-border">
                                    <input
                                        type="checkbox"
                                        checked={whatsappOptedIn}
                                        onChange={(e) => setWhatsappOptedIn(e.target.checked)}
                                        className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary"
                                    />
                                    <span className="text-xs text-muted-foreground leading-relaxed">
                                        Acepto recibir notificaciones de RescueChip por WhatsApp en este número,
                                        incluyendo confirmación de activación y alertas de emergencia.
                                    </span>
                                </label>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="age" className="text-sm font-semibold">Edad (Opcional)</label>
                                <input type="number" id="age" name="age" className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Ej. 30" min="0" max="130" />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="location" className="text-sm font-semibold">Ciudad / País *</label>
                                <input type="text" id="location" name="location" className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Ciudad de México, México" required />
                            </div>
                        </div>
                    </section>

                    {/* CONTACTOS DE EMERGENCIA */}
                    <section className="space-y-4">
                        <h3 style={{ fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", marginBottom: "16px", color: "#F4F0EB" }}>
                            <span style={{ backgroundColor: "rgba(232,35,26,0.12)", color: "#E8231A", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0, fontWeight: 600 }}>2</span>
                            Contactos de Emergencia
                        </h3>

                        <div className="p-4 border border-border rounded-xl space-y-4 bg-muted/20">
                            <h4 className="text-sm font-bold text-primary">Contacto 1 (Requerido)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="contact1Name" className="text-sm font-semibold text-muted-foreground">Nombre</label>
                                    <input type="text" id="contact1Name" name="contact1Name" className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Ej. María López (Esposa)" required />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="contact1Phone" className="text-sm font-semibold text-muted-foreground">Teléfono</label>
                                    <input type="tel" id="contact1Phone" name="contact1Phone" className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="+52 55 1234 5678" required />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label htmlFor="contact1Email" className="text-sm font-semibold text-muted-foreground">Email (Opcional, para recibir alertas)</label>
                                    <input type="email" id="contact1Email" name="contact1Email" className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Email del contacto" />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border border-border rounded-xl space-y-4 bg-muted/10">
                            <h4 className="text-sm font-bold opacity-70">Contacto 2 (Opcional)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="contact2Name" className="text-sm font-semibold text-muted-foreground">Nombre</label>
                                    <input type="text" id="contact2Name" name="contact2Name" className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Nombre completo o parentesco" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="contact2Phone" className="text-sm font-semibold text-muted-foreground">Teléfono</label>
                                    <input type="tel" id="contact2Phone" name="contact2Phone" className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="+52 55 0000 0000" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label htmlFor="contact2Email" className="text-sm font-semibold text-muted-foreground">Email (Opcional, para recibir alertas)</label>
                                    <input type="email" id="contact2Email" name="contact2Email" className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Email del contacto" />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border border-border rounded-xl space-y-4 bg-muted/10">
                            <h4 className="text-sm font-bold opacity-70">Contacto 3 (Opcional)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="contact3Name" className="text-sm font-semibold text-muted-foreground">Nombre</label>
                                    <input type="text" id="contact3Name" name="contact3Name" className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Nombre completo o parentesco" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="contact3Phone" className="text-sm font-semibold text-muted-foreground">Teléfono</label>
                                    <input type="tel" id="contact3Phone" name="contact3Phone" className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="+52 55 0000 0000" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label htmlFor="contact3Email" className="text-sm font-semibold text-muted-foreground">Email (Opcional, para recibir alertas)</label>
                                    <input type="email" id="contact3Email" name="contact3Email" className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Email del contacto" />
                                </div>
                            </div>
                        </div>

                    </section>

                    {/* INFORMACIÓN MÉDICA */}
                    <section className="space-y-4">
                        <h3 style={{ fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", marginBottom: "16px", color: "#F4F0EB" }}>
                            <span style={{ backgroundColor: "rgba(232,35,26,0.12)", color: "#E8231A", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0, fontWeight: 600 }}>3</span>
                            Información Médica
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="bloodType" className="text-sm font-semibold">Tipo de Sangre *</label>
                                <select id="bloodType" name="bloodType" className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" required>
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
                                <label htmlFor="allergies" className="text-sm font-semibold">Alergias Conocidas (Opcional)</label>
                                <input type="text" id="allergies" name="allergies" className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Ej. Penicilina, Látex, Mariscos..." />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label htmlFor="medicalConditions" className="text-sm font-semibold">Condiciones Médicas (Opcional)</label>
                                <textarea id="medicalConditions" name="medicalConditions" className="w-full flex min-h-[100px] rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-3 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Ej. Asma, Diabetes Tipo 1, Hipertensión..." />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label htmlFor="importantMedications" className="text-sm font-semibold">Medicamentos Importantes (Opcional)</label>
                                <textarea id="importantMedications" name="importantMedications" className="w-full flex min-h-[100px] rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-3 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Ej. Insulina, anticoagulantes..." />
                            </div>
                        </div>
                    </section>

                    {/* SEGURO MÉDICO (UNIFIED) */}
                    <section className="space-y-4">
                        <h3 style={{ fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", marginBottom: "16px", color: "#F4F0EB" }}>
                            <span style={{ backgroundColor: "rgba(232,35,26,0.12)", color: "#E8231A", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0, fontWeight: 600 }}>4</span>
                            Mi Seguro Médico <span className="text-muted-foreground font-normal text-sm ml-2">(Opcional)</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-5 rounded-2xl border border-border">
                            <div className="space-y-2 lg:col-span-2">
                                <label htmlFor="medicalSystem" className="text-sm font-semibold">Sistema médico</label>
                                <select id="medicalSystem" name="medicalSystem" value={medicalSystem} onChange={(e) => setMedicalSystem(e.target.value)} className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all">
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
                                        <select id="aseguradora" name="aseguradora" value={aseguradora} onChange={(e) => setAseguradora(e.target.value)} className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all">
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
                                            <input type="text" id="aseguradoraOtra" name="aseguradoraOtra" required className="w-full flex h-12 rounded-xl border border-primary/50 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <label htmlFor="numeroPoliza" className="text-sm font-semibold">Número de Póliza *</label>
                                        <input type="text" id="numeroPoliza" name="numeroPoliza" required className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="tipoSeguro" className="text-sm font-semibold">Tipo de Seguro</label>
                                        <select id="tipoSeguro" name="tipoSeguro" className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all">
                                            <option value="">Selecciona un tipo</option>
                                            <option value="Gastos Médicos Mayores">Gastos Médicos Mayores</option>
                                            <option value="Seguro de Auto">Seguro de Auto</option>
                                            <option value="Seguro de Moto">Seguro de Moto</option>
                                            <option value="Seguro de Vida">Seguro de Vida</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="nombreAsegurado" className="text-sm font-semibold">Nombre Asegurado Titular *</label>
                                        <input type="text" id="nombreAsegurado" name="nombreAsegurado" required className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="vigenciaPoliza" className="text-sm font-semibold">Vigencia (Opcional)</label>
                                        <input type="date" id="vigenciaPoliza" name="vigenciaPoliza" className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all text-foreground" style={{ colorScheme: 'dark' }} />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label htmlFor="telefonoAseguradora" className="text-sm font-semibold">Teléfono de Emergencias (Opcional)</label>
                                        <input type="tel" id="telefonoAseguradora" name="telefonoAseguradora" placeholder="Ej: 800-123-4567" className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
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
                                                    className="w-full flex h-14 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer shadow-sm relative z-10"
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
                                        <input type="text" id="nss" name="nss" required maxLength={11} className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="clinicaAsignada" className="text-sm font-semibold">UMF / Clínica asignada (Opcional)</label>
                                        <input type="text" id="clinicaAsignada" name="clinicaAsignada" placeholder="Ej: UMF 28, Monterrey" className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label htmlFor="curpSeguro" className="text-sm font-semibold">CURP (Opcional)</label>
                                        <input type="text" id="curpSeguro" name="curpSeguro" maxLength={18} className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all uppercase" />
                                    </div>
                                </>
                            )}

                            {medicalSystem === "ISSSTE" && (
                                <>
                                    <div className="space-y-2 md:col-span-2">
                                        <label htmlFor="numeroAfiliacion" className="text-sm font-semibold">Número de afiliación ISSSTE *</label>
                                        <input type="text" id="numeroAfiliacion" name="numeroAfiliacion" required className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="clinicaAsignada" className="text-sm font-semibold">Clínica asignada (Opcional)</label>
                                        <input type="text" id="clinicaAsignada" name="clinicaAsignada" className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="curpSeguro" className="text-sm font-semibold">CURP (Opcional)</label>
                                        <input type="text" id="curpSeguro" name="curpSeguro" maxLength={18} className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all uppercase" />
                                    </div>
                                </>
                            )}

                            {medicalSystem === "IMSS-BIENESTAR" && (
                                <>
                                    <div className="space-y-2">
                                        <label htmlFor="curpSeguro" className="text-sm font-semibold">CURP *</label>
                                        <input type="text" id="curpSeguro" name="curpSeguro" required maxLength={18} className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all uppercase" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="clinicaAsignada" className="text-sm font-semibold">Centro de salud asignado (Opcional)</label>
                                        <input type="text" id="clinicaAsignada" name="clinicaAsignada" className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                    </div>
                                </>
                            )}

                            {(medicalSystem === "PEMEX" || medicalSystem === "SEDENA / SEMAR") && (
                                <>
                                    <div className="space-y-2">
                                        <label htmlFor="numeroAfiliacion" className="text-sm font-semibold">Número de afiliación *</label>
                                        <input type="text" id="numeroAfiliacion" name="numeroAfiliacion" required className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="clinicaAsignada" className="text-sm font-semibold">Unidad médica asignada (Opcional)</label>
                                        <input type="text" id="clinicaAsignada" name="clinicaAsignada" className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
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
                                <input type="checkbox" id="organDonor" name="organDonor" className="w-5 h-5 rounded border-input accent-primary text-primary" />
                                <label htmlFor="organDonor" className="text-sm font-semibold cursor-pointer">Soy donante oficial de órganos</label>
                            </div>

                        </div>
                    </section>

                    {/* NOTAS IMPORTANTES & UBICACION */}
                    <section className="space-y-4">
                        <h3 style={{ fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", marginBottom: "16px", color: "#F4F0EB" }}>
                            <span style={{ backgroundColor: "rgba(232,35,26,0.12)", color: "#E8231A", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0, fontWeight: 600 }}>5</span>
                            Notas y Ubicación
                        </h3>

                        <div className="space-y-2 flex flex-col gap-2 pt-2 rounded-xl border border-primary/30 p-5 bg-primary/5 mb-6">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="isMotorcyclist"
                                    name="isMotorcyclist"
                                    className="w-5 h-5 rounded border-input accent-primary text-primary"
                                    checked={isMotorcyclist}
                                    onChange={(e) => setIsMotorcyclist(e.target.checked)}
                                />
                                <label htmlFor="isMotorcyclist" className="text-sm font-bold cursor-pointer text-primary">¿Eres Motociclista?</label>
                            </div>
                            {isMotorcyclist && (
                                <div className="ml-8 mt-2 text-sm text-destructive font-bold flex items-center gap-2 animate-[fade-in-up_0.3s_ease-out_forwards]">
                                    <AlertCircle size={16} />
                                    Tu perfil mostrará una alerta para los paramédicos pidiendo "NO RETIRAR EL CASCO" si no hay personal médico capacitado.
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 md:col-span-2">
                                <label htmlFor="additionalNotes" className="text-sm font-semibold">Notas Adicionales (Opcional)</label>
                                <textarea id="additionalNotes" name="additionalNotes" className="w-full flex min-h-[100px] rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-3 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Cualquier información adicional que los paramédicos o doctores deban saber." />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label htmlFor="googleMapsLink" className="text-sm font-semibold">Hospital o clínica de preferencia (Opcional)</label>
                                <input type="text" id="googleMapsLink" name="googleMapsLink" className="w-full flex h-12 rounded-xl border border-white/40 bg-[#1E1E1C] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Ejemplo: Hospital Ángeles Lindavista" />
                                <p className="text-xs text-muted-foreground mt-1">En caso de emergencia, el personal médico determinará el hospital más adecuado según tu estado de salud y criterio profesional. Este dato es solo una referencia.</p>
                            </div>
                        </div>
                    </section>


                    <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground h-16 rounded-2xl text-xl font-black hover:scale-[1.02] hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 mt-8 disabled:opacity-70 disabled:pointer-events-none disabled:transform-none">
                        {loading ? <Loader2 size={24} className="animate-spin" /> : <CheckCircle2 size={24} />}
                        {loading ? "Registrando Ficha..." : "Aceptar y Activar Chip"}
                    </button>
                    <p className="text-xs text-center text-muted-foreground mt-4 font-medium">
                        Al registrarte, confirmas que la información ingresada es legítima y autorizas su exposición a personal de rescate/primeros auxilios a través de tu RescueChip.
                    </p>
                </form>
            </div>
        </div>
    );
}

export default function ActivatePage() {
    return (
        <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-0 md:p-4">
            <div className="w-full max-w-3xl bg-card md:rounded-[2.5rem] shadow-2xl border-x md:border border-border/50 overflow-hidden">

                {/* Header */}
                <div className="bg-destructive px-8 py-12 text-destructive-foreground relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                    <Link href="/" className="inline-flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full text-white/90 hover:bg-white/30 hover:text-white transition-colors mb-8 font-medium text-xs uppercase tracking-wider">
                        <ArrowLeft size={16} /> Volver al Inicio
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3 relative z-10">
                        Activa tu RescueChip
                    </h1>
                    <p className="text-white/90 relative z-10 text-lg md:text-xl font-medium max-w-lg">
                        Crea tu perfil médico de emergencia en minutos.
                    </p>
                </div>

                {/* Form Container with Suspense for useSearchParams */}
                <Suspense fallback={
                    <div className="p-24 flex flex-col items-center justify-center text-muted-foreground">
                        <Loader2 size={48} className="animate-spin text-primary/30 mb-4" />
                        <p className="font-medium animate-pulse">Cargando formulario de registro...</p>
                    </div>
                }>
                    <ActivationFormContent />
                </Suspense>

            </div>
        </div>
    );
}

