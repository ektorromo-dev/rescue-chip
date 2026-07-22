"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [hasSession, setHasSession] = useState(true);

    const [focusedInput1, setFocusedInput1] = useState(false);
    const [focusedInput2, setFocusedInput2] = useState(false);

    const router = useRouter();
    const supabase = createClient();

    // Verify session on mount (Supabase client handles hash fragment parsing)
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setErrorMsg("Enlace inválido o expirado. Por favor solicita uno nuevo.");
                setHasSession(false);
            }
        };
        checkSession();
    }, [supabase.auth]);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setErrorMsg("Las contraseñas no coinciden.");
            return;
        }

        if (newPassword.length < 6) {
            setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        setLoading(true);
        setErrorMsg("");

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            // Password updated successfully
            router.push("/dashboard");
        } catch (error: any) {
            setErrorMsg(error.message || "Error al actualizar tu contraseña. Inténtalo de nuevo.");
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
                    Nueva Contraseña
                </h1>
                
                {hasSession && (
                    <p style={{
                        fontSize: '14px',
                        color: '#9E9A95',
                        marginBottom: '32px',
                        margin: '0 0 32px 0',
                    }}>
                        Crea una nueva contraseña para acceder a tu perfil médico.
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

                {hasSession ? (
                    <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* New Password */}
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: 500,
                                color: '#9E9A95',
                                marginBottom: '8px',
                            }}>
                                Nueva Contraseña
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    style={{
                                        width: '100%',
                                        backgroundColor: '#1A1A18',
                                        border: focusedInput1 
                                            ? '1px solid rgba(232,35,26,0.5)' 
                                            : '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '10px',
                                        padding: '12px 48px 12px 16px',
                                        fontSize: '15px',
                                        color: '#F4F0EB',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        transition: 'border-color 0.2s',
                                    }}
                                    onFocus={() => setFocusedInput1(true)}
                                    onBlur={() => setFocusedInput1(false)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '14px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#9E9A95',
                                        fontSize: '18px',
                                        padding: '0',
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    {showPassword ? '🙈' : '👁'}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: 500,
                                color: '#9E9A95',
                                marginBottom: '8px',
                            }}>
                                Confirmar Contraseña
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    style={{
                                        width: '100%',
                                        backgroundColor: '#1A1A18',
                                        border: focusedInput2 
                                            ? '1px solid rgba(232,35,26,0.5)' 
                                            : '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '10px',
                                        padding: '12px 48px 12px 16px',
                                        fontSize: '15px',
                                        color: '#F4F0EB',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        transition: 'border-color 0.2s',
                                    }}
                                    onFocus={() => setFocusedInput2(true)}
                                    onBlur={() => setFocusedInput2(false)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '14px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#9E9A95',
                                        fontSize: '18px',
                                        padding: '0',
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    {showConfirmPassword ? '🙈' : '👁'}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !newPassword || !confirmPassword}
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
                                cursor: (loading || !newPassword || !confirmPassword) ? 'not-allowed' : 'pointer',
                                letterSpacing: '0.3px',
                                transition: 'background-color 0.2s',
                            }}
                        >
                            {loading ? 'Actualizando...' : 'Guardar Contraseña'}
                        </button>
                    </form>
                ) : (
                    <div style={{ textAlign: 'center', marginTop: '24px' }}>
                        <Link href="/login" style={{ color: '#E8231A', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>
                            Volver a Iniciar Sesión
                        </Link>
                    </div>
                )}
            </div>

            {/* Volver al inicio */}
            <Link href="/" style={{
                marginTop: '24px',
                fontSize: '13px',
                color: '#9E9A95',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
            }}>
                ← Volver al inicio
            </Link>
        </div>
    );
}
