"use client";

import Link from "next/link";
import { ArrowLeft, KeyRound, Mail, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [message, setMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLockedOut, setIsLockedOut] = useState(false);
    const [lockCountdown, setLockCountdown] = useState(0);

    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");
        setMessage("");

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.isRateLimited || res.status === 429) {
                    setIsLockedOut(true);
                    setLockCountdown(15 * 60); // 15 minutos en segundos

                    // Iniciar contador
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
                    return; // Retornar temprano
                }
                throw new Error(data.error || "Error al iniciar sesión. Verifica tus credenciales.");
            }

            if (data.session) {
                await supabase.auth.setSession({
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token,
                });
            }

            router.push("/dashboard");
        } catch (error: any) {
            setErrorMsg(error.message || "Error al iniciar sesión. Verifica tus credenciales.");
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-card rounded-[2.5rem] shadow-2xl border border-border/50 overflow-hidden">
                {/* Header */}
                <div className="bg-destructive px-8 pt-10 pb-12 text-destructive-foreground relative">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
                    <Link href="/" className="inline-flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full text-white/90 hover:bg-white/30 hover:text-white transition-colors mb-6 font-medium text-xs uppercase tracking-wider relative z-10">
                        <ArrowLeft size={16} /> Volver
                    </Link>
                    <h1 className="text-3xl font-black tracking-tight mb-2 relative z-10">
                        Iniciar Sesión
                    </h1>
                    <p className="text-white/90 relative z-10 text-sm font-medium">
                        Accede a tu panel para gestionar tu perfil médico de RescueChip.
                    </p>
                </div>

                {/* Login Form */}
                <div className="p-8 -mt-6 relative z-20 bg-card rounded-t-[2.5rem]">

                    {errorMsg && (
                        <div className="mb-6 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm font-semibold flex items-center gap-2">
                            <AlertCircle size={18} /> {errorMsg}
                        </div>
                    )}

                    {message && (
                        <div className="mb-6 p-4 bg-green-500/10 text-green-700 border border-green-500/20 rounded-xl text-sm font-semibold flex items-center gap-2">
                            <AlertCircle size={18} /> {message}
                        </div>
                    )}

                    {isLockedOut ? (
                        <div className="text-center space-y-6 py-4 animate-[fade-in_0.3s_ease-out]">
                            <div className="mx-auto w-16 h-16 bg-destructive/10 text-destructive flex items-center justify-center rounded-2xl mb-2">
                                <AlertCircle size={32} />
                            </div>
                            <h3 className="text-xl font-black text-foreground">Demasiados Fallos</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Hemós detectado múltiples intentos fallidos de inicio de sesión. Por la seguridad de tus datos, tu sesión ha sido suspendida transitoriamente.
                            </p>
                            <div className="bg-muted rounded-xl p-4 mt-6">
                                <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                    Podrás reintentarlo en
                                </span>
                                <span className="text-3xl font-black text-primary font-mono tracking-widest">
                                    {formatTime(lockCountdown)}
                                </span>
                            </div>
                            <Link href="/reset-password" className="text-primary font-bold hover:underline inline-block mt-4 text-sm">
                                ¿Necesitas cambiar tu contraseña?
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-muted-foreground flex items-center gap-2" htmlFor="email">
                                    <Mail size={16} /> Correo Electrónico
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full h-12 rounded-xl border border-input bg-background/50 px-4 py-2 focus-visible:ring-2 focus-visible:ring-ring transition-all"
                                    placeholder="tu@correo.com"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-muted-foreground flex items-center gap-2" htmlFor="password">
                                    <KeyRound size={16} /> Contraseña
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full h-12 rounded-xl border border-input bg-background/50 px-4 py-2 pr-12 focus-visible:ring-2 focus-visible:ring-ring transition-all"
                                        placeholder="••••••••"
                                        required
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-0 top-0 h-12 px-4 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                        disabled={loading}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Link
                                    href="/reset-password"
                                    className="text-sm font-semibold text-primary hover:underline"
                                >
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground h-14 rounded-xl text-lg font-bold hover:scale-[1.02] hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 mt-4 disabled:opacity-70 disabled:pointer-events-none"
                            >
                                {loading ? <Loader2 size={20} className="animate-spin" /> : null}
                                {loading ? "Iniciando..." : "Ingresar a mi Panel"}
                            </button>
                        </form>
                    )}

                    <div className="mt-8 text-center border-t border-border/50 pt-6">
                        <p className="text-sm text-muted-foreground font-medium">
                            ¿Aún no has activado tu chip? <br />
                            <Link href="/activate" className="text-primary font-bold hover:underline mt-1 inline-block">Actívalo aquí</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
