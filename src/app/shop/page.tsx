"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShoppingCart, Loader2, Building2, Users } from "lucide-react";
import { useState } from "react";

export default function ShopPage() {
    const [loadingPackage, setLoadingPackage] = useState<string | null>(null);

    const handleCheckout = async (paquete: string) => {
        setLoadingPackage(paquete);
        try {
            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paquete }),
            });

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                console.error("Error creating checkout session:", data);
                alert("Hubo un problema al iniciar el pago. Inténtalo de nuevo.");
                setLoadingPackage(null);
            }
        } catch (error) {
            console.error("Error en checkout:", error);
            alert("Error de red. Intenta otra vez.");
            setLoadingPackage(null);
        }
    };

    const getWhatsAppLink = (planName: string) => {
        const phone = "525531909086";
        const message = `Hola, me interesa el plan ${planName} de RescueChip para mi agencia/empresa.`;
        return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    };

    return (
        <div className="min-h-screen bg-muted/30">
            {/* Header / Hero Shop */}
            <div className="bg-destructive px-8 pt-16 pb-20 text-destructive-foreground relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
                    <Link href="/" className="inline-flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full text-white/90 hover:bg-white/30 hover:text-white transition-colors mb-8 font-medium text-xs uppercase tracking-wider self-start md:self-auto">
                        <ArrowLeft size={16} /> Volver al Inicio
                    </Link>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 flex items-center gap-4">
                        <ShoppingCart size={40} className="hidden sm:block" /> Tienda Oficial
                    </h1>
                    <p className="text-white/90 text-lg md:text-xl font-medium max-w-2xl">
                        Adquiere tus chips NFC inteligentes y viaja con total tranquilidad.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-10 relative z-20 pb-24 space-y-20">

                {/* SECCIÓN 1 - PÚBLICO GENERAL */}
                <section>
                    <div className="text-center mb-10">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-foreground flex items-center justify-center gap-3">
                            <Users size={32} className="text-primary hidden sm:block" /> Protege tu vida en cada rodada
                        </h2>
                        <p className="text-primary font-bold mt-2 bg-primary/10 inline-block px-4 py-1.5 rounded-full">🚚 Envío GRATIS a todo México</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 items-start">
                        {/* Plan Individual */}
                        <div className="bg-card rounded-3xl p-8 border border-border shadow-sm flex flex-col h-full hover:border-primary/50 transition-all">
                            <h3 className="text-2xl font-black mb-2">Individual</h3>
                            <div className="flex items-baseline gap-2 mb-6">
                                <span className="text-4xl font-black">$349</span>
                                <span className="text-muted-foreground font-bold">MXN</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-start gap-3 text-muted-foreground"><CheckCircle2 className="text-primary shrink-0" size={20} /> 1 chip NFC</li>
                                <li className="flex items-start gap-3 text-muted-foreground"><CheckCircle2 className="text-primary shrink-0" size={20} /> 1 sticker protector</li>
                                <li className="flex items-start gap-3 text-muted-foreground"><CheckCircle2 className="text-primary shrink-0" size={20} /> Activación digital</li>
                                <li className="flex items-start gap-3 text-muted-foreground"><CheckCircle2 className="text-primary shrink-0" size={20} /> Envío gratis (México)</li>
                            </ul>
                            <button
                                onClick={() => handleCheckout("individual")}
                                disabled={loadingPackage !== null}
                                className="w-full flex justify-center items-center gap-2 bg-muted text-foreground font-bold h-14 rounded-xl hover:bg-muted-foreground/20 transition-all"
                            >
                                {loadingPackage === "individual" ? <Loader2 className="animate-spin" size={20} /> : "Comprar"}
                            </button>
                        </div>

                        {/* Plan Pareja (Más Popular) */}
                        <div className="bg-card rounded-3xl p-8 border-2 border-primary shadow-xl relative flex flex-col h-full scale-100 md:scale-105 z-10">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-black uppercase tracking-wider">
                                Más Popular
                            </div>
                            <h3 className="text-2xl font-black mb-2 mt-2">Pareja</h3>
                            <div className="flex items-baseline gap-2 mb-6">
                                <span className="text-4xl font-black">$549</span>
                                <span className="text-muted-foreground font-bold">MXN</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-start gap-3 font-medium"><CheckCircle2 className="text-primary shrink-0" size={20} /> 2 chips NFC</li>
                                <li className="flex items-start gap-3 font-medium"><CheckCircle2 className="text-primary shrink-0" size={20} /> 2 stickers protectores</li>
                                <li className="flex items-start gap-3 font-medium"><CheckCircle2 className="text-primary shrink-0" size={20} /> Activación digital compartida</li>
                                <li className="flex items-start gap-3 font-medium"><CheckCircle2 className="text-primary shrink-0" size={20} /> Envío gratis (México)</li>
                            </ul>
                            <button
                                onClick={() => handleCheckout("pareja")}
                                disabled={loadingPackage !== null}
                                className="w-full flex justify-center items-center gap-2 bg-primary text-primary-foreground font-black h-14 rounded-xl hover:bg-primary/90 hover:scale-[1.02] shadow-lg shadow-primary/20 transition-all"
                            >
                                {loadingPackage === "pareja" ? <Loader2 className="animate-spin" size={20} /> : "Comprar"}
                            </button>
                        </div>

                        {/* Plan Familiar */}
                        <div className="bg-card rounded-3xl p-8 border border-border shadow-sm relative flex flex-col h-full hover:border-primary/50 transition-all">
                            <div className="absolute -top-4 right-8 bg-black text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                Mejor Valor
                            </div>
                            <h3 className="text-2xl font-black mb-2">Familiar</h3>
                            <div className="flex items-baseline gap-2 mb-6">
                                <span className="text-4xl font-black">$949</span>
                                <span className="text-muted-foreground font-bold">MXN</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-start gap-3 text-muted-foreground"><CheckCircle2 className="text-primary shrink-0" size={20} /> 4 chips NFC</li>
                                <li className="flex items-start gap-3 text-muted-foreground"><CheckCircle2 className="text-primary shrink-0" size={20} /> 4 stickers protectores</li>
                                <li className="flex items-start gap-3 text-muted-foreground"><CheckCircle2 className="text-primary shrink-0" size={20} /> Activación digital grupal</li>
                                <li className="flex items-start gap-3 text-muted-foreground"><CheckCircle2 className="text-primary shrink-0" size={20} /> Envío gratis (México)</li>
                            </ul>
                            <button
                                onClick={() => handleCheckout("familiar")}
                                disabled={loadingPackage !== null}
                                className="w-full flex justify-center items-center gap-2 bg-muted text-foreground font-bold h-14 rounded-xl hover:bg-muted-foreground/20 transition-all"
                            >
                                {loadingPackage === "familiar" ? <Loader2 className="animate-spin" size={20} /> : "Comprar"}
                            </button>
                        </div>
                    </div>
                </section>

                {/* DIVISOR */}
                <div className="w-full h-px bg-border max-w-4xl mx-auto" />

                {/* SECCIÓN 2 - AGENCIAS Y B2B */}
                <section>
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-foreground flex items-center justify-center gap-3 mb-4">
                            <Building2 size={32} className="text-primary hidden sm:block" /> Planes para Agencias de Motos y Empresas
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Ofrece seguridad médica como valor agregado a tus clientes y mejora la experiencia de compra en tu negocio.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Starter */}
                        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm flex flex-col justify-between">
                            <div>
                                <h3 className="text-xl font-bold mb-1">Starter</h3>
                                <p className="text-sm font-medium text-muted-foreground mb-4">50 chips a $179 c/u</p>
                                <div className="text-3xl font-black mb-6">$8,950 MXN</div>
                            </div>
                            <Link href={getWhatsAppLink("Starter")} target="_blank" className="w-full flex items-center justify-center bg-muted text-foreground font-bold h-12 rounded-xl border border-border hover:bg-muted-foreground/10 transition-colors">
                                Solicitar
                            </Link>
                        </div>

                        {/* Growth */}
                        <div className="bg-primary/5 rounded-2xl p-6 border-2 border-primary shadow-md relative flex flex-col justify-between">
                            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 rounded-bl-xl rounded-tr-xl text-xs font-bold uppercase tracking-wider">
                                Recomendado
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-1">Growth</h3>
                                <p className="text-sm font-medium text-muted-foreground mb-4">100 chips a $149 c/u</p>
                                <div className="text-3xl font-black text-primary mb-6">$14,900 MXN</div>
                            </div>
                            <Link href={getWhatsAppLink("Growth")} target="_blank" className="w-full flex items-center justify-center bg-primary text-primary-foreground font-black h-12 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all hover:scale-[1.02]">
                                Solicitar
                            </Link>
                        </div>

                        {/* Premium */}
                        <div className="bg-[linear-gradient(135deg,#1f2937,#111827)] text-white rounded-2xl p-6 border border-gray-800 shadow-xl flex flex-col justify-between">
                            <div>
                                <h3 className="text-xl font-bold mb-1">Premium</h3>
                                <p className="text-sm font-medium text-gray-400 mb-4">300+ chips a $119 c/u</p>
                                <div className="text-2xl font-black mb-6 mt-1 text-gray-200">Precio negociable</div>
                            </div>
                            <Link href={getWhatsAppLink("Premium")} target="_blank" className="w-full flex items-center justify-center bg-white text-black font-black h-12 rounded-xl hover:bg-gray-100 transition-colors">
                                Contáctanos
                            </Link>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
