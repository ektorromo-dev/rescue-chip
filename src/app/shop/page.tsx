"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShoppingCart, Loader2, Building2, Users, FileText, X, MapPin } from "lucide-react";
import { useState } from "react";

export default function ShopPage() {
    const [loadingPackage, setLoadingPackage] = useState<string | null>(null);
    const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

    // Estados del modal de factura
    const [requiresInvoice, setRequiresInvoice] = useState(false);
    const [invoiceData, setInvoiceData] = useState({
        rfc: "",
        nombre_fiscal: "",
        regimen_fiscal: "",
        uso_cfdi: "G03 - Gastos en general",
        codigo_postal_fiscal: "",
        email_factura: "",
        whatsapp_factura: ""
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
        email_cliente: ""
    });
    const [coloniasOpt, setColoniasOpt] = useState<string[]>([]);
    const [loadingZip, setLoadingZip] = useState(false);

    const packagePrices: Record<string, number> = {
        individual: 349,
        pareja: 549,
        familiar: 949
    };

    const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setShippingData(prev => ({ ...prev, [name]: value }));
    };

    const handleZipCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const cp = e.target.value.replace(/\D/g, "");
        setShippingData(prev => ({ ...prev, codigo_postal: cp }));

        if (cp.length === 5) {
            setLoadingZip(true);
            try {
                // Utilizando Sepomex primero
                const res = await fetch(`https://sepomex.icalialabs.com/api/v1/zip_codes?zip_code=${cp}`);
                const data = await res.json();

                if (data && data.zip_codes && data.zip_codes.length > 0) {
                    const first = data.zip_codes[0];
                    setShippingData(prev => ({
                        ...prev,
                        estado: first.d_estado,
                        ciudad: first.d_mnpio,
                        colonia: data.zip_codes.length === 1 ? first.d_asenta : ""
                    }));

                    if (data.zip_codes.length > 1) {
                        setColoniasOpt(Array.from(new Set(data.zip_codes.map((z: any) => z.d_asenta))));
                    } else {
                        setColoniasOpt([]);
                    }
                } else {
                    // Fallback Copomex
                    const res2 = await fetch(`https://api.copomex.com/query/info_cp/${cp}?token=pruebas`);
                    const data2 = await res2.json();
                    if (!data2.error) {
                        setShippingData(prev => ({
                            ...prev,
                            estado: data2[0].response.estado,
                            ciudad: data2[0].response.municipio,
                            colonia: data2.length === 1 ? data2[0].response.asentamiento : ""
                        }));
                        if (data2.length > 1) {
                            setColoniasOpt(Array.from(new Set(data2.map((d: any) => d.response.asentamiento))));
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

    const handleModalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedPackage) return;
        setLoadingPackage(selectedPackage);

        let currentFacturaId = null;

        if (requiresInvoice) {
            try {
                const resFactura = await fetch("/api/factura-notify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...invoiceData,
                        paquete: selectedPackage,
                        monto: packagePrices[selectedPackage]
                    }),
                });

                const dataFactura = await resFactura.json();

                if (!resFactura.ok || !dataFactura.factura_id) {
                    throw new Error(dataFactura.error || "Error al procesar la solicitud de factura");
                }
                currentFacturaId = dataFactura.factura_id;
            } catch (error: any) {
                console.error(error);
                alert("Error al guardar datos de facturación: " + error.message);
                setLoadingPackage(null);
                return; // Stop checkout if invoice save fails
            }
        }

        try {
            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    paquete: selectedPackage,
                    shippingData,
                    factura_id: currentFacturaId,
                    monto: packagePrices[selectedPackage]
                }),
            });

            const data = await res.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || "Error al procesar la solicitud de compra");
            }

        } catch (error: any) {
            console.error(error);
            alert("Error: " + error.message);
            setLoadingPackage(null);
        }
    };

    const getWhatsAppLink = (planName: string) => {
        const phone = "525551433904";
        const message = `Hola, me interesa el plan ${planName} de RescueChip para mi agencia/empresa.`;
        return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    };

    const handleInvoiceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setInvoiceData(prev => ({ ...prev, [name]: value }));
    };

    // Modal de Compra / Facturación
    const renderCheckoutModal = () => {
        if (!selectedPackage) return null;

        return (
            <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", backgroundColor: 'rgba(0,0,0,0.85)', overflowY: 'auto' }}>
                <div style={{ backgroundColor: "#1A1A18", width: "100%", maxWidth: "768px", borderRadius: "24px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                        <div>
                            <h3 style={{ fontSize: "20px", fontWeight: 900, display: "flex", alignItems: "center", gap: "8px" }}>
                                <ShoppingCart size={20} style={{ color: "#E8231A" }} /> Confirmar Compra
                            </h3>
                            <p style={{ fontSize: "14px", color: "#9E9A95" }}>Paquete {selectedPackage.charAt(0).toUpperCase() + selectedPackage.slice(1)} - ${packagePrices[selectedPackage]} MXN</p>
                        </div>
                        <button
                            onClick={() => { setSelectedPackage(null); setRequiresInvoice(false); setLoadingPackage(null); }}
                            style={{ backgroundColor: "#1A1A18", borderRadius: "9999px", transition: "color 0.2s, background-color 0.2s, border-color 0.2s", color: "#F4F0EB" }}
                            disabled={loadingPackage !== null}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div style={{ padding: "24px" }}>
                        <form id="checkout-form" onSubmit={handleModalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                            {/* SECCIÓN 1 - Dirección de Envío */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <h4 style={{ fontWeight: 700, fontSize: "16px", color: "#F4F0EB", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                    <MapPin size={18} style={{ color: "#E8231A" }} /> Dirección de Envío y Contacto
                                </h4>

                                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                                        <label style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Nombre de quien recibe *</label>
                                        <input type="text" name="nombre_receptor" value={shippingData.nombre_receptor} onChange={handleShippingChange} required style={{ width: "100%", display: "flex", height: "44px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", padding: "8px 0", fontSize: "14px", transition: "all 0.2s ease-in-out" }} placeholder="Ej. Juan Pérez" disabled={loadingPackage !== null} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Teléfono de contacto *</label>
                                        <input type="tel" name="telefono_receptor" value={shippingData.telefono_receptor} onChange={handleShippingChange} required style={{ width: "100%", display: "flex", height: "44px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", padding: "8px 0", fontSize: "14px", transition: "all 0.2s ease-in-out" }} placeholder="10 dígitos" minLength={10} maxLength={10} disabled={loadingPackage !== null} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Email de confirmación *</label>
                                        <input type="email" name="email_cliente" value={shippingData.email_cliente} onChange={handleShippingChange} required style={{ width: "100%", display: "flex", height: "44px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", padding: "8px 0", fontSize: "14px", transition: "all 0.2s ease-in-out" }} placeholder="tu@correo.com" disabled={loadingPackage !== null} />
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", position: "relative" }}>
                                        <label style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Código Postal *</label>
                                        <input type="text" name="codigo_postal" value={shippingData.codigo_postal} onChange={handleZipCodeChange} required style={{ width: "100%", display: "flex", height: "44px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", padding: "8px 0", fontSize: "14px", transition: "all 0.2s ease-in-out" }} placeholder="Ej. 11000" minLength={5} maxLength={5} disabled={loadingPackage !== null} />
                                        {loadingZip && <Loader2 style={{ position: "absolute", color: "#9E9A95" }} size={16} />}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Estado *</label>
                                        <input type="text" name="estado" value={shippingData.estado} onChange={handleShippingChange} required style={{ width: "100%", display: "flex", height: "44px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", padding: "8px 0", fontSize: "14px", transition: "all 0.2s ease-in-out" }} disabled={loadingPackage !== null} />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Ciudad / Municipio *</label>
                                        <input type="text" name="ciudad" value={shippingData.ciudad} onChange={handleShippingChange} required style={{ width: "100%", display: "flex", height: "44px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", padding: "8px 0", fontSize: "14px", transition: "all 0.2s ease-in-out" }} disabled={loadingPackage !== null} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Colonia *</label>
                                        {coloniasOpt.length > 0 ? (
                                            <select name="colonia" value={shippingData.colonia} onChange={handleShippingChange} required style={{ width: "100%", display: "flex", height: "44px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", padding: "8px 0", fontSize: "14px", transition: "all 0.2s ease-in-out" }} disabled={loadingPackage !== null}>
                                                <option value="">Selecciona Colonia</option>
                                                {coloniasOpt.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        ) : (
                                            <input type="text" name="colonia" value={shippingData.colonia} onChange={handleShippingChange} required style={{ width: "100%", display: "flex", height: "44px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", padding: "8px 0", fontSize: "14px", transition: "all 0.2s ease-in-out" }} disabled={loadingPackage !== null} />
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Calle y # Exterior *</label>
                                        <input type="text" name="calle_numero" value={shippingData.calle_numero} onChange={handleShippingChange} required style={{ width: "100%", display: "flex", height: "44px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", padding: "8px 0", fontSize: "14px", transition: "all 0.2s ease-in-out" }} placeholder="Ej. Insurgentes Sur 123" disabled={loadingPackage !== null} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Número Interior (Opcional)</label>
                                        <input type="text" name="numero_interior" value={shippingData.numero_interior} onChange={handleShippingChange} style={{ width: "100%", display: "flex", height: "44px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", padding: "8px 0", fontSize: "14px", transition: "all 0.2s ease-in-out" }} placeholder="Ej. Depto 4" disabled={loadingPackage !== null} />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                                        <label style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Referencia de entrega *</label>
                                        <textarea name="referencia" value={shippingData.referencia} onChange={handleShippingChange} required rows={2} style={{ width: "100%", display: "flex", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", padding: "8px 0", fontSize: "14px", transition: "all 0.2s ease-in-out" }} placeholder="Ej: Casa azul con portón negro, entre calle Hidalgo y Morelos, edificio 3 depto 402" disabled={loadingPackage !== null}></textarea>
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN 2 - Facturación */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "16px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px" }} onClick={() => setRequiresInvoice(!requiresInvoice)}>
                                    <input
                                        type="checkbox"
                                        checked={requiresInvoice}
                                        onChange={(e) => setRequiresInvoice(e.target.checked)}
                                        style={{ width: "20px", height: "20px", borderRadius: "4px" }}
                                    />
                                    <div>
                                        <label style={{ fontWeight: 700, color: "#F4F0EB", display: "flex", alignItems: "center", gap: "8px" }}>
                                            <FileText size={18} style={{ color: "#E8231A" }} /> ¿Requieres Factura?
                                        </label>
                                        <p style={{ fontSize: "14px", color: "#9E9A95" }}>
                                            Si necesitas factura, marca esta casilla y completa tus datos fiscales.
                                        </p>
                                    </div>
                                </div>

                                {requiresInvoice && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px" }}>
                                        <h4 style={{ fontWeight: 700, fontSize: "14px", color: "#E8231A", marginBottom: "8px" }}>Datos Fiscales</h4>

                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>RFC *</label>
                                                <input type="text" name="rfc" value={invoiceData.rfc} onChange={handleInvoiceChange} required style={{ width: "100%", display: "flex", height: "44px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", padding: "8px 0", fontSize: "14px", transition: "all 0.2s ease-in-out" }} placeholder="ABCD123456XYZ" minLength={12} maxLength={13} disabled={loadingPackage !== null} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Código Postal Fiscal *</label>
                                                <input type="text" name="codigo_postal_fiscal" value={invoiceData.codigo_postal_fiscal} onChange={handleInvoiceChange} required style={{ width: "100%", display: "flex", height: "44px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", padding: "8px 0", fontSize: "14px", transition: "all 0.2s ease-in-out" }} placeholder="Ej. 11000" minLength={5} maxLength={5} disabled={loadingPackage !== null} />
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                                                <label style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Razón Social / Nombre Fiscal *</label>
                                                <input type="text" name="nombre_fiscal" value={invoiceData.nombre_fiscal} onChange={handleInvoiceChange} required style={{ width: "100%", display: "flex", height: "44px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", padding: "8px 0", fontSize: "14px", transition: "all 0.2s ease-in-out" }} placeholder="Nombre completo o Empresa SA de CV" disabled={loadingPackage !== null} />
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                                                <label style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Régimen Fiscal *</label>
                                                <select name="regimen_fiscal" value={invoiceData.regimen_fiscal} onChange={handleInvoiceChange} required style={{ width: "100%", display: "flex", height: "44px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", padding: "8px 0", fontSize: "14px", transition: "all 0.2s ease-in-out" }} disabled={loadingPackage !== null}>
                                                    <option value="">Selecciona tu régimen fiscal</option>
                                                    <option value="601 - General de Ley Personas Morales">601 - General de Ley Personas Morales</option>
                                                    <option value="603 - Personas Morales con Fines no Lucrativos">603 - Personas Morales con Fines no Lucrativos</option>
                                                    <option value="605 - Sueldos y Salarios e Ingresos Asimilados a Salarios">605 - Sueldos y Salarios e Ingresos Asimilados a Salarios</option>
                                                    <option value="606 - Arrendamiento">606 - Arrendamiento</option>
                                                    <option value="608 - Demás ingresos">608 - Demás ingresos</option>
                                                    <option value="610 - Residentes en el Extranjero sin Establecimiento Permanente en México">610 - Residentes en el Extranjero sin Establecimiento Permanente en México</option>
                                                    <option value="612 - Personas Físicas con Actividades Empresariales y Profesionales">612 - Personas Físicas con Actividades Empresariales y Profesionales</option>
                                                    <option value="616 - Sin obligaciones fiscales">616 - Sin obligaciones fiscales</option>
                                                    <option value="620 - Sociedades Cooperativas de Producción que optan por diferir sus ingresos">620 - Sociedades Cooperativas de Producción que optan por diferir sus ingresos</option>
                                                    <option value="621 - Incorporación Fiscal">621 - Incorporación Fiscal</option>
                                                    <option value="622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras">622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras</option>
                                                    <option value="625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas">625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas</option>
                                                    <option value="626 - Régimen Simplificado de Confianza">626 - Régimen Simplificado de Confianza</option>
                                                </select>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                                                <label style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Uso de CFDI *</label>
                                                <select name="uso_cfdi" value={invoiceData.uso_cfdi} onChange={handleInvoiceChange} required style={{ width: "100%", display: "flex", height: "44px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", padding: "8px 0", fontSize: "14px", transition: "all 0.2s ease-in-out" }} disabled={loadingPackage !== null}>
                                                    <option value="G01 - Adquisición de mercancías">G01 - Adquisición de mercancías</option>
                                                    <option value="G03 - Gastos en general">G03 - Gastos en general</option>
                                                    <option value="S01 - Sin efectos fiscales">S01 - Sin efectos fiscales</option>
                                                </select>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>Email (Receptor) *</label>
                                                <input type="email" name="email_factura" value={invoiceData.email_factura} onChange={handleInvoiceChange} required style={{ width: "100%", display: "flex", height: "44px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", padding: "8px 0", fontSize: "14px", transition: "all 0.2s ease-in-out" }} placeholder="tu@correo.com" disabled={loadingPackage !== null} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: "14px", fontWeight: 600, color: "#9E9A95" }}>WhatsApp (Avisos) *</label>
                                                <input type="tel" name="whatsapp_factura" value={invoiceData.whatsapp_factura} onChange={handleInvoiceChange} required style={{ width: "100%", display: "flex", height: "44px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", padding: "8px 0", fontSize: "14px", transition: "all 0.2s ease-in-out" }} placeholder="5500000000" disabled={loadingPackage !== null} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </form>
                    </div>

                    <div style={{ padding: "24px", borderTop: "1px solid rgba(255,255,255,0.08)", backgroundColor: "#1A1A18", display: "flex", flexDirection: "row", alignItems: "center", gap: "16px", justifyContent: "flex-end" }}>
                        <button
                            type="button"
                            onClick={() => { setSelectedPackage(null); setRequiresInvoice(false); }}
                            style={{ width: "NaNpx", padding: "0 24px", borderRadius: "12px", fontWeight: 700, backgroundColor: "#1A1A18", color: "#F4F0EB", transition: "all 0.2s ease-in-out", opacity: 0.5 }}
                            disabled={loadingPackage !== null}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="checkout-form"
                            disabled={loadingPackage !== null}
                            style={{ width: "100%", height: "56px", backgroundColor: "#E8231A", color: "#FFF", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", borderRadius: "12px", fontWeight: 900, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", transition: "all 0.2s ease-in-out", border: "none" }}
                        >
                            {loadingPackage !== null ? <Loader2 size={20} /> : <ShoppingCart size={20} />}
                            {loadingPackage !== null ? "Procesando..." : "Continuar al Pago"}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#0A0A08", display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 0" }}>
            <div style={{ maxWidth: '896px', width: '100%', backgroundColor: "#1A1A18", borderRadius: "16px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", border: "1px solid rgba(255,255,255,0.08)", padding: "32px", overflow: "hidden", position: "relative" }}>
                {renderCheckoutModal()}

                {/* Header / Hero Shop */}
                <div style={{ padding: "0 24px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, right: 0, width: "320px", height: "320px", borderRadius: "9999px" }} />
                    <div style={{ width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative", zIndex: 10 }}>
                        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", borderRadius: "9999px", transition: "color 0.2s, background-color 0.2s, border-color 0.2s", marginBottom: "32px", fontWeight: 500, fontSize: "12px" }}>
                            <ArrowLeft size={16} /> Volver al Inicio
                        </Link>
                        <h1 style={{ fontSize: "36px", fontWeight: 900, marginBottom: "16px", display: "flex", alignItems: "center", gap: "16px" }}>
                            <ShoppingCart size={32} style={{ display: "block" }} /> Tienda Oficial
                        </h1>
                        <p style={{ fontSize: "18px", fontWeight: 500, maxWidth: "672px" }}>
                            Adquiere tus chips NFC inteligentes y viaja con total tranquilidad.
                        </p>
                    </div>
                </div>

                <div style={{ width: "100%", margin: "0 auto", position: "relative" }}>

                    {/* SECCIÓN 1 - PÚBLICO GENERAL */}
                    <section>
                        <div style={{ textAlign: "center" }}>
                            <h2 style={{ fontSize: "36px", color: "#F4F0EB", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                                <Users size={32} style={{ color: "#E8231A", display: "block" }} /> Protege tu vida en cada rodada
                            </h2>
                            <p style={{ color: "#E8231A", fontWeight: 700, display: "inline-block", padding: "0 16px", borderRadius: "9999px" }}>🚚 Envío GRATIS a todo México</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '32px', alignItems: 'flex-start' }}>
                            {/* Plan Individual */}
                            <div style={{ backgroundColor: "#1A1A18", borderRadius: "24px", padding: "32px", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", display: "flex", flexDirection: "column", height: "100%", transition: "all 0.2s ease-in-out" }}>
                                <h3 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "8px" }}>Individual</h3>
                                <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
                                    <span style={{ fontSize: "36px", fontWeight: 900 }}>$349</span>
                                    <span style={{ color: "#9E9A95", fontWeight: 700 }}>MXN</span>
                                </div>
                                <ul style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
                                    <li style={{ display: "flex", alignItems: "flex-start", gap: "12px", color: "#9E9A95" }}><CheckCircle2 style={{ color: "#E8231A" }} size={20} /> 1 chip NFC</li>
                                    <li style={{ display: "flex", alignItems: "flex-start", gap: "12px", color: "#9E9A95" }}><CheckCircle2 style={{ color: "#E8231A" }} size={20} /> 1 sticker protector</li>
                                    <li style={{ display: "flex", alignItems: "flex-start", gap: "12px", color: "#9E9A95" }}><CheckCircle2 style={{ color: "#E8231A" }} size={20} /> Activación digital</li>
                                    <li style={{ display: "flex", alignItems: "flex-start", gap: "12px", color: "#9E9A95" }}><CheckCircle2 style={{ color: "#E8231A" }} size={20} /> Envío gratis (México)</li>
                                </ul>
                                <button
                                    onClick={() => setSelectedPackage("individual")}
                                    style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", backgroundColor: "#1A1A18", color: "#F4F0EB", fontWeight: 700, height: "56px", borderRadius: "12px", transition: "all 0.2s ease-in-out" }}
                                >
                                    Comprar
                                </button>
                            </div>

                            {/* Plan Pareja (Más Popular) */}
                            <div style={{ backgroundColor: "#1A1A18", borderRadius: "24px", padding: "32px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", position: "relative", display: "flex", flexDirection: "column", height: "100%", zIndex: 10 }}>
                                <div style={{ position: "absolute", padding: "0 16px", borderRadius: "9999px", fontSize: "14px", fontWeight: 900 }}>
                                    Más Popular
                                </div>
                                <h3 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "8px" }}>Pareja</h3>
                                <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
                                    <span style={{ fontSize: "36px", fontWeight: 900 }}>$549</span>
                                    <span style={{ color: "#9E9A95", fontWeight: 700 }}>MXN</span>
                                </div>
                                <ul style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
                                    <li style={{ display: "flex", alignItems: "flex-start", gap: "12px", fontWeight: 500 }}><CheckCircle2 style={{ color: "#E8231A" }} size={20} /> 2 chips NFC</li>
                                    <li style={{ display: "flex", alignItems: "flex-start", gap: "12px", fontWeight: 500 }}><CheckCircle2 style={{ color: "#E8231A" }} size={20} /> 2 stickers protectores</li>
                                    <li style={{ display: "flex", alignItems: "flex-start", gap: "12px", fontWeight: 500 }}><CheckCircle2 style={{ color: "#E8231A" }} size={20} /> Activación digital compartida</li>
                                    <li style={{ display: "flex", alignItems: "flex-start", gap: "12px", fontWeight: 500 }}><CheckCircle2 style={{ color: "#E8231A" }} size={20} /> Envío gratis (México)</li>
                                </ul>
                                <button
                                    onClick={() => setSelectedPackage("pareja")}
                                    style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", fontWeight: 900, height: "56px", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", transition: "all 0.2s ease-in-out" }}
                                >
                                    Comprar
                                </button>
                            </div>

                            {/* Plan Familiar */}
                            <div style={{ backgroundColor: "#1A1A18", borderRadius: "24px", padding: "32px", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", position: "relative", display: "flex", flexDirection: "column", height: "100%", transition: "all 0.2s ease-in-out" }}>
                                <div style={{ position: "absolute", borderRadius: "9999px", fontSize: "12px", fontWeight: 700 }}>
                                    Mejor Valor
                                </div>
                                <h3 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "8px" }}>Familiar</h3>
                                <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
                                    <span style={{ fontSize: "36px", fontWeight: 900 }}>$949</span>
                                    <span style={{ color: "#9E9A95", fontWeight: 700 }}>MXN</span>
                                </div>
                                <ul style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
                                    <li style={{ display: "flex", alignItems: "flex-start", gap: "12px", color: "#9E9A95" }}><CheckCircle2 style={{ color: "#E8231A" }} size={20} /> 4 chips NFC</li>
                                    <li style={{ display: "flex", alignItems: "flex-start", gap: "12px", color: "#9E9A95" }}><CheckCircle2 style={{ color: "#E8231A" }} size={20} /> 4 stickers protectores</li>
                                    <li style={{ display: "flex", alignItems: "flex-start", gap: "12px", color: "#9E9A95" }}><CheckCircle2 style={{ color: "#E8231A" }} size={20} /> Activación digital grupal</li>
                                    <li style={{ display: "flex", alignItems: "flex-start", gap: "12px", color: "#9E9A95" }}><CheckCircle2 style={{ color: "#E8231A" }} size={20} /> Envío gratis (México)</li>
                                </ul>
                                <button
                                    onClick={() => setSelectedPackage("familiar")}
                                    style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", backgroundColor: "#1A1A18", color: "#F4F0EB", fontWeight: 700, height: "56px", borderRadius: "12px", transition: "all 0.2s ease-in-out" }}
                                >
                                    Comprar
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* DIVISOR */}
                    <div style={{ width: "100%", height: "NaNpx", maxWidth: "896px", margin: "0 auto" }} />

                    {/* SECCIÓN 2 - AGENCIAS Y B2B */}
                    <section>
                        <div style={{ textAlign: "center" }}>
                            <h2 style={{ fontSize: "36px", color: "#F4F0EB", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "16px" }}>
                                <Building2 size={32} style={{ color: "#E8231A", display: "block" }} /> Planes para Agencias de Motos y Empresas
                            </h2>
                            <p style={{ fontSize: "18px", color: "#9E9A95", maxWidth: "672px", margin: "0 auto" }}>Ofrece seguridad médica como valor agregado a tus clientes y mejora la experiencia de compra en tu negocio.</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                            {/* Starter */}
                            <div style={{ backgroundColor: "#1A1A18", borderRadius: "16px", padding: "24px", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                <div>
                                    <h3 style={{ fontSize: "20px", fontWeight: 700 }}>Starter</h3>
                                    <p style={{ fontSize: "14px", fontWeight: 500, color: "#9E9A95", marginBottom: "16px" }}>50 chips a $179 c/u</p>
                                    <div style={{ fontSize: "30px", fontWeight: 900, marginBottom: "24px" }}>$8,950 MXN</div>
                                </div>
                                <Link href={getWhatsAppLink("Starter")} target="_blank" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#1A1A18", color: "#F4F0EB", fontWeight: 700, height: "48px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", transition: "color 0.2s, background-color 0.2s, border-color 0.2s" }}>
                                    Solicitar
                                </Link>
                            </div>

                            {/* Growth */}
                            <div style={{ borderRadius: "16px", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                <div style={{ position: "absolute", top: 0, right: 0, fontSize: "12px", fontWeight: 700 }}>
                                    Recomendado
                                </div>
                                <div>
                                    <h3 style={{ fontSize: "20px", fontWeight: 700 }}>Growth</h3>
                                    <p style={{ fontSize: "14px", fontWeight: 500, color: "#9E9A95", marginBottom: "16px" }}>100 chips a $149 c/u</p>
                                    <div style={{ fontSize: "30px", fontWeight: 900, color: "#E8231A", marginBottom: "24px" }}>$14,900 MXN</div>
                                </div>
                                <Link href={getWhatsAppLink("Growth")} target="_blank" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, height: "48px", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", transition: "all 0.2s ease-in-out" }}>
                                    Solicitar
                                </Link>
                            </div>

                            {/* Premium */}
                            <div style={{ borderRadius: "16px", padding: "24px", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                <div>
                                    <h3 style={{ fontSize: "20px", fontWeight: 700 }}>Premium</h3>
                                    <p style={{ fontSize: "14px", fontWeight: 500, marginBottom: "16px" }}>300+ chips a $119 c/u</p>
                                    <div style={{ fontSize: "24px", fontWeight: 900, marginBottom: "24px" }}>Precio negociable</div>
                                </div>
                                <Link href={getWhatsAppLink("Premium")} target="_blank" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, height: "48px", borderRadius: "12px", transition: "color 0.2s, background-color 0.2s, border-color 0.2s" }}>
                                    Contáctanos
                                </Link>
                            </div>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}
