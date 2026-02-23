import React from 'react';

interface MedicalBadgeProps {
    medicalSystem: string | null;
    aseguradora?: string | null;
    className?: string;
}

export function MedicalBadge({ medicalSystem, aseguradora, className = "" }: MedicalBadgeProps) {
    const getBadgeData = () => {
        // IMSS
        if (medicalSystem === "IMSS") {
            return {
                bg: "#006847",
                border: "#004d35",
                label: "IMSS",
                textColor: "#FFFFFF"
            };
        }
        // ISSSTE
        if (medicalSystem === "ISSSTE") {
            return {
                bg: "#003366",
                border: "#001f3f",
                label: "ISSSTE",
                textColor: "#FFFFFF"
            };
        }
        // IMSS-BIENESTAR
        if (medicalSystem === "IMSS-BIENESTAR") {
            return {
                bg: "#004D40",
                border: "#00332a",
                label: "IMSS-BIENESTAR",
                textColor: "#FFFFFF",
                small: true
            };
        }
        // PEMEX
        if (medicalSystem === "PEMEX") {
            return {
                bg: "#C8102E",
                border: "#9c0a23",
                label: "PEMEX",
                textColor: "#FFFFFF"
            };
        }
        // SEDENA / SEMAR
        if (medicalSystem === "SEDENA / SEMAR") {
            return {
                bg: "#4A5E23",
                border: "#334218",
                label: "SEDENA",
                textColor: "#FFFFFF"
            };
        }

        // Privados
        if (medicalSystem === "Seguro Privado (Gastos Médicos Mayores)" || aseguradora) {
            const a = aseguradora || "";
            if (a === "AXA") return { bg: "#003974", border: "#002347", label: "AXA", textColor: "#FFFFFF" };
            if (a === "GNP") return { bg: "#FF6600", border: "#cc5200", label: "GNP", textColor: "#FFFFFF" };
            if (a === "Seguros Monterrey (SMNYL)") return { bg: "#002855", border: "#001633", label: "SMNYL", textColor: "#FFFFFF" };
            if (a === "Allianz") return { bg: "#003781", border: "#00214a", label: "Allianz", textColor: "#FFFFFF" };
            if (a === "MetLife") return { bg: "#00A94F", border: "#00803c", label: "MetLife", textColor: "#FFFFFF" };
            if (a === "Zurich") return { bg: "#003399", border: "#002266", label: "Zurich", textColor: "#FFFFFF" };
            if (a === "BUPA") return { bg: "#00A88E", border: "#007a67", label: "BUPA", textColor: "#FFFFFF" };
            if (a === "Mapfre") return { bg: "#DA291C", border: "#a61d15", label: "Mapfre", textColor: "#FFFFFF" };
            if (a === "Seguros Atlas") return { bg: "#1B3A6B", border: "#102447", label: "Atlas", textColor: "#FFFFFF" };

            return { bg: "#1F2937", border: "#111827", label: a || "Seguro Privado", textColor: "#F3F4F6", small: true };
        }

        return { bg: "#4B5563", border: "#374151", label: medicalSystem || "Seguro Médico", textColor: "#F3F4F6", small: true };
    };

    const data = getBadgeData();
    const title = `Logo de ${data.label}`;

    return (
        <div className={`inline-flex items-center justify-center overflow-hidden rounded-lg shadow-sm border ${className}`} style={{ borderColor: data.border, backgroundColor: data.bg }}>
            <svg
                width="120"
                height="40"
                viewBox="0 0 120 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label={title}
                role="img"
                className="max-w-[120px] max-h-[40px] w-auto h-auto object-contain"
            >
                <title>{title}</title>
                {/* Background is handled by parent div for consistency or we can do a rect here */}
                <rect width="120" height="40" fill={data.bg} />

                {/* Abstract shape to make it look somewhat like a logo */}
                <path d="M10 20 L20 10 L30 20 L20 30 Z" fill="white" fillOpacity="0.15" />
                <circle cx="100" cy="20" r="15" fill="black" fillOpacity="0.1" />

                <text
                    x="60"
                    y="25"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontWeight="900"
                    fontSize={data.small ? "10" : "14"}
                    fill={data.textColor}
                    textAnchor="middle"
                    letterSpacing="0.5"
                >
                    {data.label}
                </text>
            </svg>
        </div>
    );
}
