"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [focusedInput, setFocusedInput] = useState(false);

    const supabase = createClient();

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'https://rescue-chip.com/update-password',
            });

            if (error) throw error;
            setSuccessMsg("¡Listo! Hemos enviado un enlace a tu correo para que puedas cambiar tu contraseña.");
        } catch (error: any) {
            setErrorMsg(error.message || "Error al solicitar el restablecimiento de contraseña.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#0A0A08',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
        }}>
            {/* Logo */}
            <Link href="/" style={{ marginBottom: '40px', textDecoration: 'none' }}>
                <span style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                    <span style={{ color: '#F4F0EB' }}>RESCUE</span>
                    <span style={{ color: '#E8231A' }}>CHIP</span>
                </span>
            </Link>

            {/* Card */}
            <div style={{
                width: '100%',
                maxWidth: '420px',
                backgroundColor: '#131311',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '40px 32px',
            }}>
                <h1 style={{
                    fontSize: '26px',
                    fontWeight: 700,
                    color: '#F4F0EB',
                    marginBottom: '8px',
                    margin: '0 0 8px 0',
                }}>
                    Recuperar Cuenta
                </h1>
                
                {!successMsg && (
                    <p style={{
                        fontSize: '14px',
                        color: '#9E9A95',
                        marginBottom: '32px',
                        margin: '0 0 32px 0',
                    }}>
                        Ingresa tu correo para recibir un enlace de recuperación.
                    </p>
                )}

                {errorMsg && (
                    <div style={{
                        backgroundColor: 'rgba(232,35,26,0.12)',
                        border: '1px solid rgba(232,35,26,0.3)',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        marginBottom: '20px',
                        color: '#E8231A',
                        fontSize: '14px',
                    }}>
                        {errorMsg}
                    </div>
                )}

                {successMsg ? (
                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                        <div style={{
                            fontSize: '48px',
                            color: '#1FA85C',
                            marginBottom: '16px',
                        }}>
                            ✓
                        </div>
                        <p style={{
                            fontSize: '16px',
                            color: '#F4F0EB',
                            fontWeight: 500,
                            lineHeight: '1.5',
                            margin: '0 0 16px 0',
                        }}>
                            {successMsg}
                        </p>
                        <p style={{
                            fontSize: '13px',
                            color: '#9E9A95',
                            margin: 0,
                        }}>
                            Revisa tu bandeja de entrada o la carpeta de spam.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Email Input */}
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: 500,
                                color: '#9E9A95',
                                marginBottom: '8px',
                            }}>
                                Correo electrónico
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@correo.com"
                                required
                                style={{
                                    width: '100%',
                                    backgroundColor: '#1A1A18',
                                    border: focusedInput 
                                        ? '1px solid rgba(232,35,26,0.5)' 
                                        : '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '10px',
                                    padding: '12px 16px',
                                    fontSize: '15px',
                                    color: '#F4F0EB',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    transition: 'border-color 0.2s',
                                }}
                                onFocus={() => setFocusedInput(true)}
                                onBlur={() => setFocusedInput(false)}
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !email}
                            style={{
                                marginTop: '8px',
                                width: '100%',
                                backgroundColor: loading ? '#8B1410' : '#E8231A',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '14px',
                                fontSize: '15px',
                                fontWeight: 700,
                                cursor: (loading || !email) ? 'not-allowed' : 'pointer',
                                letterSpacing: '0.3px',
                                transition: 'background-color 0.2s',
                            }}
                        >
                            {loading ? 'Enviando...' : 'Enviar Enlace'}
                        </button>
                    </form>
                )}

                {/* Volver a Login */}
                <div style={{
                    marginTop: '28px',
                    paddingTop: '24px',
                    borderTop: '1px solid rgba(255,255,255,0.07)',
                    textAlign: 'center',
                }}>
                    <Link href="/login" style={{ color: '#E8231A', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>
                        Volver a Iniciar Sesión
                    </Link>
                </div>
            </div>

            {/* Volver a Login (debajo de la tarjeta) */}
            <Link href="/login" style={{
                marginTop: '24px',
                fontSize: '13px',
                color: '#9E9A95',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
            }}>
                ← Volver a Login
            </Link>
        </div>
    );
}
