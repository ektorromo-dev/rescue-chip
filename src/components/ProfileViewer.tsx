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

    const getAutoTheme = () => {
        const h = new Date().getHours();
        return (h >= 6 && h < 19) ? 'day' : 'night';
    };
    const [theme, setTheme] = useState<'day' | 'night'>('night');

    useEffect(() => {
        setTheme(getAutoTheme());
    }, []);
    const toggleTheme = () => setTheme(t => t === 'day' ? 'night' : 'day');
    const d = theme === 'day';

    const C = {
        bgPage: d ? '#F5F0E8' : '#0A0A08',
        bgCard: d ? '#FEFCF8' : '#131311',
        bgInput: d ? '#EDE8DE' : '#1A1A18',
        bgSection: d ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
        textMain: d ? '#1A100A' : '#F4F0EB',
        textMuted: d ? '#5C4F42' : '#9E9A95',
        textDim: d ? '#8C7F72' : '#6B6762',
        border: d ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.08)',
        borderSoft: d ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.12)',
        red: d ? '#B91C1C' : '#E8231A',
        redDim: d ? 'rgba(185,28,28,0.10)' : 'rgba(232,35,26,0.14)',
        redBorder: d ? 'rgba(185,28,28,0.35)' : 'rgba(232,35,26,0.30)',
        amber: d ? '#92400E' : '#D97706',
        amberDim: d ? 'rgba(146,64,14,0.10)' : 'rgba(217,119,6,0.14)',
        amberBorder: d ? 'rgba(146,64,14,0.30)' : 'rgba(217,119,6,0.28)',
        green: d ? '#166534' : '#22c55e',
        greenDim: d ? 'rgba(22,101,52,0.12)' : 'rgba(34,197,94,0.14)',
        blue: d ? '#1D4ED8' : '#3B82F6',
        blueDim: d ? 'rgba(29,78,216,0.12)' : 'rgba(59,130,246,0.15)',
        orange: d ? '#C2410C' : '#F97316',
        orangeDim: d ? 'rgba(194,65,12,0.08)' : 'rgba(249,115,22,0.10)',
        orangeBorder: d ? 'rgba(194,65,12,0.28)' : 'rgba(249,115,22,0.25)',
        tickerBg: d ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
        tickerText: d ? 'rgba(26,16,10,0.45)' : 'rgba(244,240,235,0.4)',
    };

    const [hasConsented, setHasConsented] = useState<boolean>(isDemo);
    const [isEmergency, setIsEmergency] = useState<boolean>(isDemo);
    const [sessionExpired, setSessionExpired] = useState<boolean>(false);
    const [timeLeft, setTimeLeft] = useState<number>(420); // 7 minutes
    const [sessionToken, setSessionToken] = useState<string>("");
    const [screenshotWarning, setScreenshotWarning] = useState<boolean>(false);
    const [geoError, setGeoError] = useState<boolean>(false);
    const [isLoadingConsent, setIsLoadingConsent] = useState<boolean>(false);
    const [photoOpen, setPhotoOpen] = useState(false);

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
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
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
        fetch('/api/log-access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chip_folio: chip.folio,
                tipo: type,
                latitud: lat,
                longitud: lng,
                session_token: token
            })
        }).catch(e => console.error("Error logging access", e));

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
    function nombreCorto(fullName: string | null | undefined): string {
        if (!fullName?.trim()) return "Motociclista";
        const partes = fullName.trim().split(/\s+/);
        return partes.length === 1 ? partes[0] : `${partes[0]} ${partes[1]}`;
    }

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

    const logScan = async (tipo: 'emergencia' | 'consulta') => {
        try {
            let latitud: number | null = null;
            let longitud: number | null = null;
            if (navigator.geolocation) {
                await new Promise<void>((resolve) => {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => { latitud = pos.coords.latitude; longitud = pos.coords.longitude; resolve(); },
                        () => resolve(),
                        { timeout: 3000 }
                    );
                });
            }
            await fetch('/api/log-scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chip_folio: chip.folio, tipo, latitud, longitud }),
            });
        } catch (e) {
            console.error('logScan error:', e);
        }
    };

    if (!hasConsented && !sessionExpired) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: C.bgPage, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
                <div style={{ backgroundColor: C.bgCard, width: '100%', maxWidth: '480px', borderRadius: '20px', padding: '48px 32px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <ShieldAlert size={48} style={{ margin: '0 auto', color: C.red, marginBottom: '24px', display: 'block' }} />
                    <h1 style={{ fontSize: '28px', fontWeight: 900, textAlign: 'center', marginBottom: '16px', color: C.textMain }}>Acceso Restringido</h1>

                    <div style={{ backgroundColor: C.bgSection, padding: '16px', borderRadius: '12px', fontSize: '12px', color: C.textMuted, textAlign: 'justify', lineHeight: 1.6, marginBottom: '24px' }}>
                        <strong>AVISO DE PRIVACIDAD:</strong> La información contenida en este perfil es confidencial y está protegida por la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP). Este acceso queda registrado con fecha, hora, ubicación aproximada y dispositivo. El uso indebido de esta información será perseguido y sancionado conforme a la legislación mexicana vigente, incluyendo los artículos 67 y 68 de la LFPDPPP que establecen penas de 3 a 5 años de prisión y multas de 100 a 320,000 días de UMA.
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                            onClick={() => { handleConsent('emergencia'); logScan('emergencia'); }}
                            disabled={isLoadingConsent}
                            style={{ width: '100%', backgroundColor: C.red, color: C.textMain, padding: '14px 24px', borderRadius: '12px', fontWeight: 900, fontSize: '14px', border: 'none', cursor: isLoadingConsent ? 'not-allowed' : 'pointer', textTransform: 'uppercase', opacity: isLoadingConsent ? 0.5 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isLoadingConsent ? "PROCESANDO..." : <><AlertTriangle size={20} /> ES UNA EMERGENCIA REAL</>}
                            </span>
                            {!isLoadingConsent && <span style={{ fontSize: '10px', fontWeight: 400, opacity: 0.8, letterSpacing: '0.05em' }}>(Notificará contactos de emergencia)</span>}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER EXPIRED SCREEN ---
    if (sessionExpired) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: C.bgPage, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
                <div style={{ backgroundColor: C.bgCard, width: '100%', maxWidth: '480px', borderRadius: '20px', padding: '40px', textAlign: 'center', border: '1px solid rgba(232,35,26,0.3)' }}>
                    <Clock size={56} style={{ margin: '0 auto', color: C.textMuted, marginBottom: '24px', display: 'block' }} />
                    <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '16px', color: C.textMain }}>Sesión Expirada</h2>
                    <p style={{ color: C.textMuted, marginBottom: '32px' }}>Por seguridad, esta sesión ha expirado. Si necesitas ver los datos nuevamente, escanea el chip otra vez.</p>
                    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: C.red, color: C.textMain, padding: '12px 24px', borderRadius: '12px', fontWeight: 700, textDecoration: 'none' }}>
                        Entendido
                    </Link>
                </div>
            </div>
        );
    }

    // --- RENDER PROFILE ---
    return (
        <>
            {/* Watermark */}
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.06, pointerEvents: 'none', zIndex: 1, overflow: 'hidden' }}>
                {Array.from({ length: 48 }).map((_, i) => {
                    const col = i % 4;
                    const row = Math.floor(i / 4);
                    return (
                        <span key={i} style={{
                            position: 'absolute',
                            left: `${col * 28 - 8}%`,
                            top: `${row * 13 - 2}%`,
                            transform: 'rotate(-35deg)',
                            transformOrigin: 'center center',
                            whiteSpace: 'nowrap',
                            fontSize: '15px',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            color: C.textMuted,
                        }}>
                            CONFIDENCIAL · ACCESO REGISTRADO
                        </span>
                    );
                })}
            </div>

            <div style={{ minHeight: '100vh', backgroundColor: C.bgPage, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingBottom: '48px', paddingTop: '48px', WebkitTouchCallout: 'none', userSelect: 'none', position: 'relative', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>

                <button
                    onClick={toggleTheme}
                    style={{
                        position: 'fixed',
                        top: '12px',
                        right: '12px',
                        zIndex: 999,
                        background: C.bgCard,
                        border: `1px solid ${C.borderSoft}`,
                        borderRadius: '999px',
                        padding: '7px 14px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: C.textMuted,
                        fontFamily: "'Inter', sans-serif",
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                    }}
                >
                    {theme === 'day' ? '🌙 Noche' : '☀️ Día'}
                </button>

                <div style={{ width: '100%', maxWidth: '512px', backgroundColor: C.bgCard, borderRadius: '40px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 10 }}>

                    {/* Screenshot Warning */}
                    {screenshotWarning && (
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', backgroundColor: C.red, color: 'white', padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: 700, zIndex: 200, animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
                            Se ha detectado un posible intento de captura de pantalla. Este acceso está registrado.
                        </div>
                    )}

                    {/* Demo Notice */}
                    {isDemo && (
                        <div style={{ width: '100%', backgroundColor: C.blue, color: 'white', padding: '8px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', position: 'relative', zIndex: 60 }}>
                            Este es un perfil de demostración con datos ficticios
                        </div>
                    )}

                    {/* Geo Error Notice */}
                    {geoError && !isDemo && (
                        <div style={{ width: '100%', backgroundColor: 'rgba(220,38,38,0.9)', color: 'white', padding: '12px 24px', textAlign: 'center', fontSize: '11px', fontWeight: 700, lineHeight: 1.2, position: 'relative', zIndex: 60, borderBottom: '1px solid #7F1D1D', letterSpacing: '0.025em', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                            ⚠️ AVISO: No se pudo obtener tu ubicación. Este acceso queda registrado con tu dirección IP y dispositivo. El uso indebido de esta información será perseguido legalmente.
                        </div>
                    )}

                    {/* Security Bar */}
                    {!isDemo && (
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', backgroundColor: '#09090b', color: '#d4d4d8', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', position: 'relative', zIndex: 50 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Lock size={12} /> Seguro</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f87171' }}>
                                Sesión expira en: {formatTime(timeLeft)}
                            </span>
                        </div>
                    )}

                    {/* 1. BARRA SUPERIOR FIJA (modo consulta / emergencia) */}
                    {!isDemo && isEmergency && (
                        <div style={{ width: '100%', backgroundColor: C.red, color: 'white', padding: '8px 16px', fontSize: '12px', fontWeight: 900, textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', zIndex: 60, position: 'relative' }}>
                            <AlertTriangle size={16} /> MODO EMERGENCIA - Contactos notificados
                        </div>
                    )}
                    {!isDemo && !isEmergency && (
                        <div style={{ width: '100%', backgroundColor: C.bgInput, color: C.textMuted, padding: '8px 16px', fontSize: '11px', fontWeight: 900, textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', zIndex: 60, position: 'relative', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            MODO CONSULTA - No se notificará a contactos
                        </div>
                    )}

                    {/* 2. HERO FOTO (sección roja superior) -> NOW DARK WITH FULL WIDTH PHOTO */}
                    <div style={{
                        backgroundColor: C.bgInput,
                        padding: '32px 24px 24px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px',
                        borderBottom: '1px solid rgba(255,255,255,0.06)'
                    }}>
                        {/* Foto circular */}
                        <div
                            onClick={() => profile.photo_url && setPhotoOpen(true)}
                            style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: '3px solid rgba(232,35,26,0.5)',
                                boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.4)',
                                backgroundColor: C.bgInput,
                                flexShrink: 0,
                                cursor: profile.photo_url ? 'pointer' : 'default'
                            }}>
                            {isDemo ? (
                                <div style={{
                                    width: '100%', height: '100%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '40px', fontWeight: 900, color: C.textMuted
                                }}>
                                    CM
                                </div>
                            ) : profile.photo_url ? (
                                <img
                                    src={profile.photo_url}
                                    alt={nombreCorto(profile.full_name)}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                            ) : (
                                <div style={{
                                    width: '100%', height: '100%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '40px', fontWeight: 900, color: C.textMuted
                                }}>
                                    {nombreCorto(profile.full_name)?.charAt(0) || '?'}
                                </div>
                            )}
                        </div>

                        {/* Nombre y datos debajo del círculo */}
                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{
                                fontSize: '22px', fontWeight: 900, color: C.textMain,
                                margin: 0, lineHeight: 1.2
                            }}>
                                {isDemo ? 'Carlos Martínez' : nombreCorto(profile.full_name)}
                            </h2>
                            <p style={{
                                fontSize: '14px', color: C.textMuted, marginTop: '6px', marginBottom: 0
                            }}>
                                {[isDemo ? '32 años' : (profile.age && `${profile.age} años`), isDemo ? 'Monterrey, NL' : profile.city].filter(Boolean).join(' • ')}
                            </p>
                        </div>
                    </div>     {/* Aviso "NO RETIRAR EL CASCO" */}
                    {profile.is_motorcyclist && (
                        <div style={{ width: '100%', backgroundColor: 'rgba(220,38,38,0.9)', color: 'white', padding: '8px 16px', fontSize: '12px', fontWeight: 900, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <ShieldAlert size={16} /> PRECAUCIÓN: NO RETIRAR EL CASCO
                        </div>
                    )}
                </div>

                {/* Content Body */}
                <div style={{ width: '100%', maxWidth: '512px', margin: '0 auto', padding: '24px 32px', position: 'relative', zIndex: 20, display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* First Aid Banner */}
                    <FirstAidBanner textColor={C.textMain} />

                    {/* 3. CARD STATS */}
                    <div style={{ backgroundColor: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1px 1fr' }}>
                        {/* Tipo de Sangre */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '0 8px' }}>
                            <Droplets size={24} style={{ color: C.red, marginBottom: '4px' }} />
                            <span style={{ fontSize: '11px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>Tipo de Sangre</span>
                            <span style={{
                                fontSize: (profile.blood_type && profile.blood_type.trim() !== '' && !profile.blood_type.toLowerCase().includes('desconoc'))
                                    ? (profile.blood_type.length > 3 ? '16px' : '28px')
                                    : '13px',
                                fontWeight: 900,
                                color: C.red,
                                textAlign: 'center',
                                lineHeight: '1.3',
                                wordBreak: 'break-word',
                                width: '100%',
                                display: 'block',
                            }}>
                                {(profile.blood_type && profile.blood_type.trim() !== '' && !profile.blood_type.toLowerCase().includes('desconoc'))
                                    ? profile.blood_type
                                    : 'Desconocido'}
                            </span>
                        </div>
                        {/* Divider */}
                        <div style={{ backgroundColor: C.border }} />
                        {/* Donador */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '0 8px' }}>
                            <CheckCircle2 size={24} style={{ color: profile.organ_donor ? C.green : C.textMuted, marginBottom: '4px' }} />
                            <span style={{ fontSize: '11px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>Donador</span>
                            <span style={{ fontSize: '28px', fontWeight: 900, color: C.textMain, textAlign: 'center', lineHeight: '1.2' }}>
                                {profile.organ_donor ? 'SÍ' : 'NO'}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {/* MEDICAL DETAILS */}
                        {(allergiesArray.length > 0) && (
                            /* 4. SECCIÓN ALERGIAS */
                            <div style={{ backgroundColor: C.redDim, border: '1px solid rgba(232,35,26,0.2)', borderRadius: '16px', padding: '20px 24px' }}>
                                <h4 style={{ color: C.red, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <AlertTriangle size={16} /> Alergias
                                </h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {allergiesArray.map((allergy, i) => (
                                        <span key={i} style={{ backgroundColor: 'rgba(232,35,26,0.1)', border: '1px solid rgba(232,35,26,0.25)', borderRadius: '8px', padding: '4px 12px', fontSize: '13px', color: C.textMain, display: 'inline-block', fontWeight: 700 }}>
                                            {allergy}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 5. SECCIONES INFORMATIVAS */}
                        {(profile.medical_conditions || profile.important_medications) && (
                            <div style={{ backgroundColor: C.amberDim, border: '1px solid rgba(217,119,6,0.2)', borderRadius: '16px', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                                {profile.medical_conditions && (
                                    <div>
                                        <h4 style={{ color: C.amber, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>Condiciones Médicas</h4>
                                        <p style={{ fontSize: '14px', fontWeight: 500, lineHeight: 1.6, backgroundColor: C.bgCard, padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', color: C.textMain }}>{profile.medical_conditions}</p>
                                    </div>
                                )}
                                {profile.important_medications && (
                                    <div>
                                        <h4 style={{ color: C.amber, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>Medicamentos Importantes</h4>
                                        <p style={{ fontSize: '14px', fontWeight: 500, lineHeight: 1.6, backgroundColor: C.bgCard, padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', color: C.textMain }}>{profile.important_medications}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* INSURANCE DETAILS */}
                        {(profile.medical_system || profile.aseguradora || profile.numero_poliza) && profile.medical_system !== "Sin seguro médico" && (
                            <div style={{ backgroundColor: C.bgCard, borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 900, color: C.textMain, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                                    <Info size={16} style={{ color: C.textMuted }} /> Información de Seguro
                                </h3>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                                    {/* PRIVADO */}
                                    {(!profile.medical_system || profile.medical_system.includes("Privado") || profile.medical_system === "Otro") && (
                                        <>
                                            {profile.aseguradora && (
                                                <div>
                                                    <h4 style={{ fontSize: '11px', fontWeight: 900, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>🏦 Aseguradora</h4>
                                                    <p style={{ fontWeight: 900, fontSize: '16px', color: C.textMain }}>{profile.aseguradora}</p>
                                                </div>
                                            )}
                                            {profile.numero_poliza && (
                                                <div>
                                                    <h4 style={{ fontSize: '11px', fontWeight: 900, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>🔢 Número de Póliza</h4>
                                                    <p style={{ fontWeight: 700, fontSize: '16px', color: C.textMain, backgroundColor: C.bgInput, padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', display: 'inline-block' }}>{maskNumber(profile.numero_poliza)}</p>
                                                </div>
                                            )}
                                            {profile.nombre_asegurado && (
                                                <div style={{ gridColumn: '1 / -1' }}>
                                                    <h4 style={{ fontSize: '11px', fontWeight: 900, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Titular</h4>
                                                    <p style={{ fontWeight: 700, fontSize: '16px', color: C.textMain }}>{profile.nombre_asegurado}</p>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* PUBLICO (IMSS, ISSSTE, PEMEX, etc) */}
                                    {profile.medical_system && !profile.medical_system.includes("Privado") && profile.medical_system !== "Otro" && (
                                        <>
                                            <div>
                                                <h4 style={{ fontSize: '11px', fontWeight: 900, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>🏥 Institución</h4>
                                                <p style={{ fontWeight: 900, fontSize: '16px', color: C.textMain }}>{profile.medical_system}</p>
                                            </div>
                                            {profile.nss && (
                                                <div>
                                                    <h4 style={{ fontSize: '11px', fontWeight: 900, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>NSS</h4>
                                                    <p style={{ fontWeight: 700, fontSize: '16px', color: C.textMain, backgroundColor: C.bgInput, padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', display: 'inline-block' }}>{maskNumber(profile.nss)}</p>
                                                </div>
                                            )}
                                            {profile.numero_afiliacion && (
                                                <div>
                                                    <h4 style={{ fontSize: '11px', fontWeight: 900, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Afiliación</h4>
                                                    <p style={{ fontWeight: 700, fontSize: '16px', color: C.textMain, backgroundColor: C.bgInput, padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', display: 'inline-block' }}>{maskNumber(profile.numero_afiliacion)}</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Call Action & Document */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                                                <a href={`tel:${cleanPhone}`} style={{ width: '100%', backgroundColor: C.bgSection, color: C.textMain, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '12px', fontWeight: 700, fontSize: '14px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.12)' }}>
                                                    <PhoneCall size={18} /> {label}
                                                </a>
                                            );
                                        }
                                        return null;
                                    })()}

                                    {signedPolizaUrl && (
                                        <div style={{ width: '100%', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                            <a href={signedPolizaUrl} target="_blank" rel="noopener noreferrer" style={{ width: '100%', display: 'flex', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: C.textMain, alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', borderRadius: '12px', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>
                                                <FileText size={20} /> Ver Póliza Completa
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 6. CONTACTOS DE EMERGENCIA */}
                        {emergencyContactsArray.length > 0 && (
                            <div style={{ backgroundColor: C.bgCard, border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 900, color: C.textMain, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <PhoneCall size={16} /> Contactos de Emergencia
                                </h3>

                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {emergencyContactsArray.map((contact, idx) => {
                                        const cleanPhone = contact.phone ? contact.phone.replace(/\D/g, '') : "";
                                        const maskedPhone = maskNumber(contact.phone);
                                        const nameParts = contact.name ? contact.name.trim().split(' ') : [];
                                        const maskedName = nameParts.length > 0 ? nameParts[0] : "Contacto";

                                        return (
                                            <div key={idx} style={{ padding: '16px 20px', borderBottom: idx < emergencyContactsArray.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <p style={{ fontSize: '15px', fontWeight: 700, color: C.textMain, marginBottom: '2px' }}>{maskedName}</p>
                                                        <p style={{ fontSize: '13px', color: C.textMuted }}>Familiar / Contacto {idx + 1}</p>
                                                    </div>
                                                    {contact.phone && (
                                                        <a href={`tel:${cleanPhone}`} style={{ backgroundColor: 'rgba(232,35,26,0.1)', border: '1px solid rgba(232,35,26,0.3)', color: C.red, borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                                                            <PhoneCall size={14} /> Llamar
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* LOCATION & NOTES */}
                        {(profile.additional_notes || profile.google_maps_link) && (
                            <div style={{ backgroundColor: C.bgInput, borderRadius: '16px', padding: '20px 24px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 900, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                                    <ShieldAlert size={16} /> Notas e Instrucciones
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {profile.additional_notes && (
                                        <div>
                                            <p style={{ fontSize: '14px', fontStyle: 'italic', color: C.textMain, opacity: 0.9, lineHeight: 1.6, fontWeight: 500 }}>"{profile.additional_notes}"</p>
                                        </div>
                                    )}
                                    {profile.google_maps_link && (
                                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                            <h4 style={{ fontSize: '11px', fontWeight: 900, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Hospital / Clínica Preferida</h4>

                                            {profile.hospital_name && (
                                                <p style={{ fontSize: '15px', fontWeight: 700, color: C.textMain, marginBottom: '8px', textAlign: 'center' }}>
                                                    🏥 {profile.hospital_name}
                                                </p>
                                            )}
                                            {profile.google_maps_link.startsWith('http') ? (
                                                <a
                                                    href={profile.google_maps_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ width: '100%', backgroundColor: C.blue, color: C.textMain, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', borderRadius: '12px', fontWeight: 700, fontSize: '14px', textDecoration: 'none', border: '1px solid #2563EB' }}
                                                >
                                                    📍 Abrir en Maps
                                                </a>
                                            ) : (
                                                <p style={{ fontSize: '14px', fontWeight: 700, backgroundColor: C.bgCard, padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', color: C.textMain, wordBreak: 'break-word' }}>{profile.google_maps_link}</p>
                                            )}

                                            <p style={{ fontSize: '10px', color: C.textMuted, marginTop: '12px', lineHeight: 1.4, opacity: 0.8 }}>En caso de emergencia, el personal médico determinará el hospital más adecuado según tu estado de salud y criterio profesional. Este dato es solo una referencia.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>

                </div>

                {/* 7. FOOTER */}
                <div style={{ width: '100%', backgroundColor: C.bgInput, borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 24px', textAlign: 'center' }}>
                    <p style={{ fontSize: '11px', color: 'rgba(158,154,149,0.5)', marginBottom: '12px', fontWeight: 600 }}>
                        Información proporcionada por el usuario.<br />
                        Este sistema no sustituye atención médica profesional.
                    </p>
                    <p style={{ fontSize: '10px', color: 'rgba(158,154,149,0.3)', fontFamily: 'monospace' }}>
                        REF: {chip.folio} | V3
                    </p>
                </div>

                {photoOpen && profile.photo_url && (
                    <div
                        onClick={() => setPhotoOpen(false)}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 9999,
                            backgroundColor: 'rgba(0,0,0,0.92)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'zoom-out'
                        }}
                    >
                        <img
                            src={profile.photo_url}
                            alt={nombreCorto(profile.full_name)}
                            style={{
                                maxWidth: '90vw', maxHeight: '85vh',
                                borderRadius: '16px',
                                objectFit: 'contain',
                                boxShadow: '0 25px 60px rgba(0,0,0,0.8)'
                            }}
                        />
                        <button
                            onClick={(e) => { e.stopPropagation(); setPhotoOpen(false); }}
                            style={{
                                position: 'fixed', top: '20px', right: '24px',
                                background: C.borderSoft, border: 'none',
                                color: C.textMain, fontSize: '24px', width: '40px', height: '40px',
                                borderRadius: '50%', cursor: 'pointer', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', lineHeight: 1
                            }}
                        >×</button>
                    </div>
                )}
            </div>
        </>
    );
}
