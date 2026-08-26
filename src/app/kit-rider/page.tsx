"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2, FileText, Download, CheckSquare, Square } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { validateAndFormatPhone, SUPPORTED_COUNTRIES, formatPhoneAsYouType } from "@/lib/phone-utils";
import type { CountryCode } from "libphonenumber-js";
import { KIT_RIDER_PDF_URL } from "@/lib/constants";

export interface RiderResource {
    id: string;
    titulo: string;
    descripcion: string;
    tipo: string;
    url: string;
    tamano?: string;
    badge?: string;
}

export const RIDER_RESOURCES: RiderResource[] = [
    {
        id: "manual-rider-solitario",
        titulo: "El Manual de El Rider Solitario",
        descripcion: "Qué hacer (y qué NO) en los primeros 10 minutos después de un accidente en moto en México.",
        tipo: "Manual PDF",
        url: "https://kaihkhyqjmattriozick.supabase.co/storage/v1/object/public/kit-rider/manual-rider-solitario_ilustrado.pdf?v=2",
        tamano: "PDF · 316 KB",
        badge: "Incluido",
    },
    {
        id: "donde-colocar-rescuechip",
        titulo: "Dónde colocar tu RescueChip",
        descripcion: "Guía visual de zonas recomendadas para instalar tu chip en el casco.",
        tipo: "Infografía",
        url: "https://kaihkhyqjmattriozick.supabase.co/storage/v1/object/public/kit-rider/Donde%20colocar%20RescueChip.png?v=2",
        tamano: "PNG · 2.7 MB",
        badge: undefined,
    },
];

function KitRiderContent() {
    const searchParams = useSearchParams();
    const [session, setSession] = useState<{ user?: { email?: string } } | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    // Selección de recursos (preparado para múltiples recursos)
    const [selectedResources, setSelectedResources] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        RIDER_RESOURCES.forEach((r) => {
            initial[r.id] = true;
        });
        return initial;
    });

    // Form state (para visitantes sin sesión)
    const [nombre, setNombre] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [selectedCountry, setSelectedCountry] = useState<CountryCode>("MX");
    const [whatsappError, setWhatsappError] = useState("");
    const [aceptaMarketing, setAceptaMarketing] = useState(false);

    // UI state
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [downloadReady, setDownloadReady] = useState(false);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoadingAuth(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setLoadingAuth(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const toggleResource = (id: string) => {
        setSelectedResources((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const hasSelectedResources = Object.values(selectedResources).some(Boolean);
    const activeResourcesList = RIDER_RESOURCES.filter((r) => selectedResources[r.id]);

    const handlePhoneChange = (val: string) => {
        const formatted = formatPhoneAsYouType(val, selectedCountry);
        setWhatsapp(formatted);
        if (whatsappError) setWhatsappError("");
    };

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMsg("");

        if (!hasSelectedResources) {
            setErrorMsg("Selecciona al menos un recurso para descargar.");
            return;
        }

        if (!nombre.trim()) {
            setErrorMsg("Por favor, ingresa tu nombre completo.");
            return;
        }

        const phoneValidation = validateAndFormatPhone(whatsapp, selectedCountry);
        if (!phoneValidation.isValid || !phoneValidation.formatted) {
            setErrorMsg(phoneValidation.error || "Número de WhatsApp inválido para el país seleccionado.");
            return;
        }

        if (!aceptaMarketing) {
            setErrorMsg("Debes aceptar el consentimiento para descargar el Kit del Rider.");
            return;
        }

        setSubmitting(true);

        try {
            const origen = searchParams.get("origen") || "direct";
            const res = await fetch("/api/kit-rider/lead", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nombre: nombre.trim(),
                    whatsapp: phoneValidation.formatted,
                    countryCode: selectedCountry,
                    acepta_marketing: true,
                    origen,
                }),
            });

            const data = (await res.json()) as { success?: boolean; error?: string; pdfUrl?: string };

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Ocurrió un error al procesar tu solicitud.");
            }

            // Mostrar estado de descarga lista (el usuario hace clic directo en el botón)
            setDownloadReady(true);
            setErrorMsg("");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Error inesperado al conectar con el servidor.";
            setErrorMsg(msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingAuth) {
        return (
            <div
                style={{
                    backgroundColor: "#131311",
                    padding: "96px 32px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#9E9A95",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderTop: "none",
                    borderRadius: "0 0 16px 16px",
                }}
            >
                <Loader2 size={48} style={{ color: "rgba(232,35,26,0.3)", marginBottom: "16px", animation: "spin 1s linear infinite" }} />
                <p style={{ fontWeight: 500, margin: 0 }}>Cargando información del Kit del Rider...</p>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: "#131311", border: "1px solid rgba(255,255,255,0.08)", borderTop: "none", borderRadius: "0 0 16px 16px", padding: "32px" }}>
            
            {/* CASO 1: USUARIO CON SESIÓN ACTIVA (BYPASS DIRECTO) */}
            {session ? (
                <div style={{ textAlign: "center", padding: "16px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", backgroundColor: "rgba(232,35,26,0.1)", border: "1px solid rgba(232,35,26,0.3)", borderRadius: "9999px", padding: "6px 16px", fontSize: "13px", color: "#F4F0EB" }}>
                        <CheckCircle2 size={16} style={{ color: "#E8231A" }} />
                        <span>Sesión activa: <strong style={{ color: "#F4F0EB" }}>{session.user?.email || "Usuario RescueChip"}</strong></span>
                    </div>

                    <p style={{ color: "#9E9A95", fontSize: "15px", maxWidth: "480px", margin: 0, lineHeight: 1.6 }}>
                        Como miembro activo de la comunidad RescueChip, tienes acceso directo e ilimitado a todos los materiales del Kit del Rider.
                    </p>

                    {/* Lista de recursos descargables */}
                    <div style={{ width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", gap: "12px" }}>
                        {RIDER_RESOURCES.map((recurso) => (
                            <a
                                key={recurso.id}
                                href={recurso.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "16px 20px",
                                    backgroundColor: "#E8231A",
                                    color: "#fff",
                                    borderRadius: "14px",
                                    textDecoration: "none",
                                    fontWeight: 700,
                                    fontSize: "16px",
                                    boxShadow: "0 4px 14px rgba(232,35,26,0.3)",
                                    transition: "background-color 0.2s",
                                }}
                            >
                                <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <FileText size={20} />
                                    Descargar {recurso.tipo === "Manual PDF" || recurso.tipo === "PDF" ? "el PDF" : recurso.tipo}
                                </span>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", opacity: 0.9 }}>
                                    <Download size={16} /> {recurso.tamano || "Descargar"}
                                </span>
                            </a>
                        ))}
                    </div>

                    <Link
                        href="/dashboard"
                        style={{
                            fontSize: "14px",
                            color: "#9E9A95",
                            textDecoration: "none",
                            transition: "color 0.2s",
                            marginTop: "8px",
                        }}
                    >
                        ← Volver a mi panel
                    </Link>
                </div>
            ) : downloadReady ? (
                /* ESTADO TRAS SUBMIT EXITOSO (SIN SESIÓN) */
                <div style={{ textAlign: "center", padding: "16px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            backgroundColor: "rgba(34,197,94,0.1)",
                            border: "1px solid rgba(34,197,94,0.3)",
                            borderRadius: "9999px",
                            padding: "6px 16px",
                            fontSize: "13px",
                            color: "#4ade80",
                        }}
                    >
                        <CheckCircle2 size={16} />
                        <span>¡Registro completado con éxito!</span>
                    </div>

                    <p style={{ color: "#F4F0EB", fontSize: "16px", fontWeight: 600, maxWidth: "480px", margin: 0, lineHeight: 1.5 }}>
                        Haz clic a continuación para descargar tu material:
                    </p>

                    <div style={{ width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", gap: "12px" }}>
                        {activeResourcesList.map((recurso) => (
                            <a
                                key={recurso.id}
                                href={recurso.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "18px 20px",
                                    backgroundColor: "#E8231A",
                                    color: "#fff",
                                    borderRadius: "14px",
                                    textDecoration: "none",
                                    fontWeight: 900,
                                    fontSize: "17px",
                                    boxShadow: "0 4px 16px rgba(232,35,26,0.4)",
                                    transition: "all 0.2s",
                                }}
                            >
                                <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <FileText size={22} />
                                    Descargar {recurso.tipo === "Manual PDF" || recurso.tipo === "PDF" ? "el PDF" : recurso.tipo}
                                </span>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600 }}>
                                    <Download size={18} /> {recurso.tamano || "Descargar"}
                                </span>
                            </a>
                        ))}
                    </div>

                    <p style={{ fontSize: "13px", color: "#9E9A95", margin: "8px 0 0 0" }}>
                        El archivo se abrirá en tu lector de documentos. Puedes guardarlo en tu celular para tenerlo siempre accesible.
                    </p>
                </div>
            ) : (
                /* CASO 2: VISITANTE SIN SESIÓN (FORMULARIO CON SELECCIÓN DE RECURSOS) */
                <div>
                    {errorMsg && (
                        <div
                            style={{
                                padding: "12px 16px",
                                marginBottom: "24px",
                                backgroundColor: "rgba(232,35,26,0.1)",
                                color: "#E8231A",
                                border: "1px solid rgba(232,35,26,0.25)",
                                borderRadius: "10px",
                                fontSize: "13px",
                                fontWeight: 600,
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <AlertCircle size={18} /> {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                        
                        {/* Selector de Recursos Disponibles (Array extensible) */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#F4F0EB" }}>
                                Materiales incluidos en esta descarga:
                            </label>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {RIDER_RESOURCES.map((recurso) => {
                                    const isChecked = !!selectedResources[recurso.id];
                                    return (
                                        <div
                                            key={recurso.id}
                                            onClick={() => toggleResource(recurso.id)}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                padding: "14px 16px",
                                                backgroundColor: isChecked ? "rgba(232,35,26,0.06)" : "#1A1A18",
                                                border: isChecked ? "1px solid rgba(232,35,26,0.3)" : "1px solid rgba(255,255,255,0.06)",
                                                borderRadius: "10px",
                                                cursor: "pointer",
                                                transition: "all 0.2s",
                                            }}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                <div style={{ color: isChecked ? "#E8231A" : "#9E9A95", display: "flex", alignItems: "center" }}>
                                                    {isChecked ? <CheckSquare size={20} /> : <Square size={20} />}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#F4F0EB" }}>
                                                        {recurso.titulo}
                                                    </div>
                                                    <div style={{ fontSize: "12px", color: "#9E9A95", marginTop: "2px", lineHeight: "1.4" }}>
                                                        {recurso.descripcion}
                                                    </div>
                                                </div>
                                            </div>
                                            {recurso.badge && (
                                                <span
                                                    style={{
                                                        fontSize: "11px",
                                                        fontWeight: 700,
                                                        color: "#E8231A",
                                                        backgroundColor: "rgba(232,35,26,0.15)",
                                                        padding: "3px 8px",
                                                        borderRadius: "4px",
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.5px",
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {recurso.badge}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Nombre Completo */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label
                                htmlFor="nombre"
                                style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#9E9A95" }}
                            >
                                Nombre Completo <span style={{ color: "#E8231A" }}>*</span>
                            </label>
                            <input
                                type="text"
                                id="nombre"
                                name="nombre"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                placeholder="Ej. Carlos Mendoza"
                                required
                                style={{
                                    width: "100%",
                                    backgroundColor: "#1A1A18",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "10px",
                                    padding: "12px 16px",
                                    fontSize: "15px",
                                    color: "#F4F0EB",
                                    outline: "none",
                                    boxSizing: "border-box",
                                    transition: "border-color 0.2s",
                                }}
                                onFocus={(e) => (e.target.style.borderColor = "rgba(232,35,26,0.5)")}
                                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                            />
                        </div>

                        {/* WhatsApp con selector de país */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label
                                htmlFor="whatsapp"
                                style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#9E9A95" }}
                            >
                                Número de WhatsApp <span style={{ color: "#E8231A" }}>*</span>
                            </label>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <select
                                    value={selectedCountry}
                                    onChange={(e) => {
                                        const code = e.target.value as CountryCode;
                                        setSelectedCountry(code);
                                        if (whatsapp) handlePhoneChange(whatsapp);
                                    }}
                                    style={{
                                        width: "120px",
                                        backgroundColor: "#1A1A18",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        borderRadius: "10px",
                                        padding: "12px 8px",
                                        fontSize: "14px",
                                        color: "#F4F0EB",
                                        outline: "none",
                                        cursor: "pointer",
                                    }}
                                >
                                    {SUPPORTED_COUNTRIES.map((c) => (
                                        <option key={c.code} value={c.code}>
                                            {c.flag} {c.dialCode}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="tel"
                                    id="whatsapp"
                                    name="whatsapp"
                                    value={whatsapp}
                                    onChange={(e) => handlePhoneChange(e.target.value)}
                                    placeholder={
                                        SUPPORTED_COUNTRIES.find((c) => c.code === selectedCountry)?.placeholder ||
                                        "55 1234 5678"
                                    }
                                    required
                                    style={{
                                        flex: 1,
                                        backgroundColor: "#1A1A18",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        borderRadius: "10px",
                                        padding: "12px 16px",
                                        fontSize: "15px",
                                        color: "#F4F0EB",
                                        outline: "none",
                                        boxSizing: "border-box",
                                        transition: "border-color 0.2s",
                                    }}
                                    onFocus={(e) => (e.target.style.borderColor = "rgba(232,35,26,0.5)")}
                                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                                />
                            </div>
                        </div>

                        {/* Checkbox de Consentimiento */}
                        <div
                            style={{
                                background: "rgba(232,35,26,0.05)",
                                border: "1px solid rgba(232,35,26,0.2)",
                                borderRadius: "10px",
                                padding: "16px",
                            }}
                        >
                            <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                                <input
                                    type="checkbox"
                                    checked={aceptaMarketing}
                                    onChange={(e) => setAceptaMarketing(e.target.checked)}
                                    style={{ marginTop: "2px", flexShrink: 0, accentColor: "#E8231A", width: "18px", height: "18px" }}
                                />
                                <span style={{ fontSize: "13px", color: "#C8C0B4", lineHeight: "1.5", fontWeight: 500 }}>
                                    Acepto recibir información de RescueChip por WhatsApp o correo.
                                </span>
                            </label>
                        </div>

                        {/* Botón Submit */}
                        <button
                            type="submit"
                            disabled={!aceptaMarketing || submitting || !nombre.trim() || !whatsapp.trim() || !hasSelectedResources}
                            style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                backgroundColor: "#E8231A",
                                color: "#fff",
                                height: "60px",
                                borderRadius: "16px",
                                fontSize: "18px",
                                fontWeight: 900,
                                border: "none",
                                cursor: !aceptaMarketing || submitting || !nombre.trim() || !whatsapp.trim() || !hasSelectedResources ? "not-allowed" : "pointer",
                                opacity: !aceptaMarketing || submitting || !nombre.trim() || !whatsapp.trim() || !hasSelectedResources ? 0.4 : 1,
                                transition: "all 0.2s",
                                boxShadow: "0 4px 14px rgba(232,35,26,0.3)",
                            }}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 size={22} style={{ animation: "spin 1s linear infinite" }} />
                                    <span>Generando acceso...</span>
                                </>
                            ) : (
                                <>
                                    <Download size={22} />
                                    <span>Descargar Kit del Rider</span>
                                </>
                            )}
                        </button>

                        <div style={{ textAlign: "center", marginTop: "8px" }}>
                            <span style={{ fontSize: "13px", color: "#9E9A95" }}>¿Ya tienes cuenta en RescueChip? </span>
                            <Link href="/login" style={{ fontSize: "13px", color: "#E8231A", textDecoration: "none", fontWeight: 600 }}>
                                Iniciar sesión
                            </Link>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default function KitRiderPage() {
    return (
        <div
            style={{
                minHeight: "100vh",
                backgroundColor: "#0A0A08",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "40px 16px",
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            }}
        >
            <div style={{ width: "100%", maxWidth: "640px" }}>
                {/* Header Card */}
                <div
                    style={{
                        background: "linear-gradient(135deg, #1C0A09 0%, #2C1210 60%, #1A0808 100%)",
                        padding: "40px 32px",
                        border: "1px solid rgba(232,35,26,0.35)",
                        borderRadius: "16px 16px 0 0",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    <Link
                        href="/"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            backgroundColor: "rgba(255,255,255,0.05)",
                            padding: "6px 12px",
                            borderRadius: "9999px",
                            color: "#9E9A95",
                            textDecoration: "none",
                            marginBottom: "24px",
                            fontSize: "12px",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            fontWeight: 500,
                        }}
                    >
                        <ArrowLeft size={16} /> Volver al Inicio
                    </Link>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                        <div style={{ backgroundColor: "rgba(232,35,26,0.2)", padding: "8px", borderRadius: "10px", color: "#E8231A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FileText size={28} />
                        </div>
                        <h1
                            style={{
                                fontSize: "32px",
                                fontWeight: 900,
                                color: "#F4F0EB",
                                margin: 0,
                                letterSpacing: "-0.02em",
                            }}
                        >
                            Kit del Rider
                        </h1>
                    </div>
                    <p style={{ color: "#9E9A95", fontSize: "16px", fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
                        Material práctico para motociclistas: guías, infografías y recursos para que sepas qué hacer antes, durante y después de una emergencia en la rodada.
                    </p>
                </div>

                {/* Form / Content Container with Suspense for useSearchParams */}
                <Suspense
                    fallback={
                        <div
                            style={{
                                backgroundColor: "#131311",
                                padding: "96px 32px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#9E9A95",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderTop: "none",
                                borderRadius: "0 0 16px 16px",
                            }}
                        >
                            <Loader2 size={48} style={{ color: "rgba(232,35,26,0.3)", marginBottom: "16px", animation: "spin 1s linear infinite" }} />
                            <p style={{ fontWeight: 500, margin: 0 }}>Cargando Kit del Rider...</p>
                        </div>
                    }
                >
                    <KitRiderContent />
                </Suspense>
            </div>
        </div>
    );
}
