"use client";

import Link from "next/link";
import { ArrowLeft, Mail, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const supabase = createClient();

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
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
        <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-card rounded-[2.5rem] shadow-2xl border border-border/50 overflow-hidden">
                {/* Header */}
                <div className="bg-destructive px-8 pt-10 pb-12 text-destructive-foreground relative">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
                    <Link href="/login" className="inline-flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full text-white/90 hover:bg-white/30 hover:text-white transition-colors mb-6 font-medium text-xs uppercase tracking-wider relative z-10">
                        <ArrowLeft size={16} /> Volver a Login
                    </Link>
                    <h1 className="text-3xl font-black tracking-tight mb-2 relative z-10">
                        Recuperar Cuenta
                    </h1>
                    <p className="text-white/90 relative z-10 text-sm font-medium">
                        Ingresa tu correo para recibir un enlace de recuperación.
                    </p>
                </div>

                {/* Form */}
                <div className="p-8 -mt-6 relative z-20 bg-card rounded-t-[2.5rem]">

                    {errorMsg && (
                        <div className="mb-6 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm font-semibold flex items-center gap-2">
                            <AlertCircle size={18} /> {errorMsg}
                        </div>
                    )}

                    {successMsg ? (
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 size={32} />
                            </div>
                            <p className="text-lg font-medium text-foreground">{successMsg}</p>
                            <p className="text-sm text-muted-foreground">
                                Revisa tu bandeja de entrada o la carpeta de spam. Puedes cerrar esta ventana.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-5">
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
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !email}
                                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground h-14 rounded-xl text-lg font-bold hover:scale-[1.02] hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 mt-4 disabled:opacity-70 disabled:pointer-events-none"
                            >
                                {loading ? <Loader2 size={20} className="animate-spin" /> : null}
                                {loading ? "Enviando..." : "Enviar Enlace"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
