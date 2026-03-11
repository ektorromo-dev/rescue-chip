"use client";

import Link from "next/link";
import { ShoppingCart, Loader2, Building2, Users, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import CheckoutModal from "@/components/CheckoutModal";



export default function ShopPage() {
    const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#0A0A08", display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 16px" }}>

            <CheckoutModal plan={selectedPackage} onClose={() => setSelectedPackage(null)} />

            <div style={{ maxWidth: "896px", width: "100%", backgroundColor: "#131311", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", padding: "32px", position: "relative" }}>

                {/* Header */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: "48px" }}>
                    <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#9E9A95", marginBottom: "32px", fontWeight: 500, fontSize: "13px" }}>
                        <ArrowLeft size={16} /> Volver al Inicio
                    </Link>
                    <h1 style={{ fontSize: "36px", fontWeight: 900, color: "#F4F0EB", marginBottom: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
                        <ShoppingCart size={32} style={{ color: "#E8231A" }} /> Tienda Oficial
                    </h1>
                    <p style={{ fontSize: "16px", color: "#9E9A95", maxWidth: "480px" }}>
                        Adquiere tus chips NFC inteligentes y viaja con total tranquilidad.
                    </p>
                </div>

                {/* SECCIÓN B2C */}
                <section style={{ marginBottom: "64px" }}>
                    <div style={{ textAlign: "center", marginBottom: "32px" }}>
                        <h2 style={{ fontSize: "28px", fontWeight: 900, color: "#F4F0EB", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "8px" }}>
                            <Users size={28} style={{ color: "#E8231A" }} /> Protege tu vida en cada rodada
                        </h2>
                        <p style={{ color: "#E8231A", fontWeight: 700, fontSize: "14px" }}>🚚 Envío GRATIS a todo México</p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px" }}>

                        {/* Individual */}
                        <div style={{ backgroundColor: "#1A1A18", borderRadius: "20px", padding: "28px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column" }}>
                            <h3 style={{ fontSize: "22px", fontWeight: 900, color: "#F4F0EB", marginBottom: "4px" }}>Individual</h3>
                            <p style={{ fontSize: "13px", color: "#9E9A95", marginBottom: "20px" }}>Para el rider que va solo.</p>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "20px" }}>
                                <span style={{ fontSize: "14px", color: "#9E9A95" }}>$</span>
                                <span style={{ fontSize: "42px", fontWeight: 900, color: "#F4F0EB", lineHeight: 1 }}>349</span>
                                <span style={{ fontSize: "13px", color: "#9E9A95" }}>MXN</span>
                            </div>
                            <ul style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px", flex: 1 }}>
                                {["1 chip NFC programado", "Perfil médico completo", "2 contactos de emergencia", "Alertas SMS + email", "Envío incluido"].map(f => (
                                    <li key={f} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#9E9A95" }}>
                                        <CheckCircle2 size={16} style={{ color: "#E8231A", flexShrink: 0 }} /> {f}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={() => setSelectedPackage("individual")} style={{ width: "100%", height: "48px", borderRadius: "12px", fontWeight: 700, fontSize: "14px", backgroundColor: "transparent", color: "#F4F0EB", border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer" }}>
                                Elegir Individual
                            </button>
                        </div>

                        {/* Pareja */}
                        <div style={{ backgroundColor: "#1A1A18", borderRadius: "20px", padding: "28px", border: "1px solid #E8231A", display: "flex", flexDirection: "column", position: "relative" }}>
                            <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", backgroundColor: "#E8231A", color: "#FFF", fontSize: "11px", fontWeight: 900, letterSpacing: "1.5px", padding: "4px 14px", borderRadius: "9999px", whiteSpace: "nowrap" }}>
                                MÁS POPULAR
                            </div>
                            <h3 style={{ fontSize: "22px", fontWeight: 900, color: "#F4F0EB", marginBottom: "4px" }}>Pareja</h3>
                            <p style={{ fontSize: "13px", color: "#9E9A95", marginBottom: "20px" }}>Para los que ruedan juntos.</p>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "20px" }}>
                                <span style={{ fontSize: "14px", color: "#9E9A95" }}>$</span>
                                <span style={{ fontSize: "42px", fontWeight: 900, color: "#E8231A", lineHeight: 1 }}>549</span>
                                <span style={{ fontSize: "13px", color: "#9E9A95" }}>MXN</span>
                            </div>
                            <ul style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px", flex: 1 }}>
                                {["2 chips NFC programados", "Perfiles médicos independientes", "Contactos cruzados", "Alertas SMS + email para ambos", "Envío incluido"].map(f => (
                                    <li key={f} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#9E9A95" }}>
                                        <CheckCircle2 size={16} style={{ color: "#E8231A", flexShrink: 0 }} /> {f}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={() => setSelectedPackage("pareja")} style={{ width: "100%", height: "48px", borderRadius: "12px", fontWeight: 900, fontSize: "14px", backgroundColor: "#E8231A", color: "#FFF", border: "none", cursor: "pointer" }}>
                                Elegir Pareja
                            </button>
                        </div>

                        {/* Familiar */}
                        <div style={{ backgroundColor: "#1A1A18", borderRadius: "20px", padding: "28px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column" }}>
                            <h3 style={{ fontSize: "22px", fontWeight: 900, color: "#F4F0EB", marginBottom: "4px" }}>Familiar</h3>
                            <p style={{ fontSize: "13px", color: "#9E9A95", marginBottom: "20px" }}>Toda la familia protegida.</p>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "20px" }}>
                                <span style={{ fontSize: "14px", color: "#9E9A95" }}>$</span>
                                <span style={{ fontSize: "42px", fontWeight: 900, color: "#F4F0EB", lineHeight: 1 }}>949</span>
                                <span style={{ fontSize: "13px", color: "#9E9A95" }}>MXN</span>
                            </div>
                            <ul style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px", flex: 1 }}>
                                {["Pack familiar (hasta 4 chips)", "Perfiles médicos individuales", "Red de contactos compartida", "Dashboard familiar unificado", "Envío incluido"].map(f => (
                                    <li key={f} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#9E9A95" }}>
                                        <CheckCircle2 size={16} style={{ color: "#E8231A", flexShrink: 0 }} /> {f}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={() => setSelectedPackage("familiar")} style={{ width: "100%", height: "48px", borderRadius: "12px", fontWeight: 700, fontSize: "14px", backgroundColor: "transparent", color: "#F4F0EB", border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer" }}>
                                Elegir Familiar
                            </button>
                        </div>

                    </div>
                </section>

                {/* DIVISOR */}
                <div style={{ width: "100%", height: "1px", backgroundColor: "rgba(255,255,255,0.06)", marginBottom: "64px" }} />

                {/* SECCIÓN B2B */}
                <section>
                    <div style={{ textAlign: "center", marginBottom: "32px" }}>
                        <h2 style={{ fontSize: "28px", fontWeight: 900, color: "#F4F0EB", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "8px" }}>
                            <Building2 size={28} style={{ color: "#E8231A" }} /> Planes para Agencias y Empresas
                        </h2>
                        <p style={{ fontSize: "14px", color: "#9E9A95", maxWidth: "480px", margin: "0 auto" }}>
                            Ofrece seguridad médica como valor agregado a tus clientes.
                        </p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>

                        {/* Starter */}
                        <div style={{ backgroundColor: "#1A1A18", borderRadius: "16px", padding: "24px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            <div>
                                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#F4F0EB", marginBottom: "4px" }}>Starter</h3>
                                <p style={{ fontSize: "13px", color: "#9E9A95", marginBottom: "16px" }}>50 chips a $179 c/u</p>
                                <div style={{ fontSize: "28px", fontWeight: 900, color: "#F4F0EB", marginBottom: "20px" }}>$8,950 MXN</div>
                            </div>
                            <Link href="https://wa.me/5215551433904?text=Hola%2C%20me%20interesa%20el%20plan%20Starter%20de%20RescueChip%20(50%20chips)%20para%20mi%20negocio." target="_blank" rel="noopener noreferrer" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", height: "44px", borderRadius: "12px", fontWeight: 700, fontSize: "14px", backgroundColor: "transparent", color: "#F4F0EB", border: "1px solid rgba(255,255,255,0.15)" }}>
                                Solicitar
                            </Link>
                        </div>

                        {/* Growth */}
                        <div style={{ backgroundColor: "#1A1A18", borderRadius: "16px", padding: "24px", border: "1px solid rgba(232,35,26,0.40)", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
                            <div style={{ position: "absolute", top: "-11px", left: "50%", transform: "translateX(-50%)", backgroundColor: "#E8231A", color: "#FFF", fontSize: "10px", fontWeight: 900, letterSpacing: "1.5px", padding: "3px 12px", borderRadius: "9999px", whiteSpace: "nowrap" }}>
                                RECOMENDADO
                            </div>
                            <div>
                                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#F4F0EB", marginBottom: "4px" }}>Growth</h3>
                                <p style={{ fontSize: "13px", color: "#9E9A95", marginBottom: "16px" }}>100 chips a $149 c/u</p>
                                <div style={{ fontSize: "28px", fontWeight: 900, color: "#E8231A", marginBottom: "20px" }}>$14,900 MXN</div>
                            </div>
                            <Link href="https://wa.me/5215551433904?text=Hola%2C%20me%20interesa%20el%20plan%20Growth%20de%20RescueChip%20(100%20chips)%20para%20mi%20negocio." target="_blank" rel="noopener noreferrer" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", height: "44px", borderRadius: "12px", fontWeight: 900, fontSize: "14px", backgroundColor: "#E8231A", color: "#FFF", border: "none" }}>
                                Solicitar
                            </Link>
                        </div>

                        {/* Premium */}
                        <div style={{ backgroundColor: "#1A1A18", borderRadius: "16px", padding: "24px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            <div>
                                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#F4F0EB", marginBottom: "4px" }}>Premium</h3>
                                <p style={{ fontSize: "13px", color: "#9E9A95", marginBottom: "16px" }}>300+ chips a $119 c/u</p>
                                <div style={{ fontSize: "22px", fontWeight: 900, color: "#F4F0EB", marginBottom: "20px" }}>Precio negociable</div>
                            </div>
                            <Link href="https://wa.me/5215551433904?text=Hola%2C%20me%20interesa%20el%20plan%20Premium%20de%20RescueChip%20(300%2B%20chips)%20para%20mi%20agencia." target="_blank" rel="noopener noreferrer" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", height: "44px", borderRadius: "12px", fontWeight: 700, fontSize: "14px", backgroundColor: "transparent", color: "#F4F0EB", border: "1px solid rgba(255,255,255,0.15)" }}>
                                Contáctanos
                            </Link>
                        </div>

                    </div>
                </section>

            </div>
        </div>
    );
}
