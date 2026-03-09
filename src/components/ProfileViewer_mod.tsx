"use client";

import { useState, useEffect, useCallback } from "react";
import { HeartPulse, Droplets, AlertTriangle, PhoneCall, CheckCircle2, FileText, UserSquare2, ArrowLeft, ShieldAlert, Navigation, Info, Lock, Clock, LocateFixed } from "lucide-react";
import Link from "next/link";
import FirstAidBanner from "@/components/FirstAidBanner";

interface ProfileViewerProps {
    chip: any;
    profile: any;
    isDemo?: boolean;
    signedPolizaUrl: string | null;
    emergencyContactsArray: any[];
    allergiesArray: string[];
}

export default function ProfileViewer({ chip, profile, isDemo = false, signedPolizaUrl, emergencyContactsArray, allergiesArray }: ProfileViewerProps) {
    const [hasConsented, setHasConsented] = useState<boolean>(isDemo);
    const [isEmergency, setIsEmergency] = useState<boolean>(isDemo);
    const [sessionExpired, setSessionExpired] = useState<boolean>(false);
    const [timeLeft, setTimeLeft] = useState<number>(420); // 7 minutes
    const [sessionToken, setSessionToken] = useState<string>("");
    const [screenshotWarning, setScreenshotWarning] = useState<boolean>(false);
    const [geoError, setGeoError] = useState<boolean>(false);
    const [isLoadingConsent, setIsLoadingConsent] = useState<boolean>(false);

    // Generate UUID function
    const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    const handleConsent = async (type: 'emergencia' | 'prueba') => {
        setGeoError(false);
        setIsLoadingConsent(true);

        // Fetch Location Mandaory
        let lat = null;
        let lng = null;

        if (navigator.geolocation) {
            try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 15000 });
                });
                lat = position.coords.latitude;
                lng = position.coords.longitude;
            } catch (err) {
                console.warn("Geolocation denied or timed out", err);
                setGeoError(true);
            }
        } else {
            setGeoError(true);
        }

        const token = generateUUID();
        setSessionToken(token);
        sessionStorage.setItem(`rescuechip_session_${chip.folio}`, token);

        const isEmerg = type === 'emergencia';
        setIsEmergency(isEmerg);

        // Send Log
        try {
            await fetch('/api/log-access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chip_folio: chip.folio,
                    tipo: type,
                    latitud: lat,
                    longitud: lng,
                    session_token: token
                })
            });
        } catch (e) {
            console.error("Error logging access", e);
        }

        setHasConsented(true);
        setIsLoadingConsent(false);
    };

    // Timer Logic
    useEffect(() => {
        if (!hasConsented || isDemo || sessionExpired) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setSessionExpired(true);
                    sessionStorage.removeItem(`rescuechip_session_${chip.folio}`);
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [hasConsented, isDemo, sessionExpired, chip.folio]);

    // Anti Screenshot Logic
    useEffect(() => {
        if (!hasConsented || isDemo || sessionExpired) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setScreenshotWarning(true);
                setTimeout(() => setScreenshotWarning(false), 5000);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'PrintScreen') {
                setScreenshotWarning(true);
                setTimeout(() => setScreenshotWarning(false), 5000);
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("keydown", handleKeyDown);

        // Anti History
        window.history.replaceState(null, '', window.location.href);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [hasConsented, isDemo, sessionExpired]);


    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const maskNumber = (num: string | null | undefined, visibleDigits = 4) => {
        if (!num) return num;
        if (num.length <= visibleDigits) return num;
        return `****${num.slice(-visibleDigits)}`;
    };

    // --- RENDER CONSENT SCREEN ---
    if (!hasConsented && !sessionExpired) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#0A0A08', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
                <div style={{ backgroundColor: '#131311', width: '100%', maxWidth: '480px', borderRadius: '20px', padding: '48px 32px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <ShieldAlert size={48} style={{ margin: '0 auto', color: '#E8231A', marginBottom: '24px', display: 'block' }} />
                    <h1 style={{ fontSize: '28px', fontWeight: 900, textAlign: 'center', marginBottom: '16px', color: '#F4F0EB' }}>Acceso Restringido</h1>

                    <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '12px', fontSize: '12px', color: '#9E9A95', textAlign: 'justify', lineHeight: 1.6, marginBottom: '24px' }}>
                        <strong>AVISO DE PRIVACIDAD:</strong> La información contenida en este perfil es confidencial y está protegida por la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP). Este acceso queda registrado con fecha, hora, ubicación aproximada y dispositivo. El uso indebido de esta información será perseguido y sancionado conforme a la legislación mexicana vigente, incluyendo los artículos 67 y 68 de la LFPDPPP que establecen penas de 3 a 5 años de prisión y multas de 100 a 320,000 días de UMA.
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                            onClick={() => handleConsent('emergencia')}
                            disabled={isLoadingConsent}
                            style={{ width: '100%', backgroundColor: '#E8231A', color: '#F4F0EB', padding: '14px 24px', borderRadius: '12px', fontWeight: 900, fontSize: '14px', border: 'none', cursor: isLoadingConsent ? 'not-allowed' : 'pointer', textTransform: 'uppercase', opacity: isLoadingConsent ? 0.5 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isLoadingConsent ? "PROCESANDO..." : <><AlertTriangle size={20} /> ES UNA EMERGENCIA REAL</>}
                            </span>
                            {!isLoadingConsent && <span style={{ fontSize: '10px', fontWeight: 400, opacity: 0.8, letterSpacing: '0.05em' }}>(Notificará contactos de emergencia)</span>}
                        </button>

                        <button
                            onClick={() => handleConsent('prueba')}
                            disabled={isLoadingConsent}
                            style={{ width: '100%', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#9E9A95', padding: '12px 24px', borderRadius: '12px', fontWeight: 600, fontSize: '13px', cursor: isLoadingConsent ? 'not-allowed' : 'pointer', opacity: isLoadingConsent ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <Info size={16} /> Solo es una consulta o prueba
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER EXPIRED SCREEN ---
    if (sessionExpired) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#0A0A08', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
                <div style={{ backgroundColor: '#131311', width: '100%', maxWidth: '480px', borderRadius: '20px', padding: '40px', textAlign: 'center', border: '1px solid rgba(232,35,26,0.3)' }}>
                    <Clock size={56} style={{ margin: '0 auto', color: '#9E9A95', marginBottom: '24px', display: 'block' }} />
                    <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '16px', color: '#F4F0EB' }}>Sesión Expirada</h2>
                    <p style={{ color: '#9E9A95', marginBottom: '32px' }}>Por seguridad, esta sesión ha expirado. Si necesitas ver los datos nuevamente, escanea el chip otra vez.</p>
                    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8231A', color: '#F4F0EB', padding: '12px 24px', borderRadius: '12px', fontWeight: 700, textDecoration: 'none' }}>
                        Entendido
                    </Link>
                </div>
            </div>
        );
    }

    // --- RENDER PROFILE ---
    return (
        <div className="min-h-screen bg-muted flex flex-col items-center justify-start pb-12 sm:pt-12 p-0 sm:p-4 select-none relative" style={{ WebkitTouchCallout: 'none' }}>

            {/* Watermark */}
            <div className="fixed inset-0 pointer-events-none z-[100] flex flex-col items-center justify-center overflow-hidden opacity-[0.03]">
                {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className="whitespace-nowrap -rotate-45 text-4xl font-black mb-24">
                        CONFIDENCIAL - ACCESO REGISTRADO - {new Date().toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' })}
                    </div>
                ))}
            </div>

            <div className="w-full max-w-lg bg-card sm:rounded-[2.5rem] shadow-2xl border-x sm:border border-border/50 overflow-hidden flex flex-col items-center relative z-10">

                {/* Screenshot Warning */}
                {screenshotWarning && (
                    <div className="absolute top-0 left-0 w-full bg-red-600 text-white p-2 text-center text-xs font-bold z-[200] animate-pulse">
                        Se ha detectado un posible intento de captura de pantalla. Este acceso está registrado.
                    </div>
                )}

                {/* Demo Notice */}
                {isDemo && (
                    <div className="w-full bg-blue-600 text-white px-4 py-2 text-center text-xs font-black uppercase tracking-widest relative z-[60]">
                        Este es un perfil de demostración con datos ficticios
                    </div>
                )}

                {/* Test Notice */}
                {!isDemo && !isEmergency && (
                    <div className="w-full bg-slate-700 text-white px-4 py-2 text-center text-xs font-black uppercase tracking-widest relative z-[60]">
                        MODO CONSULTA - No se notificará a contactos
                    </div>
                )}

                {/* Geo Error Notice */}
                {geoError && !isDemo && (
                    <div className="w-full bg-red-600/90 text-white px-6 py-3 text-center text-[11px] font-bold leading-tight relative z-[60] border-b border-red-800 tracking-wide shadow-md">
                        ⚠️ AVISO: No se pudo obtener tu ubicación. Este acceso queda registrado con tu dirección IP y dispositivo. El uso indebido de esta información será perseguido legalmente.
                    </div>
                )}

                {/* Security Bar */}
                {!isDemo && (
                    <div className="w-full flex justify-between items-center px-4 py-2 bg-zinc-900 text-zinc-300 text-[10px] uppercase font-bold tracking-wider relative z-[50]">
                        <span className="flex items-center gap-1"><Lock size={12} /> Seguro</span>
                        <span className="flex items-center gap-1 text-red-400">
                            Sesión expira en: {formatTime(timeLeft)}
                        </span>
                    </div>
                )}

                {/* Motorcyclist Warning Banner */}
                {profile.is_motorcyclist && (
                    <div className="w-full bg-yellow-500 text-yellow-950 px-6 py-4 flex items-center justify-center gap-3 font-black text-center relative z-40">
                        <ShieldAlert className="animate-pulse" size={28} />
                        <span className="uppercase text-sm leading-tight">
                            PRECAUCIÓN MOTOCICLISTA: <br /> NO RETIRAR EL CASCO SIN PERSONAL CAPACITADO
                        </span>
                    </div>
                )}

                {/* Dynamic Header banner */}
                <div className="w-full bg-destructive px-8 pb-14 pt-8 text-destructive-foreground relative z-30">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />

                    <div className="relative z-10 text-center mt-6">
                        <div className="w-28 h-28 bg-card text-foreground mx-auto rounded-full flex items-center justify-center shadow-xl mb-4 border-4 border-card/80 overflow-hidden shrink-0">
                            {isDemo ? (
                                <div className="w-full h-full bg-[#DC2626] flex items-center justify-center text-white font-black text-4xl rounded-full">
                                    CM
                                </div>
                            ) : profile.photo_url ? (
                                <img src={profile.photo_url} alt={profile.full_name} className="w-full h-full object-cover pointer-events-none" />
                            ) : (
                                <UserSquare2 size={48} className="text-muted-foreground/50" />
                            )}
                        </div>
                        <h1 className="text-3xl font-black tracking-tight mb-2">{isDemo ? 'Carlos Martínez' : profile.full_name}</h1>
                        <p className="text-white/80 font-medium">
                            {isDemo ? '32 años • Ciudad de México' : `${profile.age ? `${profile.age} años • ` : ''} ${profile.location}`}
                        </p>
                    </div>
                </div>

                {/* Content Body */}
                <div className="w-full px-6 md:px-10 mt-6 relative z-20 pb-10 space-y-6">

                    {/* First Aid Banner */}
                    <FirstAidBanner />

                    {/* Critical Info Banner */}
                    <div className="bg-card w-full rounded-2xl p-6 shadow-lg border border-border flex justify-around items-center divide-x divide-border">
                        <div className="flex flex-col items-center px-4 w-1/2">
                            <Droplets size={28} className="text-primary mb-2" />
                            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Tipo de Sangre</span>
                            <span className="text-3xl font-black text-foreground">{profile.blood_type || "N/A"}</span>
                        </div>
                        <div className="flex flex-col items-center px-4 w-1/2">
                            <CheckCircle2 size={28} className={profile.organ_donor ? "text-green-500 mb-2" : "text-muted-foreground mb-2"} />
                            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1 flex items-center gap-1 text-center">
                                Donador
                            </span>
                            <span className="text-xl font-bold text-foreground">{profile.organ_donor ? "SÍ" : "NO"}</span>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">

                        {/* MEDICAL DETAILS */}
                        {(allergiesArray.length > 0 || profile.medical_conditions || profile.important_medications) && (
                            <div className="bg-muted/50 rounded-2xl p-5 border border-border/80 outline outline-1 outline-transparent hover:outline-primary/20 transition-all">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border/50 pb-2">
                                    <FileText size={18} className="text-primary" /> Historial Médico
                                </h3>
                                <div className="space-y-4">

                                    {allergiesArray.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-bold text-destructive uppercase mb-2 flex items-center gap-1">
                                                <AlertTriangle size={14} /> Alergias
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {allergiesArray.map((allergy, i) => (
                                                    <span key={i} className="bg-destructive/10 text-destructive border border-destructive/20 px-3 py-1 rounded-full text-sm font-bold">
                                                        {allergy}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {profile.medical_conditions && (
                                        <div>
                                            <h4 className="text-xs font-bold text-muted-foreground uppercase mb-1">Condiciones Médicas</h4>
                                            <p className="text-sm font-medium leading-relaxed bg-background p-3 rounded-xl border border-border">{profile.medical_conditions}</p>
                                        </div>
                                    )}
                                    {profile.important_medications && (
                                        <div>
                                            <h4 className="text-xs font-bold text-muted-foreground uppercase mb-1">Medicamentos Importantes</h4>
                                            <p className="text-sm font-medium leading-relaxed bg-background p-3 rounded-xl border border-border">{profile.important_medications}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* INSURANCE DETAILS */}
                        {(profile.medical_system || profile.aseguradora || profile.numero_poliza) && profile.medical_system !== "Sin seguro médico" && (
                            <div className="bg-primary/5 rounded-2xl p-6 border-2 border-primary/20 shadow-sm relative overflow-hidden group">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wider mb-4 border-b border-primary/20 pb-3">
                                    <Info size={20} className="text-primary" /> Información de Seguro
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-5 relative z-10">
                                    {/* PRIVADO */}
                                    {(!profile.medical_system || profile.medical_system.includes("Privado") || profile.medical_system === "Otro") && (
                                        <>
                                            {profile.aseguradora && (
                                                <div>
                                                    <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">🏦 Aseguradora</h4>
                                                    <p className="font-black text-lg">{profile.aseguradora}</p>
                                                </div>
                                            )}
                                            {profile.numero_poliza && (
                                                <div>
                                                    <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">🔢 Número de Póliza</h4>
                                                    <p className="font-bold text-lg font-mono bg-background px-2 py-0.5 rounded border inline-block mt-0.5">{maskNumber(profile.numero_poliza)}</p>
                                                </div>
                                            )}
                                            {profile.nombre_asegurado && (
                                                <div className="md:col-span-2 mt-2">
                                                    <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Titular</h4>
                                                    <p className="font-bold text-base">{profile.nombre_asegurado}</p>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* PUBLICO (IMSS, ISSSTE, PEMEX, etc) */}
                                    {profile.medical_system && !profile.medical_system.includes("Privado") && profile.medical_system !== "Otro" && (
                                        <>
                                            <div>
                                                <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">🏥 Institución</h4>
                                                <p className="font-black text-lg">{profile.medical_system}</p>
                                            </div>
                                            {profile.nss && (
                                                <div>
                                                    <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">NSS</h4>
                                                    <p className="font-bold text-lg font-mono bg-background px-2 py-0.5 rounded border inline-block mt-0.5">{maskNumber(profile.nss)}</p>
                                                </div>
                                            )}
                                            {profile.numero_afiliacion && (
                                                <div>
                                                    <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Afiliación</h4>
                                                    <p className="font-bold text-lg font-mono bg-background px-2 py-0.5 rounded border inline-block mt-0.5">{maskNumber(profile.numero_afiliacion)}</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Call Action & Document */}
                                <div className="space-y-4 relative z-10 w-full mt-4">
                                    {(() => {
                                        const sys = profile.medical_system;
                                        let phone = profile.telefono_aseguradora;
                                        let label = `Llamar Institución`;

                                        if (sys === "IMSS") { phone = "8002222668"; label = "Llamar a IMSS"; }
                                        else if (sys === "ISSSTE") { phone = "8000190900"; label = "Llamar ISSSTE"; }
                                        else if (sys === "PEMEX") { phone = "5519442500"; label = "Urgencias PEMEX"; }

                                        if (phone) {
                                            const cleanPhone = phone.replace(/\D/g, '');
                                            return (
                                                <a href={`tel:${cleanPhone}`} className="w-full bg-blue-600 text-white flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm hover:scale-[1.02] transition-transform shadow-md">
                                                    <PhoneCall size={18} /> {label}
                                                </a>
                                            );
                                        }
                                        return null;
                                    })()}

                                    {signedPolizaUrl && (
                                        <div className="w-full mt-4 pt-4 border-t border-primary/20">
                                            <a href={signedPolizaUrl} target="_blank" rel="noopener noreferrer" className="w-full block bg-background border-2 border-primary text-primary flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm hover:bg-primary/5 transition-colors shadow-sm">
                                                <FileText size={20} /> Ver Póliza Completa
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* EMERGENCY CONTACTS */}
                        {emergencyContactsArray.length > 0 && (
                            <div className="bg-destructive/10 rounded-2xl p-5 border border-destructive/20 relative overflow-hidden group">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-destructive uppercase tracking-wider mb-4 border-b border-destructive/20 pb-2">
                                    <PhoneCall size={18} /> Contactos de Emergencia
                                </h3>

                                <div className="space-y-4 relative z-10">
                                    {emergencyContactsArray.map((contact, idx) => {
                                        const cleanPhone = contact.phone ? contact.phone.replace(/\D/g, '') : "";
                                        const maskedPhone = maskNumber(contact.phone);
                                        const nameParts = contact.name ? contact.name.trim().split(' ') : [];
                                        const maskedName = nameParts.length > 0 ? nameParts[0] : "Contacto";

                                        return (
                                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-destructive/10 shadow-sm">
                                                <div>
                                                    <p className="text-base font-bold text-foreground pointer-events-none">{maskedName}</p>
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase pointer-events-none">Familiar / Contacto {idx + 1}</p>
                                                </div>
                                                {contact.phone && (
                                                    <a href={`tel:${cleanPhone}`} className="flex items-center justify-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-xl text-sm font-bold hover:scale-105 transition-transform shadow-sm whitespace-nowrap">
                                                        Llamar {maskedPhone}
                                                    </a>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* LOCATION & NOTES */}
                        {(profile.additional_notes || profile.google_maps_link) && (
                            <div className="bg-primary/5 rounded-2xl p-5 border border-primary/20">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wider mb-3">
                                    <ShieldAlert size={18} /> Notas e Instrucciones
                                </h3>
                                <div className="space-y-3">
                                    {profile.additional_notes && (
                                        <div>
                                            <p className="text-sm italic text-foreground opacity-90 leading-relaxed font-medium pointer-events-none">"{profile.additional_notes}"</p>
                                        </div>
                                    )}
                                    {profile.google_maps_link && (
                                        <div className="mt-4 pt-3 border-t border-primary/10">
                                            <h4 className="text-[11px] font-black text-primary uppercase tracking-widest mb-2">Hospital / Clínica Preferida</h4>

                                            {profile.google_maps_link.startsWith('http') ? (
                                                <a
                                                    href={profile.google_maps_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full bg-blue-600 text-white flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base hover:scale-[1.02] transition-transform shadow-md"
                                                >
                                                    📍 Abrir en Maps
                                                </a>
                                            ) : (
                                                <p className="text-sm font-bold bg-background p-3 rounded-xl border border-border inline-block pointer-events-none w-full">{profile.google_maps_link}</p>
                                            )}

                                            <p className="text-[10px] text-muted-foreground mt-3 leading-tight pointer-events-none opacity-80">En caso de emergencia, el personal médico determinará el hospital más adecuado según tu estado de salud y criterio profesional. Este dato es solo una referencia.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>

                </div>

                {/* Footer */}
                <div className="w-full p-6 mt-auto text-center border-t border-border/50 bg-muted/30">
                    <p className="text-[10px] md:text-xs font-semibold text-muted-foreground">
                        Información proporcionada por el usuario.<br />
                        Este sistema no sustituye atención médica profesional.
                    </p>
                    <p className="text-[10px] text-muted-foreground opacity-40 mt-3 font-mono">
                        REF: {chip.folio} | V3
                    </p>
                </div>
            </div>
        </div>
    );
}
