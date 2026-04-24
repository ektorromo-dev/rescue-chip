"use client";

import { useState } from "react";
import { ShoppingCart, Loader2, FileText, X, MapPin } from "lucide-react";

interface CheckoutModalProps {
    plan: string | null;
    onClose: () => void;
}

const packagePrices: Record<string, number> = {
    individual: 349,
    pareja: 549,
    familiar: 949,
};

export default function CheckoutModal({ plan, onClose }: CheckoutModalProps) {
    const [loadingPackage, setLoadingPackage] = useState<string | null>(null);
    const [requiresInvoice, setRequiresInvoice] = useState(false);
    const [coloniasOpt, setColoniasOpt] = useState<string[]>([]);
    const [loadingZip, setLoadingZip] = useState(false);

    const [invoiceData, setInvoiceData] = useState({
        rfc: "",
        nombre_fiscal: "",
        regimen_fiscal: "",
        uso_cfdi: "G03 - Gastos en general",
        codigo_postal_fiscal: "",
        email_factura: "",
        whatsapp_factura: "",
    });

    const [shippingData, setShippingData] = useState({
        nombre_receptor: "",
        telefono_receptor: "",
        codigo_postal: "",
        estado: "",
        ciudad: "",
        colonia: "",
        calle_numero: "",
        numero_interior: "",
        referencia: "",
        email_cliente: "",
    });

    if (!plan) return null;

    const handleShippingChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setShippingData((prev) => ({ ...prev, [name]: value }));
    };

    const handleInvoiceChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setInvoiceData((prev) => ({ ...prev, [name]: value }));
    };

    const handleZipCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const cp = e.target.value.replace(/\D/g, "");
        setShippingData((prev) => ({ ...prev, codigo_postal: cp }));

        if (cp.length === 5) {
            setLoadingZip(true);
            try {
                const res = await fetch(
                    `https://sepomex.icalialabs.com/api/v1/zip_codes?zip_code=${cp}`
                );
                const data = await res.json();

                if (data?.zip_codes?.length > 0) {
                    const first = data.zip_codes[0];
                    setShippingData((prev) => ({
                        ...prev,
                        estado: first.d_estado,
                        ciudad: first.d_mnpio,
                        colonia: data.zip_codes.length === 1 ? first.d_asenta : "",
                    }));
                    if (data.zip_codes.length > 1) {
                        setColoniasOpt(
                            Array.from(new Set(data.zip_codes.map((z: { d_asenta: string }) => z.d_asenta)))
                        );
                    } else {
                        setColoniasOpt([]);
                    }
                } else {
                    const res2 = await fetch(
                        `https://api.copomex.com/query/info_cp/${cp}?token=pruebas`
                    );
                    const data2 = await res2.json();
                    if (!data2.error) {
                        setShippingData((prev) => ({
                            ...prev,
                            estado: data2[0].response.estado,
                            ciudad: data2[0].response.municipio,
                            colonia: data2.length === 1 ? data2[0].response.asentamiento : "",
                        }));
                        if (data2.length > 1) {
                            setColoniasOpt(
                                Array.from(
                                    new Set(data2.map((d: { response: { asentamiento: string } }) => d.response.asentamiento))
                                )
                            );
                        } else {
                            setColoniasOpt([]);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching zip code info:", error);
            } finally {
                setLoadingZip(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingPackage(plan);

        let currentFacturaId = null;

        if (requiresInvoice) {
            try {
                const resFactura = await fetch("/api/factura-notify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...invoiceData,
                        paquete: plan,
                        monto: packagePrices[plan],
                    }),
                });
                const dataFactura = await resFactura.json();
                if (!resFactura.ok || !dataFactura.factura_id) {
                    throw new Error(dataFactura.error || "Error al procesar la solicitud de factura");
                }
                currentFacturaId = dataFactura.factura_id;
            } catch (error: unknown) {
                const msg = error instanceof Error ? error.message : "Error desconocido";
                alert("Error al guardar datos de facturación: " + msg);
                setLoadingPackage(null);
                return;
            }
        }

        // Track InitiateCheckout
        if (typeof window !== 'undefined' && (window as any).fbq) {
            (window as any).fbq('track', 'InitiateCheckout', {
                value: packagePrices[plan],
                currency: 'MXN',
            });
            console.log('Meta Pixel: InitiateCheckout tracked -', packagePrices[plan], 'MXN');
        }

        // Capturar parámetros UTM de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const utm_source = urlParams.get('utm_source') || 'direct';
        const utm_medium = urlParams.get('utm_medium') || 'none';
        const utm_campaign = urlParams.get('utm_campaign') || 'none';

        try {
            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    paquete: plan,
                    shippingData,
                    factura_id: currentFacturaId,
                    monto: packagePrices[plan],
                    utm_source,
                    utm_medium,
                    utm_campaign,
                }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || "Error al procesar la solicitud de compra");
            }
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Error desconocido";
            alert("Error: " + msg);
            setLoadingPackage(null);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: "100%",
        height: "44px",
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.08)",
        backgroundColor: "#0A0A08",
        color: "#F4F0EB",
        padding: "0 12px",
        fontSize: "14px",
        boxSizing: "border-box",
    };

    const labelStyle: React.CSSProperties = {
        fontSize: "14px",
        fontWeight: 600,
        color: "#9E9A95",
    };

    const fieldStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    };

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                zIndex: 50,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px",
                backgroundColor: "rgba(0,0,0,0.85)",
                overflowY: "auto",
            }}
        >
            <div
                style={{
                    backgroundColor: "#131311",
                    width: "100%",
                    maxWidth: "600px",
                    borderRadius: "24px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex",
                    flexDirection: "column",
                    maxHeight: "90vh",
                    overflowY: "auto",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "24px",
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                        position: "sticky",
                        top: 0,
                        backgroundColor: "#131311",
                        zIndex: 10,
                        borderRadius: "24px 24px 0 0",
                    }}
                >
                    <div>
                        <h3
                            style={{
                                fontSize: "20px",
                                fontWeight: 900,
                                color: "#F4F0EB",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                margin: 0,
                            }}
                        >
                            <ShoppingCart size={20} style={{ color: "#E8231A" }} />
                            Confirmar Compra
                        </h3>
                        <p style={{ fontSize: "14px", color: "#9E9A95", margin: "4px 0 0" }}>
                            Paquete {plan.charAt(0).toUpperCase() + plan.slice(1)} — $
                            {packagePrices[plan]} MXN
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loadingPackage !== null}
                        style={{
                            backgroundColor: "transparent",
                            border: "none",
                            color: "#9E9A95",
                            cursor: "pointer",
                            padding: "4px",
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <div style={{ padding: "24px" }}>
                    <form
                        id="checkout-modal-form"
                        onSubmit={handleSubmit}
                        style={{ display: "flex", flexDirection: "column", gap: "32px" }}
                    >
                        {/* Sección envío */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <h4
                                style={{
                                    fontWeight: 700,
                                    fontSize: "16px",
                                    color: "#F4F0EB",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    margin: 0,
                                    paddingBottom: "12px",
                                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                                }}
                            >
                                <MapPin size={18} style={{ color: "#E8231A" }} />
                                Dirección de Envío y Contacto
                            </h4>

                            {/* Nombre */}
                            <div style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
                                <label style={labelStyle}>Nombre de quien recibe *</label>
                                <input
                                    type="text"
                                    name="nombre_receptor"
                                    value={shippingData.nombre_receptor}
                                    onChange={handleShippingChange}
                                    required
                                    placeholder="Ej. Juan Pérez"
                                    disabled={loadingPackage !== null}
                                    style={inputStyle}
                                />
                            </div>

                            {/* Teléfono + Email */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "12px",
                                }}
                            >
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Teléfono *</label>
                                    <input
                                        type="tel"
                                        name="telefono_receptor"
                                        value={shippingData.telefono_receptor}
                                        onChange={handleShippingChange}
                                        required
                                        placeholder="10 dígitos"
                                        minLength={10}
                                        maxLength={10}
                                        disabled={loadingPackage !== null}
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Email *</label>
                                    <input
                                        type="email"
                                        name="email_cliente"
                                        value={shippingData.email_cliente}
                                        onChange={handleShippingChange}
                                        required
                                        placeholder="tu@correo.com"
                                        disabled={loadingPackage !== null}
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                            {/* CP + Estado */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "12px",
                                }}
                            >
                                <div style={{ ...fieldStyle, position: "relative" }}>
                                    <label style={labelStyle}>Código Postal *</label>
                                    <input
                                        type="text"
                                        name="codigo_postal"
                                        value={shippingData.codigo_postal}
                                        onChange={handleZipCodeChange}
                                        required
                                        placeholder="Ej. 11000"
                                        minLength={5}
                                        maxLength={5}
                                        disabled={loadingPackage !== null}
                                        style={inputStyle}
                                    />
                                    {loadingZip && (
                                        <Loader2
                                            size={14}
                                            style={{
                                                position: "absolute",
                                                bottom: "14px",
                                                right: "12px",
                                                color: "#9E9A95",
                                                animation: "spin 1s linear infinite",
                                            }}
                                        />
                                    )}
                                </div>
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Estado *</label>
                                    <input
                                        type="text"
                                        name="estado"
                                        value={shippingData.estado}
                                        onChange={handleShippingChange}
                                        required
                                        disabled={loadingPackage !== null}
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                            {/* Ciudad + Colonia */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "12px",
                                }}
                            >
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Ciudad / Municipio *</label>
                                    <input
                                        type="text"
                                        name="ciudad"
                                        value={shippingData.ciudad}
                                        onChange={handleShippingChange}
                                        required
                                        disabled={loadingPackage !== null}
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Colonia *</label>
                                    {coloniasOpt.length > 0 ? (
                                        <select
                                            name="colonia"
                                            value={shippingData.colonia}
                                            onChange={handleShippingChange}
                                            required
                                            disabled={loadingPackage !== null}
                                            style={{ ...inputStyle, height: "44px" }}
                                        >
                                            <option value="">Selecciona</option>
                                            {coloniasOpt.map((c) => (
                                                <option key={c} value={c}>
                                                    {c}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            name="colonia"
                                            value={shippingData.colonia}
                                            onChange={handleShippingChange}
                                            required
                                            disabled={loadingPackage !== null}
                                            style={inputStyle}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Calle + Interior */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "12px",
                                }}
                            >
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Calle y # Exterior *</label>
                                    <input
                                        type="text"
                                        name="calle_numero"
                                        value={shippingData.calle_numero}
                                        onChange={handleShippingChange}
                                        required
                                        placeholder="Ej. Insurgentes Sur 123"
                                        disabled={loadingPackage !== null}
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Número Interior</label>
                                    <input
                                        type="text"
                                        name="numero_interior"
                                        value={shippingData.numero_interior}
                                        onChange={handleShippingChange}
                                        placeholder="Ej. Depto 4"
                                        disabled={loadingPackage !== null}
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                            {/* Referencia */}
                            <div style={fieldStyle}>
                                <label style={labelStyle}>Referencia de entrega *</label>
                                <textarea
                                    name="referencia"
                                    value={shippingData.referencia}
                                    onChange={handleShippingChange}
                                    required
                                    rows={2}
                                    placeholder="Ej: Casa azul con portón negro, entre calle Hidalgo y Morelos"
                                    disabled={loadingPackage !== null}
                                    style={{
                                        ...inputStyle,
                                        height: "auto",
                                        padding: "12px",
                                        resize: "vertical",
                                    }}
                                />
                            </div>
                        </div>

                        {/* Sección facturación */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div
                                onClick={() => setRequiresInvoice(!requiresInvoice)}
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "12px",
                                    padding: "16px",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    borderRadius: "16px",
                                    cursor: "pointer",
                                    backgroundColor: requiresInvoice
                                        ? "rgba(232,35,26,0.06)"
                                        : "transparent",
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={requiresInvoice}
                                    onChange={(e) => setRequiresInvoice(e.target.checked)}
                                    style={{ width: "18px", height: "18px", marginTop: "2px" }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <div>
                                    <label
                                        style={{
                                            fontWeight: 700,
                                            color: "#F4F0EB",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <FileText size={16} style={{ color: "#E8231A" }} />
                                        ¿Requieres Factura?
                                    </label>
                                    <p style={{ fontSize: "13px", color: "#9E9A95", margin: "4px 0 0" }}>
                                        Marca esta casilla y completa tus datos fiscales.
                                    </p>
                                </div>
                            </div>

                            {requiresInvoice && (
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "16px",
                                        padding: "16px",
                                        border: "1px solid rgba(232,35,26,0.20)",
                                        borderRadius: "16px",
                                        backgroundColor: "rgba(232,35,26,0.04)",
                                    }}
                                >
                                    <p
                                        style={{
                                            fontSize: "13px",
                                            fontWeight: 700,
                                            color: "#E8231A",
                                            margin: 0,
                                        }}
                                    >
                                        Datos Fiscales
                                    </p>

                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr 1fr",
                                            gap: "12px",
                                        }}
                                    >
                                        <div style={fieldStyle}>
                                            <label style={labelStyle}>RFC *</label>
                                            <input
                                                type="text"
                                                name="rfc"
                                                value={invoiceData.rfc}
                                                onChange={handleInvoiceChange}
                                                required
                                                placeholder="ABCD123456XYZ"
                                                minLength={12}
                                                maxLength={13}
                                                disabled={loadingPackage !== null}
                                                style={inputStyle}
                                            />
                                        </div>
                                        <div style={fieldStyle}>
                                            <label style={labelStyle}>CP Fiscal *</label>
                                            <input
                                                type="text"
                                                name="codigo_postal_fiscal"
                                                value={invoiceData.codigo_postal_fiscal}
                                                onChange={handleInvoiceChange}
                                                required
                                                placeholder="Ej. 11000"
                                                minLength={5}
                                                maxLength={5}
                                                disabled={loadingPackage !== null}
                                                style={inputStyle}
                                            />
                                        </div>
                                    </div>

                                    <div style={fieldStyle}>
                                        <label style={labelStyle}>Razón Social / Nombre Fiscal *</label>
                                        <input
                                            type="text"
                                            name="nombre_fiscal"
                                            value={invoiceData.nombre_fiscal}
                                            onChange={handleInvoiceChange}
                                            required
                                            placeholder="Nombre completo o Empresa SA de CV"
                                            disabled={loadingPackage !== null}
                                            style={inputStyle}
                                        />
                                    </div>

                                    <div style={fieldStyle}>
                                        <label style={labelStyle}>Régimen Fiscal *</label>
                                        <select
                                            name="regimen_fiscal"
                                            value={invoiceData.regimen_fiscal}
                                            onChange={handleInvoiceChange}
                                            required
                                            disabled={loadingPackage !== null}
                                            style={{ ...inputStyle, height: "44px" }}
                                        >
                                            <option value="">Selecciona tu régimen fiscal</option>
                                            <option value="601 - General de Ley Personas Morales">601 - General de Ley Personas Morales</option>
                                            <option value="605 - Sueldos y Salarios e Ingresos Asimilados a Salarios">605 - Sueldos y Salarios</option>
                                            <option value="606 - Arrendamiento">606 - Arrendamiento</option>
                                            <option value="612 - Personas Físicas con Actividades Empresariales y Profesionales">612 - Personas Físicas con Actividades Empresariales</option>
                                            <option value="616 - Sin obligaciones fiscales">616 - Sin obligaciones fiscales</option>
                                            <option value="621 - Incorporación Fiscal">621 - Incorporación Fiscal</option>
                                            <option value="625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas">625 - Plataformas Tecnológicas</option>
                                            <option value="626 - Régimen Simplificado de Confianza">626 - RESICO</option>
                                        </select>
                                    </div>

                                    <div style={fieldStyle}>
                                        <label style={labelStyle}>Uso de CFDI *</label>
                                        <select
                                            name="uso_cfdi"
                                            value={invoiceData.uso_cfdi}
                                            onChange={handleInvoiceChange}
                                            required
                                            disabled={loadingPackage !== null}
                                            style={{ ...inputStyle, height: "44px" }}
                                        >
                                            <option value="G01 - Adquisición de mercancías">G01 - Adquisición de mercancías</option>
                                            <option value="G03 - Gastos en general">G03 - Gastos en general</option>
                                            <option value="S01 - Sin efectos fiscales">S01 - Sin efectos fiscales</option>
                                        </select>
                                    </div>

                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr 1fr",
                                            gap: "12px",
                                        }}
                                    >
                                        <div style={fieldStyle}>
                                            <label style={labelStyle}>Email Receptor *</label>
                                            <input
                                                type="email"
                                                name="email_factura"
                                                value={invoiceData.email_factura}
                                                onChange={handleInvoiceChange}
                                                required
                                                placeholder="tu@correo.com"
                                                disabled={loadingPackage !== null}
                                                style={inputStyle}
                                            />
                                        </div>
                                        <div style={fieldStyle}>
                                            <label style={labelStyle}>WhatsApp *</label>
                                            <input
                                                type="tel"
                                                name="whatsapp_factura"
                                                value={invoiceData.whatsapp_factura}
                                                onChange={handleInvoiceChange}
                                                required
                                                placeholder="5500000000"
                                                disabled={loadingPackage !== null}
                                                style={inputStyle}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div
                    style={{
                        padding: "16px 24px",
                        borderTop: "1px solid rgba(255,255,255,0.08)",
                        display: "flex",
                        gap: "12px",
                        justifyContent: "flex-end",
                        position: "sticky",
                        bottom: 0,
                        backgroundColor: "#131311",
                        borderRadius: "0 0 24px 24px",
                    }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loadingPackage !== null}
                        style={{
                            padding: "0 24px",
                            height: "48px",
                            borderRadius: "12px",
                            fontWeight: 700,
                            backgroundColor: "transparent",
                            color: "#9E9A95",
                            border: "1px solid rgba(255,255,255,0.08)",
                            cursor: "pointer",
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="checkout-modal-form"
                        disabled={loadingPackage !== null}
                        style={{
                            flex: 1,
                            height: "48px",
                            backgroundColor: "#E8231A",
                            color: "#FFF",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "8px",
                            borderRadius: "12px",
                            fontWeight: 900,
                            border: "none",
                            cursor: loadingPackage !== null ? "not-allowed" : "pointer",
                        }}
                    >
                        {loadingPackage !== null ? (
                            <Loader2 size={18} />
                        ) : (
                            <ShoppingCart size={18} />
                        )}
                        {loadingPackage !== null ? "Procesando..." : "Continuar al Pago"}
                    </button>
                </div>
            </div>
        </div>
    );
}
