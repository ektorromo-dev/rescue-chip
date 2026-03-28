'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Error al iniciar sesión');
            } else {
                const redirectTo = searchParams.get('redirect');
                const safeRedirect = redirectTo && redirectTo.startsWith('/') ? redirectTo : '/dashboard';
                router.push(safeRedirect);
            }
        } catch {
            setError('Error de conexión. Intenta de nuevo.');
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
                    Iniciar Sesión
                </h1>
                <p style={{
                    fontSize: '14px',
                    color: '#9E9A95',
                    marginBottom: '32px',
                    margin: '0 0 32px 0',
                }}>
                    Accede a tu panel para gestionar tu perfil médico.
                </p>

                {error && (
                    <div style={{
                        backgroundColor: 'rgba(232,35,26,0.12)',
                        border: '1px solid rgba(232,35,26,0.3)',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        marginBottom: '20px',
                        color: '#E8231A',
                        fontSize: '14px',
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Email */}
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
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '10px',
                                padding: '12px 16px',
                                fontSize: '15px',
                                color: '#F4F0EB',
                                outline: 'none',
                                boxSizing: 'border-box',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 500, color: '#9E9A95' }}>
                                Contraseña
                            </label>
                            <Link href="/forgot-password" style={{ fontSize: '13px', color: '#E8231A', textDecoration: 'none' }}>
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                style={{
                                    width: '100%',
                                    backgroundColor: '#1A1A18',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '10px',
                                    padding: '12px 48px 12px 16px',
                                    fontSize: '15px',
                                    color: '#F4F0EB',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
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

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
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
                            cursor: loading ? 'not-allowed' : 'pointer',
                            letterSpacing: '0.3px',
                            transition: 'background-color 0.2s',
                        }}
                    >
                        {loading ? 'Ingresando...' : 'Ingresar a mi Panel'}
                    </button>
                </form>

                {/* Activar chip */}
                <div style={{
                    marginTop: '28px',
                    paddingTop: '24px',
                    borderTop: '1px solid rgba(255,255,255,0.07)',
                    textAlign: 'center',
                }}>
                    <p style={{ fontSize: '14px', color: '#9E9A95', margin: 0 }}>
                        ¿Aún no has activado tu chip?{' '}
                        <Link href="/activate" style={{ color: '#E8231A', textDecoration: 'none', fontWeight: 600 }}>
                            Actívalo aquí
                        </Link>
                    </p>
                </div>
            </div>

            {/* Volver */}
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

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginForm />
        </Suspense>
    );
}
