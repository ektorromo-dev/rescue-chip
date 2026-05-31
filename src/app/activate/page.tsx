"use client";
export const dynamic = 'force-dynamic';


import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { sanitizeProfileInput } from "@/app/actions/sanitize";
import { validateAndFormatPhone, SUPPORTED_COUNTRIES, formatPhoneAsYouType } from '@/lib/phone-utils';
import type { CountryCode } from 'libphonenumber-js';
import React from 'react';
import { getMedicalConfig, PROFILE_COUNTRIES, getPhoneCountryFromProfileCountry } from '@/lib/medical-systems';

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
    const [selectedCountry, setSelectedCountry] = useState<CountryCode>('MX');
    const [phoneError, setPhoneError] = useState<string>('');
    const [contactPhones, setContactPhones] = useState<string[]>(['', '', '']);
    const [contactCountries, setContactCountries] = useState<CountryCode[]>(['MX', 'MX', 'MX']);
    const [contactPhoneErrors, setContactPhoneErrors] = useState<string[]>(['', '', '']);
    const [whatsappOptedIn, setWhatsappOptedIn] = useState(true);
    const [consentimientoPublico, setConsentimientoPublico] = useState(false);
    const [sexo, setSexo] = useState<string>('');

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

    const [profileCountry, setProfileCountry] = useState<string>('MX');
    const medicalConfig = getMedicalConfig(profileCountry);

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
                        if (data.alreadyActivated && data.folio) {
                            window.location.href = `/profile/${encodeURIComponent(data.folio)}`;
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

        const phoneValidation = validateAndFormatPhone(phone, selectedCountry);
        if (!phoneValidation.isValid) {
            setErrorMsg(phoneValidation.error || "Número de teléfono inválido para el país seleccionado.");
            setLoading(false);
            return;
        }

        if (!sexo) {
            setErrorMsg("Por favor, selecciona tu sexo.");
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
            await proceedWithRegistration(userId, chip, formData, email, phoneValidation.formatted as string);

        } catch (err: any) {
            console.error("Error detallado en handleSubmit:", err);
            setErrorMsg(err.message || "Ocurrió un error inesperado.");
            setLoading(false);
        }
    };

    const proceedWithRegistration = async (userId: string, chip: any, formData: FormData, email: string, formattedPhone: string) => {
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

            // Obtener IP del usuario para registro de consentimiento
            let userIp = '';
            try {
                const ipRes = await fetch('/api/get-ip');
                const ipData = await ipRes.json();
                userIp = ipData.ip || '';
            } catch {
                userIp = '';
            }

            // 2. Insert profile
            const profileToInsert = {
                chip_id: chip.id,
                user_id: userId,
                country: profileCountry,
                consent_timestamp: new Date().toISOString(),
                consent_ip: userIp,
                consent_version: 'v1.0',
                plan: chipAssignedPlan,
                photo_url: photoUrl,
                full_name: formData.get("fullName") as string,
                phone: formattedPhone,
                whatsapp_opted_in: whatsappOptedIn,
                age: age,
                sexo: sexo,
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
                hospital_name: formData.get("hospitalName") as string || null,
                google_maps_link: formData.get("googleMapsLink") as string || null,
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

            const response = await fetch('/api/activate/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    folio: chip.folio,
                    userId: userId,
                    consentIp: userIp,
                    profileData: sanitizedProfile
                })
            });

            const result = await response.json();

            if (!result.success) {
                if (result.errorCode === '23505') {
                    const { data: existingProfile } = await supabase
                        .from('profiles')
                        .select('id, user_id')
                        .eq('user_id', userId)
                        .single();

                    if (existingProfile) {
                        setPendingAuthData({ userId, email });
                        setPendingChip(chip);
                        setExistingProfileToLink(existingProfile);
                        setShowLinkPrompt(true);
                        setLoading(false);
                        return;
                    }
                }
                throw new Error(result.error || "Fallo crítico al completar la activación del chip.");
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
                        phone: formattedPhone,
                        name: formData.get("fullName") as string,
                        folio: chip.folio
                    })
                });
                console.log("N8N Webhook disparado exitosamente (Nuevo Perfil).");
            } catch (n8nError) {
                console.error("Fallo al disparar webhook de N8N (ignorado):", n8nError);
            }

            // 4. Redirect to the dashboard to let them edit their new profile instead of returning directly to public profile
            // Pre-registrar dispositivo como verificado para evitar pantalla de verificación
            try {
                let currentDeviceId = document.cookie.split('; ').find(row => row.startsWith('rescuechip_device_id='))?.split('=')[1];
                if (!currentDeviceId) {
                    currentDeviceId = crypto.randomUUID();
                    document.cookie = `rescuechip_device_id=${currentDeviceId}; max-age=${30 * 24 * 60 * 60}; path=/; SameSite=Lax`;
                }
                await supabase.from('user_sessions').upsert({
                    user_id: userId,
                    device_id: currentDeviceId,
                    device_info: navigator.userAgent || 'Unknown Device',
                    status: 'verified',
                    last_seen: new Date().toISOString()
                }, { onConflict: 'user_id,device_id' });
            } catch (deviceErr) {
                console.error("Error pre-registrando dispositivo (ignorado):", deviceErr);
            }

            // Track CompleteRegistration
            if (typeof window !== 'undefined' && (window as any).fbq) {
                (window as any).fbq('track', 'CompleteRegistration');
                console.log('Meta Pixel: CompleteRegistration tracked');
            }

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

            // Track CompleteRegistration
            if (typeof window !== 'undefined' && (window as any).fbq) {
                (window as any).fbq('track', 'CompleteRegistration');
                console.log('Meta Pixel: CompleteRegistration tracked');
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
            <div style={{ colorScheme: 'dark', padding: '32px 48px', textAlign: 'center' }}>
                <div style={{ margin: '0 auto 16px auto', width: '64px', height: '64px', backgroundColor: 'rgba(232,35,26,0.1)', color: '#E8231A', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                    <AlertCircle size={32} />
                </div>
                <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#F4F0EB', marginBottom: '16px' }}>Cuenta Existente Encontrada</h2>
                <p style={{ color: '#9E9A95', fontSize: '18px', maxWidth: '448px', margin: '0 auto' }}>
                    Detectamos que el correo <strong style={{ color: '#F4F0EB' }}>{pendingAuthData?.email}</strong> ya tiene un perfil médico activo.
                </p>

                <div style={{ backgroundColor: '#1C1C1A', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', marginTop: '32px', maxWidth: '512px', margin: '32px auto 0 auto' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '18px', color: '#F4F0EB', marginBottom: '8px' }}>¿Este chip es para ti o para otra persona?</h3>
                    <p style={{ fontSize: '14px', color: '#9E9A95', marginBottom: '24px' }}>
                        Si es para ti, compartirá la misma información médica. Si es para otra persona, deberás usar un correo distinto.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button
                            onClick={handleLinkToMine}
                            disabled={loading}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#E8231A', color: '#fff', height: '56px', borderRadius: '12px', fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, transition: 'background-color 0.2s' }}
                        >
                            {loading && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />}
                            Es para mí (Vincular a mi perfil)
                        </button>
                        <button
                            onClick={handleLinkToOther}
                            disabled={loading}
                            style={{ width: '100%', height: '56px', borderRadius: '12px', border: '2px solid rgba(232,35,26,0.2)', backgroundColor: '#0A0A08', fontWeight: 700, color: '#F4F0EB', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, transition: 'background-color 0.2s' }}
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
            <div style={{ padding: '96px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9E9A95' }}>
                <Loader2 size={48} style={{ color: 'rgba(232,35,26,0.3)', marginBottom: '16px' }} />
                <p style={{ fontWeight: 500, margin: 0 }}>Verificando estado del chip...</p>
            </div>
        );
    }

    if (preValidationError) {
        return (
            <div style={{ padding: '32px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', backgroundColor: 'rgba(232,35,26,0.1)', color: '#E8231A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                    <AlertCircle size={40} />
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#F4F0EB', margin: '0 0 24px 0' }}>Acceso Denegado</h2>
                <p style={{ color: '#9E9A95', fontSize: '18px', maxWidth: '448px', margin: '0 auto 24px auto', lineHeight: 1.6 }}>
                    {preValidationError}
                </p>
                <div style={{ paddingTop: '24px', width: '100%', maxWidth: '384px', margin: '0 auto' }}>
                    <Link href="/shop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#E8231A', color: '#fff', height: '56px', borderRadius: '12px', fontWeight: 700, textDecoration: 'none' }}>
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
            <div style={{ padding: '32px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', backgroundColor: 'rgba(232,35,26,0.1)', color: '#E8231A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                    <AlertCircle size={40} />
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#F4F0EB', margin: '0 0 24px 0' }}>Límite de intentos excedido</h2>
                <p style={{ color: '#9E9A95', fontSize: '18px', maxWidth: '448px', margin: '0 auto 24px auto', lineHeight: 1.6 }}>
                    Por motivos de seguridad, los intentos de activación para este folio han sido temporalmente bloqueados.
                </p>
                <div style={{ backgroundColor: 'rgba(232,35,26,0.1)', color: '#E8231A', fontFamily: 'monospace', fontSize: '24px', fontWeight: 700, padding: '16px 32px', borderRadius: '12px', letterSpacing: '0.05em', marginBottom: '24px' }}>
                    {formatTime(lockCountdown)}
                </div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#9E9A95', margin: 0 }}>
                    Podrás intentar activar tu chip de nuevo cuando finalice el contador.
                </p>
            </div>
        );
    }

    return (
        <div style={{ padding: "32px" }}>


            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", padding: "16px", marginBottom: "32px", backgroundColor: "rgba(232,35,26,0.08)", border: "1px solid rgba(232,35,26,0.2)", borderRadius: "12px", color: "#F4F0EB" }}>
                <div >
                    <AlertCircle size={20} />
                </div>
                <div>
                    <h4 style={{ fontWeight: 600 }}>Aviso de Privacidad</h4>
                    <p style={{ fontSize: "14px" }}>
                        La información que proporciones aquí será accesible únicamente al escanear físicamente el chip NFC asociado a este folio. Por favor revisa que tus datos sean correctos para asegurar la mejor atención médica posible en caso de emergencia.
                    </p>
                </div>
            </div>

            {errorMsg && (
                <div style={{ padding: "12px 16px", marginBottom: "32px", backgroundColor: "rgba(232,35,26,0.1)", color: "#E8231A", border: "1px solid rgba(232,35,26,0.25)", borderRadius: "10px", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                    <AlertCircle size={18} /> {errorMsg}
                </div>
            )}

            <form style={{ display: 'flex', flexDirection: 'column', gap: '40px' }} onSubmit={handleSubmit}>

                {/* Confirmación del Chip */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", marginBottom: "16px", color: "#F4F0EB" }}>
                        <span style={{ backgroundColor: "rgba(232,35,26,0.12)", color: "#E8231A", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0, fontWeight: 600 }}>✓</span>
                        Verificación del Chip
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label htmlFor="folio" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Número de Folio (incluido en tu paquete) *</label>
                        <input type="text" id="folio" name="folio" value={folio} onChange={(e) => setFolio(e.target.value)} style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                            onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} placeholder="Ej. RSC-0001" required />
                    </div>
                </section>

                {/* CREAR CUENTA */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", marginBottom: "16px", color: "#F4F0EB" }}>
                        <span style={{ backgroundColor: "rgba(232,35,26,0.12)", color: "#E8231A", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0, fontWeight: 600 }}>✉</span>
                        Crear Cuenta
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label htmlFor="email" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Correo Electrónico *</label>
                            <input type="email" id="email" name="email" style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} placeholder="tu@correo.com" required />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label htmlFor="password" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Contraseña *</label>
                            <div style={{ position: 'relative' }}>
                                <input type={showPassword ? "text" : "password"} id="password" name="password" style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                    onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} placeholder="Mínimo 6 caracteres" required minLength={6} />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: 0, top: 0, height: '48px', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9E9A95', background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <p style={{ fontSize: '14px', color: '#9E9A95', fontWeight: 500, margin: '4px 0 0 0' }}>Esta cuenta te servirá para iniciar sesión en tu panel (dashboard) y actualizar tus datos en el futuro.</p>
                </section>

                {/* IDENTIFICACIÓN */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", marginBottom: "16px", color: "#F4F0EB" }}>
                        <span style={{ backgroundColor: "rgba(232,35,26,0.12)", color: "#E8231A", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0, fontWeight: 600 }}>1</span>
                        Identificación
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>
                                País de uso / residencia <span style={{ color: '#E8231A' }}>*</span>
                            </label>
                            <select
                                value={profileCountry}
                                onChange={(e) => {
                                    const newCountry = e.target.value;
                                    setProfileCountry(newCountry);
                                    // Actualizar prefijo telefónico por defecto al del nuevo país
                                    const phoneCountry = getPhoneCountryFromProfileCountry(newCountry);
                                    setSelectedCountry(phoneCountry as any);
                                    setPhone('');
                                    setPhoneError('');
                                    setContactCountries([phoneCountry as any, phoneCountry as any, phoneCountry as any]);
                                    setContactPhones(['', '', '']);
                                    setContactPhoneErrors(['', '', '']);
                                    // Reset seguro médico al cambiar país
                                    setMedicalSystem('');
                                    setAseguradora('');
                                }}
                                style={{
                                    width: '100%',
                                    backgroundColor: '#1A1A18',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '10px',
                                    padding: '12px 16px',
                                    fontSize: '15px',
                                    color: '#F4F0EB',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                                required
                            >
                                <optgroup label="── Mercados activos ──">
                                    {PROFILE_COUNTRIES.filter(c => c.group === 'activo').map(c => (
                                        <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="── En expansión ──">
                                    {PROFILE_COUNTRIES.filter(c => c.group === 'expansion').map(c => (
                                        <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="── Otros países ──">
                                    {PROFILE_COUNTRIES.filter(c => c.group === 'otro').map(c => (
                                        <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                                    ))}
                                </optgroup>
                            </select>
                            <p style={{ fontSize: '12px', color: '#9E9A95', margin: '4px 0 0 0' }}>
                                Selecciona el país donde usarás tu RescueChip. Esto adapta los campos médicos y legales a tu región.
                            </p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "16px" }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Foto de Perfil (Opcional pero Recomendado)</label>
                            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "16px" }}>
                                {photoFile ? (
                                    <div style={{ width: "80px", height: "80px", borderRadius: "16px", overflow: "hidden", backgroundColor: "#1A1A18", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={URL.createObjectURL(photoFile)} alt="Preview" style={{ width: "100%", height: "100%" }} />
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
                                    <p style={{ fontSize: "12px", color: "#9E9A95", fontWeight: 500 }}>Sube o toma una foto clara de tu rostro.<br />Establece tu identidad rápidamente ante los paramédicos.</p>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                            <label htmlFor="fullName" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Nombre Completo *</label>
                            <input type="text" id="fullName" name="fullName" style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} placeholder="Juan Pérez" required />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '13px', color: '#9E9A95', fontWeight: 500 }}>
                                Sexo <span style={{ color: '#E8231A' }}>*</span>
                            </label>
                            <select
                                value={sexo}
                                onChange={(e) => setSexo(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: '#1A1A18',
                                    border: sexo ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(232,35,26,0.3)',
                                    borderRadius: '10px',
                                    color: sexo ? '#F4F0EB' : '#9E9A95',
                                    fontSize: '14px'
                                }}
                            >
                                <option value="" disabled>Selecciona tu sexo</option>
                                <option value="masculino">Masculino</option>
                                <option value="femenino">Femenino</option>
                                <option value="prefiero_no_decir">Prefiero no decirlo</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Número de Celular *</label>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <select
                                    value={selectedCountry}
                                    onChange={(e) => {
                                        const newCountry = e.target.value as CountryCode;
                                        setSelectedCountry(newCountry);
                                        setPhone('');
                                        setPhoneError('');
                                        setContactCountries([newCountry, newCountry, newCountry]);
                                        setContactPhones(['', '', '']);
                                        setContactPhoneErrors(['', '', '']);
                                    }}
                                    style={{
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        backgroundColor: "#1A1A18",
                                        color: "#F4F0EB",
                                        padding: "8px 12px",
                                        fontSize: "14px",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        minWidth: "160px"
                                    }}
                                    required
                                >
                                    {SUPPORTED_COUNTRIES.map(country => (
                                        <option key={country.code} value={country.code}>
                                            {country.flag} {country.name}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    placeholder={SUPPORTED_COUNTRIES.find(c => c.code === selectedCountry)?.placeholder || ''}
                                    value={phone}
                                    maxLength={(SUPPORTED_COUNTRIES.find(c => c.code === selectedCountry)?.maxDigits || 15) + 4}
                                    onChange={(e) => {
                                        const digits = e.target.value.replace(/\D/g, '');
                                        const maxDigits = SUPPORTED_COUNTRIES.find(c => c.code === selectedCountry)?.maxDigits || 15;
                                        if (digits.length <= maxDigits) {
                                            const formatted = formatPhoneAsYouType(digits, selectedCountry);
                                            setPhone(formatted);
                                        }
                                        setPhoneError('');
                                    }}
                                    onBlur={() => {
                                        if (phone.trim()) {
                                            const result = validateAndFormatPhone(phone, selectedCountry);
                                            if (!result.isValid) {
                                                setPhoneError(result.error || 'Número inválido para el país seleccionado');
                                            } else {
                                                setPhoneError('');
                                            }
                                        }
                                    }}
                                    style={{
                                        flex: 1,
                                        border: phoneError ? "1px solid #E8231A" : "1px solid rgba(255,255,255,0.08)",
                                        backgroundColor: "#1E1E1C",
                                        padding: "8px 16px",
                                        fontSize: "14px",
                                        color: "#F4F0EB",
                                        borderRadius: "4px"
                                    }}
                                    required
                                />
                            </div>
                            {phoneError && (
                                <p style={{ fontSize: '12px', color: '#E8231A', margin: '4px 0 0 0', fontWeight: 500 }}>
                                    {phoneError}
                                </p>
                            )}
                            <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
                                <input
                                    type="checkbox"
                                    checked={whatsappOptedIn}
                                    onChange={(e) => setWhatsappOptedIn(e.target.checked)}
                                    style={{ height: "16px", width: "16px", borderRadius: "4px", color: "#E8231A" }}
                                />
                                <span style={{ fontSize: "12px", color: "#9E9A95" }}>
                                    Acepto recibir notificaciones de RescueChip por WhatsApp en este número,
                                    incluyendo confirmación de activación y alertas de emergencia.
                                </span>
                            </label>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label htmlFor="age" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Edad (Opcional)</label>
                            <input type="number" id="age" name="age" style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} placeholder="Ej. 30" min="0" max="130" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label htmlFor="location" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Ciudad / País *</label>
                            <input type="text" id="location" name="location" style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} placeholder="Ciudad de México, México" required />
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
                                <label htmlFor="contact1Name" style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Nombre</label>
                                <input type="text" id="contact1Name" name="contact1Name" style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                    onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} placeholder="Ej. María López (Esposa)" required />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Teléfono</label>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <select
                                        value={contactCountries[0]}
                                        onChange={(e) => {
                                            const updated = [...contactCountries];
                                            updated[0] = e.target.value as CountryCode;
                                            setContactCountries(updated);
                                            const updatedPhones = [...contactPhones];
                                            updatedPhones[0] = '';
                                            setContactPhones(updatedPhones);
                                        }}
                                        style={{ border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "#1A1A18", color: "#F4F0EB", padding: "8px 10px", fontSize: "13px", borderRadius: "10px", cursor: "pointer", minWidth: "130px" }}
                                    >
                                        {SUPPORTED_COUNTRIES.map(c => (
                                            <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="tel"
                                        id="contact1Phone"
                                        name="contact1Phone"
                                        inputMode="numeric"
                                        placeholder={SUPPORTED_COUNTRIES.find(c => c.code === contactCountries[0])?.placeholder || ''}
                                        value={contactPhones[0]}
                                        maxLength={(SUPPORTED_COUNTRIES.find(c => c.code === contactCountries[0])?.maxDigits || 15) + 4}
                                        onChange={(e) => {
                                            const digits = e.target.value.replace(/\D/g, '');
                                            const max = SUPPORTED_COUNTRIES.find(c => c.code === contactCountries[0])?.maxDigits || 15;
                                            if (digits.length <= max) {
                                                const updated = [...contactPhones];
                                                updated[0] = formatPhoneAsYouType(digits, contactCountries[0]);
                                                setContactPhones(updated);
                                            }
                                            const updatedErrors = [...contactPhoneErrors];
                                            updatedErrors[0] = '';
                                            setContactPhoneErrors(updatedErrors);
                                        }}
                                        onBlur={() => {
                                            if (contactPhones[0].trim()) {
                                                const result = validateAndFormatPhone(contactPhones[0], contactCountries[0]);
                                                const updatedErrors = [...contactPhoneErrors];
                                                updatedErrors[0] = result.isValid ? '' : (result.error || 'Número inválido');
                                                setContactPhoneErrors(updatedErrors);
                                            }
                                        }}
                                        style={{ flex: 1, backgroundColor: '#1A1A18', border: contactPhoneErrors[0] ? '1px solid #E8231A' : '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box' }}
                                        required
                                    />
                                </div>
                                {contactPhoneErrors[0] && (
                                    <p style={{ fontSize: '12px', color: '#E8231A', margin: '4px 0 0 0', fontWeight: 500 }}>{contactPhoneErrors[0]}</p>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                                <label htmlFor="contact1Email" style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Email (Opcional, para recibir alertas)</label>
                                <input type="email" id="contact1Email" name="contact1Email" style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                    onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} placeholder="Email del contacto" />
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: "16px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "16px" }}>
                        <h4 style={{ fontSize: "14px", fontWeight: 700 }}>Contacto 2 (Opcional)</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label htmlFor="contact2Name" style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Nombre</label>
                                <input type="text" id="contact2Name" name="contact2Name" style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                    onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} placeholder="Nombre completo o parentesco" />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Teléfono</label>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <select
                                        value={contactCountries[1]}
                                        onChange={(e) => {
                                            const updated = [...contactCountries];
                                            updated[1] = e.target.value as CountryCode;
                                            setContactCountries(updated);
                                            const updatedPhones = [...contactPhones];
                                            updatedPhones[1] = '';
                                            setContactPhones(updatedPhones);
                                        }}
                                        style={{ border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "#1A1A18", color: "#F4F0EB", padding: "8px 10px", fontSize: "13px", borderRadius: "10px", cursor: "pointer", minWidth: "130px" }}
                                    >
                                        {SUPPORTED_COUNTRIES.map(c => (
                                            <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="tel"
                                        id="contact2Phone"
                                        name="contact2Phone"
                                        inputMode="numeric"
                                        placeholder={SUPPORTED_COUNTRIES.find(c => c.code === contactCountries[1])?.placeholder || ''}
                                        value={contactPhones[1]}
                                        maxLength={(SUPPORTED_COUNTRIES.find(c => c.code === contactCountries[1])?.maxDigits || 15) + 4}
                                        onChange={(e) => {
                                            const digits = e.target.value.replace(/\D/g, '');
                                            const max = SUPPORTED_COUNTRIES.find(c => c.code === contactCountries[1])?.maxDigits || 15;
                                            if (digits.length <= max) {
                                                const updated = [...contactPhones];
                                                updated[1] = formatPhoneAsYouType(digits, contactCountries[1]);
                                                setContactPhones(updated);
                                            }
                                            const updatedErrors = [...contactPhoneErrors];
                                            updatedErrors[1] = '';
                                            setContactPhoneErrors(updatedErrors);
                                        }}
                                        onBlur={() => {
                                            if (contactPhones[1].trim()) {
                                                const result = validateAndFormatPhone(contactPhones[1], contactCountries[1]);
                                                const updatedErrors = [...contactPhoneErrors];
                                                updatedErrors[1] = result.isValid ? '' : (result.error || 'Número inválido');
                                                setContactPhoneErrors(updatedErrors);
                                            }
                                        }}
                                        style={{ flex: 1, backgroundColor: '#1A1A18', border: contactPhoneErrors[1] ? '1px solid #E8231A' : '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>
                                {contactPhoneErrors[1] && (
                                    <p style={{ fontSize: '12px', color: '#E8231A', margin: '4px 0 0 0', fontWeight: 500 }}>{contactPhoneErrors[1]}</p>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                                <label htmlFor="contact2Email" style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Email (Opcional, para recibir alertas)</label>
                                <input type="email" id="contact2Email" name="contact2Email" style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                    onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} placeholder="Email del contacto" />
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: "16px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "16px" }}>
                        <h4 style={{ fontSize: "14px", fontWeight: 700 }}>Contacto 3 (Opcional)</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label htmlFor="contact3Name" style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Nombre</label>
                                <input type="text" id="contact3Name" name="contact3Name" style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                    onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} placeholder="Nombre completo o parentesco" />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Teléfono</label>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <select
                                        value={contactCountries[2]}
                                        onChange={(e) => {
                                            const updated = [...contactCountries];
                                            updated[2] = e.target.value as CountryCode;
                                            setContactCountries(updated);
                                            const updatedPhones = [...contactPhones];
                                            updatedPhones[2] = '';
                                            setContactPhones(updatedPhones);
                                        }}
                                        style={{ border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "#1A1A18", color: "#F4F0EB", padding: "8px 10px", fontSize: "13px", borderRadius: "10px", cursor: "pointer", minWidth: "130px" }}
                                    >
                                        {SUPPORTED_COUNTRIES.map(c => (
                                            <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="tel"
                                        id="contact3Phone"
                                        name="contact3Phone"
                                        inputMode="numeric"
                                        placeholder={SUPPORTED_COUNTRIES.find(c => c.code === contactCountries[2])?.placeholder || ''}
                                        value={contactPhones[2]}
                                        maxLength={(SUPPORTED_COUNTRIES.find(c => c.code === contactCountries[2])?.maxDigits || 15) + 4}
                                        onChange={(e) => {
                                            const digits = e.target.value.replace(/\D/g, '');
                                            const max = SUPPORTED_COUNTRIES.find(c => c.code === contactCountries[2])?.maxDigits || 15;
                                            if (digits.length <= max) {
                                                const updated = [...contactPhones];
                                                updated[2] = formatPhoneAsYouType(digits, contactCountries[2]);
                                                setContactPhones(updated);
                                            }
                                            const updatedErrors = [...contactPhoneErrors];
                                            updatedErrors[2] = '';
                                            setContactPhoneErrors(updatedErrors);
                                        }}
                                        onBlur={() => {
                                            if (contactPhones[2].trim()) {
                                                const result = validateAndFormatPhone(contactPhones[2], contactCountries[2]);
                                                const updatedErrors = [...contactPhoneErrors];
                                                updatedErrors[2] = result.isValid ? '' : (result.error || 'Número inválido');
                                                setContactPhoneErrors(updatedErrors);
                                            }
                                        }}
                                        style={{ flex: 1, backgroundColor: '#1A1A18', border: contactPhoneErrors[2] ? '1px solid #E8231A' : '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>
                                {contactPhoneErrors[2] && (
                                    <p style={{ fontSize: '12px', color: '#E8231A', margin: '4px 0 0 0', fontWeight: 500 }}>{contactPhoneErrors[2]}</p>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                                <label htmlFor="contact3Email" style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Email (Opcional, para recibir alertas)</label>
                                <input type="email" id="contact3Email" name="contact3Email" style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                    onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} placeholder="Email del contacto" />
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
                            <select id="bloodType" name="bloodType" style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
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
                            <label htmlFor="allergies" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Alergias Conocidas (Opcional)</label>
                            <input type="text" id="allergies" name="allergies" style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} placeholder="Ej. Penicilina, Látex, Mariscos..." />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                            <label htmlFor="medicalConditions" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Condiciones Médicas (Opcional)</label>
                            <textarea id="medicalConditions" name="medicalConditions" style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', minHeight: '80px', resize: 'none', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }} placeholder="Ej. Asma, Diabetes Tipo 1, Hipertensión..." />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                            <label htmlFor="importantMedications" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Medicamentos Importantes (Opcional)</label>
                            <textarea id="importantMedications" name="importantMedications" style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', minHeight: '80px', resize: 'none', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }} placeholder="Ej. Insulina, anticoagulantes..." />
                        </div>
                    </div>
                </section>

                {/* SEGURO MÉDICO (UNIFIED) */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", marginBottom: "16px", color: "#F4F0EB" }}>
                    <span style={{ backgroundColor: "rgba(232,35,26,0.12)", color: "#E8231A", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0, fontWeight: 600 }}>4</span>
                    Mi Seguro Médico <span style={{ color: "#9E9A95", fontSize: "14px", marginLeft: "8px" }}>(Opcional)</span>
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", padding: "16px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", gridColumn: '1 / -1' }}>
                      <label htmlFor="medicalSystem" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>
                        Sistema médico
                      </label>
                      <select id="medicalSystem" name="medicalSystem" value={medicalSystem}
                        onChange={(e) => { setMedicalSystem(e.target.value); setAseguradora(''); }}
                        style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box' }}>
                        <option value="">Selecciona un sistema</option>
                        <option value="Seguro Privado">{medicalConfig.privateSystemLabel}</option>
                        {medicalConfig.publicSystems.map(sys => (
                          <option key={sys.value} value={sys.value}>{sys.label}</option>
                        ))}
                        <option value="Sin seguro médico">Sin seguro médico</option>
                      </select>
                    </div>

                    {/* SEGURO PRIVADO */}
                    {medicalSystem === "Seguro Privado" && (
                      <>
                        {medicalConfig.privateGeneric ? (
                          // Input libre para países genéricos
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px", gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>
                              Nombre de la aseguradora *
                            </label>
                            <input type="text" name="aseguradoraOtra"
                              style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box' }}
                              placeholder="Escribe el nombre de tu aseguradora" required />
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label htmlFor="aseguradora" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>
                              Aseguradora
                            </label>
                            <select id="aseguradora" name="aseguradora" value={aseguradora} onChange={(e) => setAseguradora(e.target.value)}
                              style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box' }}>
                              <option value="">Selecciona una aseguradora</option>
                              {medicalConfig.privateInsurers.map(ins => (
                                <option key={ins} value={ins}>{ins}</option>
                              ))}
                              <option value="Otro">Otro</option>
                            </select>
                          </div>
                        )}
                        {aseguradora === "Otro" && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label htmlFor="aseguradoraOtra" style={{ fontSize: "14px", fontWeight: 600, color: "#E8231A" }}>
                              Especificar *
                            </label>
                            <input type="text" id="aseguradoraOtra" name="aseguradoraOtra" required
                              style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box' }} />
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label htmlFor="numeroPoliza" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>
                            Número de Póliza *
                          </label>
                          <input type="text" id="numeroPoliza" name="numeroPoliza" required
                            style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label htmlFor="nombreAsegurado" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>
                            Nombre del titular *
                          </label>
                          <input type="text" id="nombreAsegurado" name="nombreAsegurado" required
                            style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label htmlFor="vigenciaPoliza" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>
                            Vigencia (Opcional)
                          </label>
                          <input type="date" id="vigenciaPoliza" name="vigenciaPoliza"
                            style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                          <label htmlFor="telefonoAseguradora" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>
                            Teléfono de emergencias de la aseguradora (Opcional)
                          </label>
                          <input type="tel" id="telefonoAseguradora" name="telefonoAseguradora"
                            style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                      </>
                    )}

                    {/* SISTEMAS PÚBLICOS — dinámico por país */}
                    {medicalConfig.publicSystems.map(sys => sys.value === medicalSystem && (
                      <React.Fragment key={sys.value}>
                        {sys.showNSS && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label htmlFor="nss" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>
                              {sys.nssLabel || 'Número de afiliado'} *
                            </label>
                            <input type="text" id="nss" name="nss" required maxLength={20}
                              style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box' }} />
                          </div>
                        )}
                        {sys.showAfiliacion && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label htmlFor="numeroAfiliacion" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>
                              {sys.afiliacionLabel || 'Número de afiliación'} *
                            </label>
                            <input type="text" id="numeroAfiliacion" name="numeroAfiliacion" required
                              style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box' }} />
                          </div>
                        )}
                        {sys.showClinica && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label htmlFor="clinicaAsignada" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>
                              {sys.clinicaLabel || 'Unidad médica asignada'} (Opcional)
                            </label>
                            <input type="text" id="clinicaAsignada" name="clinicaAsignada"
                              style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box' }} />
                          </div>
                        )}
                        {sys.showCURP && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                            <label htmlFor="curpSeguro" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>
                              {sys.curpLabel || 'Documento de identidad'} (Opcional)
                            </label>
                            <input type="text" id="curpSeguro" name="curpSeguro" maxLength={20}
                              style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box' }} />
                          </div>
                        )}
                      </React.Fragment>
                    ))}

                    {/* SIN SEGURO */}
                    {medicalSystem === "Sin seguro médico" && (
                      <div style={{ gridColumn: '1 / -1', padding: "16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", fontSize: "14px", color: "#9E9A95" }}>
                        <p style={{ fontWeight: 600, color: "#F4F0EB", marginBottom: '4px' }}>Aviso:</p>
                        {medicalConfig.noneWarning}
                      </div>
                    )}

                    {/* DONANTE DE ÓRGANOS — siempre visible */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", gridColumn: '1 / -1', borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", padding: "16px" }}>
                      <input type="checkbox" id="organDonor" name="organDonor"
                        style={{ width: "20px", height: "20px", borderRadius: "4px", color: "#E8231A" }} />
                      <label htmlFor="organDonor" style={{ fontSize: "14px", fontWeight: 600 }}>
                        Soy donante oficial de órganos
                      </label>
                    </div>
                  </div>
                </section>

                {/* NOTAS IMPORTANTES & UBICACION */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", marginBottom: "16px", color: "#F4F0EB" }}>
                        <span style={{ backgroundColor: "rgba(232,35,26,0.12)", color: "#E8231A", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0, fontWeight: 600 }}>5</span>
                        Notas y Ubicación
                    </h3>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <input
                                type="checkbox"
                                id="isMotorcyclist"
                                name="isMotorcyclist"
                                style={{ width: "20px", height: "20px", borderRadius: "4px", color: "#E8231A" }}
                                checked={isMotorcyclist}
                                onChange={(e) => setIsMotorcyclist(e.target.checked)}
                            />
                            <label htmlFor="isMotorcyclist" style={{ fontSize: "14px", fontWeight: 700, color: "#E8231A" }}>¿Eres Motociclista?</label>
                        </div>
                        {isMotorcyclist && (
                            <div style={{ fontSize: "14px", color: "#E8231A", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                                <AlertCircle size={16} />
                                Tu perfil mostrará una alerta para los paramédicos pidiendo "NO RETIRAR EL CASCO" si no hay personal médico capacitado.
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                            <label htmlFor="additionalNotes" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Notas Adicionales (Opcional)</label>
                            <textarea id="additionalNotes" name="additionalNotes" style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', minHeight: '80px', resize: 'none', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }} placeholder="Cualquier información adicional que los paramédicos o doctores deban saber." />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>
                                Hospital o clínica de preferencia (Opcional)
                            </label>
                            <input
                                type="text"
                                id="hospitalName"
                                name="hospitalName"
                                style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', marginBottom: '12px' }}
                                onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                placeholder="Ejemplo: Hospital Ángeles Lindavista"
                            />
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>
                                Ubicación (Google Maps, Waze u otro link) (Opcional)
                            </label>
                            <input
                                type="url"
                                id="googleMapsLink"
                                name="googleMapsLink"
                                style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', marginBottom: '8px' }}
                                onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                placeholder="https://maps.google.com/..."
                            />
                            <p style={{ fontSize: '12px', color: '#9E9A95' }}>
                                En caso de emergencia, el personal médico determinará el hospital más adecuado. Este dato es solo una referencia.
                            </p>
                        </div>
                    </div>
                </section>


                {/* CONSENTIMIENTO INFORMADO — Bloque legal v1.0 */}
                <div style={{
                    background: 'rgba(232,35,26,0.05)',
                    border: '1px solid rgba(232,35,26,0.2)',
                    borderRadius: '8px',
                    padding: '20px',
                    marginBottom: '20px',
                }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#F4F0EB', marginBottom: '12px' }}>
                        CONSENTIMIENTO INFORMADO
                    </p>
                    <p style={{ fontSize: '12px', color: '#9E9A95', lineHeight: '1.6', marginBottom: '8px' }}>
                        Al activar mi chip RESCUECHIP, declaro bajo protesta de decir verdad que:
                    </p>
                    <ol style={{ fontSize: '12px', color: '#9E9A95', lineHeight: '1.6', paddingLeft: '20px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <li>Entiendo que RESCUECHIP es un sistema de identificación médica, NO un servicio médico ni de emergencia. No garantiza resultados médicos favorables.</li>
                        <li>Acepto que mi perfil médico será accesible de forma pública al escanear el chip NFC o código QR, sin autenticación previa. Esta es una condición esencial del servicio para funcionar en emergencias donde puedo estar inconsciente.</li>
                        <li>Me comprometo a proporcionar información médica veraz y mantenerla actualizada. La exactitud de mis datos es mi responsabilidad exclusiva.</li>
                        <li>Entiendo que la efectividad del sistema depende de terceros (paramédicos, testigos, red celular, estado del chip), y que RESCUECHIP no controla ni garantiza estos factores.</li>
                        <li>Puedo eliminar mis datos en cualquier momento desde mi dashboard en rescue-chip.com. La eliminación es permanente e irreversible.</li>
                        <li>He leído y acepto los <a href="/terminos" target="_blank" rel="noopener noreferrer" style={{ color: '#E8231A' }}>Términos y Condiciones</a> y el <a href="/privacidad" target="_blank" rel="noopener noreferrer" style={{ color: '#E8231A' }}>Aviso de Privacidad</a>.</li>
                    </ol>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={consentimientoPublico}
                            onChange={(e) => setConsentimientoPublico(e.target.checked)}
                            style={{ marginTop: '2px', flexShrink: 0, accentColor: '#E8231A' }}
                        />
                        <span style={{ fontSize: '13px', color: '#C8C0B4', lineHeight: '1.5', fontWeight: '500' }}>
                            Acepto el consentimiento informado y las condiciones del servicio RESCUECHIP.
                        </span>
                    </label>
                </div>

                <button type="submit" disabled={loading || !consentimientoPublico || !sexo} style={{ marginTop: '16px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#E8231A', color: '#fff', height: '64px', borderRadius: '16px', fontSize: '20px', fontWeight: 900, border: 'none', cursor: (!consentimientoPublico || loading || !sexo) ? 'not-allowed' : 'pointer', opacity: (!consentimientoPublico || !sexo) ? 0.4 : 1, transition: 'all 0.2s' }}>
                    {loading ? <Loader2 size={24} /> : <CheckCircle2 size={24} />}
                    {loading ? "Registrando Ficha..." : "Aceptar y Activar Chip"}
                </button>
                <p style={{ fontSize: "12px", textAlign: "center", color: "#9E9A95", marginTop: "16px", fontWeight: 500 }}>
                    Al registrarte, confirmas que la información ingresada es legítima y autorizas su exposición a personal de rescate/primeros auxilios a través de tu RescueChip.
                </p>
            </form>
        </div>
    );
}

export default function ActivatePage() {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0A0A08', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 16px' }}>
            <div style={{ width: '100%', maxWidth: '680px' }}>

                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg, #1C0A09 0%, #2C1210 60%, #1A0808 100%)', padding: '48px 32px', border: '1px solid rgba(232,35,26,0.35)', borderRadius: '16px 16px 0 0', position: 'relative', overflow: 'hidden' }}>
                    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '9999px', color: '#9E9A95', textDecoration: 'none', marginBottom: '32px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
                        <ArrowLeft size={16} /> Volver al Inicio
                    </Link>
                    <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#F4F0EB', margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>
                        Activa tu RescueChip
                    </h1>
                    <p style={{ color: '#9E9A95', fontSize: '18px', fontWeight: 500, margin: 0 }}>
                        Crea tu perfil médico de emergencia en minutos.
                    </p>
                </div>

                {/* Form Container with Suspense for useSearchParams */}
                <Suspense fallback={
                    <div style={{ backgroundColor: '#131311', padding: '96px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9E9A95', border: '1px solid rgba(255,255,255,0.08)', borderTop: 'none', borderRadius: '0 0 16px 16px' }}>
                        <Loader2 size={48} style={{ color: 'rgba(232,35,26,0.3)', marginBottom: '16px' }} />
                        <p style={{ fontWeight: 500, margin: 0 }}>Cargando formulario de registro...</p>
                    </div>
                }>
                    <ActivationFormContent />
                </Suspense>

            </div>
        </div>
    );
}

