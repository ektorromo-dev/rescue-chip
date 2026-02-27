"use client";

import { KeyRound, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function UpdatePasswordPage() {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const router = useRouter();
    const supabase = createClient();

    // Verify session on mount (Supabase client handles hash fragment parsing)
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // If there's no session, they probably came without the token
                setErrorMsg("Enlace inválido o expirado. Por favor solicita uno nuevo.");
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
        <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-card rounded-[2.5rem] shadow-2xl border border-border/50 overflow-hidden">
                {/* Header */}
                <div className="bg-primary px-8 pt-12 pb-12 text-primary-foreground relative">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />

                    <h1 className="text-3xl font-black tracking-tight mb-2 relative z-10">
                        Nueva Contraseña
                    </h1>
                    <p className="text-white/90 relative z-10 text-sm font-medium">
                        Crea una nueva contraseña para acceder a tu perfil médico.
                    </p>
                </div>

                {/* Form */}
                <div className="p-8 -mt-6 relative z-20 bg-card rounded-t-[2.5rem]">

                    {errorMsg && (
                        <div className="mb-6 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm font-semibold flex items-center gap-2">
                            <AlertCircle size={18} /> {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleUpdatePassword} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground flex items-center gap-2" htmlFor="newPassword">
                                <KeyRound size={16} /> Nueva Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    id="newPassword"
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full h-12 rounded-xl border border-input bg-background/50 px-4 py-2 pr-12 focus-visible:ring-2 focus-visible:ring-ring transition-all"
                                    placeholder="••••••••"
                                    required
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-0 top-0 h-12 px-4 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground flex items-center gap-2" htmlFor="confirmPassword">
                                <KeyRound size={16} /> Confirmar Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    id="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full h-12 rounded-xl border border-input bg-background/50 px-4 py-2 pr-12 focus-visible:ring-2 focus-visible:ring-ring transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !newPassword || !confirmPassword}
                            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground h-14 rounded-xl text-lg font-bold hover:scale-[1.02] hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 mt-4 disabled:opacity-70 disabled:pointer-events-none"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : null}
                            {loading ? "Actualizando..." : "Guardar Contraseña"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
