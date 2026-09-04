import React from "react";
import { AlertTriangle, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ReportedChipScreenProps {
    folio: string;
}

export default function ReportedChipScreen({ folio }: ReportedChipScreenProps) {
    const cleanFolio = (folio || "").trim().toUpperCase();
    const mailtoSubject = "Encontr%C3%A9%20un%20RescueChip";
    const mailtoBody = `Hola%2C%20encontr%C3%A9%20un%20RescueChip%20con%20folio%20${encodeURIComponent(cleanFolio)}.%20Quiero%20ayudar%20a%20regresarlo.`;
    const mailtoUrl = `mailto:contacto@rescue-chip.com?subject=${mailtoSubject}&body=${mailtoBody}`;

    return (
        <div
            style={{
                minHeight: "100vh",
                backgroundColor: "#0A0A08",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px 16px",
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                color: "#F4F0EB",
            }}
        >
            <div
                style={{
                    backgroundColor: "#131311",
                    padding: "48px 32px",
                    borderRadius: "24px",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                    maxWidth: "480px",
                    width: "100%",
                    textAlign: "center",
                    border: "1px solid rgba(232, 35, 26, 0.35)",
                    position: "relative",
                }}
            >
                <div
                    style={{
                        width: "80px",
                        height: "80px",
                        backgroundColor: "rgba(232, 35, 26, 0.12)",
                        color: "#E8231A",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 24px auto",
                        border: "1px solid rgba(232, 35, 26, 0.3)",
                    }}
                >
                    <AlertTriangle size={42} />
                </div>

                <div
                    style={{
                        display: "inline-block",
                        backgroundColor: "rgba(232, 35, 26, 0.15)",
                        color: "#E8231A",
                        fontSize: "12px",
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        padding: "6px 14px",
                        borderRadius: "9999px",
                        marginBottom: "16px",
                        border: "1px solid rgba(232, 35, 26, 0.3)",
                    }}
                >
                    Folio: {cleanFolio}
                </div>

                <h1
                    style={{
                        fontSize: "26px",
                        fontWeight: 900,
                        marginBottom: "16px",
                        color: "#F4F0EB",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.2,
                    }}
                >
                    Chip Reportado
                </h1>

                <p
                    style={{
                        color: "#9E9A95",
                        fontSize: "16px",
                        lineHeight: 1.6,
                        margin: "0 auto 32px auto",
                        maxWidth: "380px",
                    }}
                >
                    Este chip fue reportado como robado por su dueño. Si lo encontraste, contáctanos.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <a
                        href={mailtoUrl}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "10px",
                            backgroundColor: "#E8231A",
                            color: "#FFFFFF",
                            height: "56px",
                            borderRadius: "14px",
                            fontWeight: 800,
                            fontSize: "15px",
                            textDecoration: "none",
                            transition: "background-color 0.2s",
                        }}
                    >
                        <Mail size={18} />
                        Contactar a Soporte RescueChip
                    </a>

                    <Link
                        href="/"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            backgroundColor: "#1A1A18",
                            color: "#9E9A95",
                            height: "48px",
                            borderRadius: "12px",
                            fontWeight: 600,
                            fontSize: "14px",
                            textDecoration: "none",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                        }}
                    >
                        <ArrowLeft size={16} /> Volver al Inicio
                    </Link>
                </div>
            </div>
        </div>
    );
}
