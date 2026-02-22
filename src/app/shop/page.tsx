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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
                <div className="bg-card w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-border/50 max-h-[90vh] flex flex-col animate-[fade-in-up_0.3s_ease-out]">
                    <div className="flex items-center justify-between p-6 border-b border-border/50 bg-muted/30 shrink-0">
                        <div>
                            <h3 className="text-xl font-black flex items-center gap-2">
                                <ShoppingCart size={20} className="text-primary" /> Confirmar Compra
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">Paquete {selectedPackage.charAt(0).toUpperCase() + selectedPackage.slice(1)} - ${packagePrices[selectedPackage]} MXN</p>
                        </div>
                        <button
                            onClick={() => { setSelectedPackage(null); setRequiresInvoice(false); setLoadingPackage(null); }}
                            className="p-2 bg-muted hover:bg-muted-foreground/20 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                            disabled={loadingPackage !== null}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1">
                        <form id="checkout-form" onSubmit={handleModalSubmit} className="space-y-8">

                            {/* SECCIÓN 1 - Dirección de Envío */}
                            <div className="space-y-4">
                                <h4 className="font-bold text-base text-foreground flex items-center gap-2 mb-4 border-b border-border pb-2">
                                    <MapPin size={18} className="text-primary" /> Dirección de Envío y Contacto
                                </h4>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-semibold text-muted-foreground">Nombre de quien recibe *</label>
                                        <input type="text" name="nombre_receptor" value={shippingData.nombre_receptor} onChange={handleShippingChange} required className="w-full flex h-11 rounded-xl border border-input bg-background/50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Ej. Juan Pérez" disabled={loadingPackage !== null} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-muted-foreground">Teléfono de contacto *</label>
                                        <input type="tel" name="telefono_receptor" value={shippingData.telefono_receptor} onChange={handleShippingChange} required className="w-full flex h-11 rounded-xl border border-input bg-background/50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="10 dígitos" minLength={10} maxLength={10} disabled={loadingPackage !== null} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-muted-foreground">Email de confirmación *</label>
                                        <input type="email" name="email_cliente" value={shippingData.email_cliente} onChange={handleShippingChange} required className="w-full flex h-11 rounded-xl border border-input bg-background/50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="tu@correo.com" disabled={loadingPackage !== null} />
                                    </div>

                                    <div className="space-y-2 relative">
                                        <label className="text-sm font-semibold text-muted-foreground">Código Postal *</label>
                                        <input type="text" name="codigo_postal" value={shippingData.codigo_postal} onChange={handleZipCodeChange} required className="w-full flex h-11 rounded-xl border border-input bg-background/50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Ej. 11000" minLength={5} maxLength={5} disabled={loadingPackage !== null} />
                                        {loadingZip && <Loader2 className="absolute right-3 top-9 animate-spin text-muted-foreground" size={16} />}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-muted-foreground">Estado *</label>
                                        <input type="text" name="estado" value={shippingData.estado} onChange={handleShippingChange} required className="w-full flex h-11 rounded-xl border border-input bg-background/50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" disabled={loadingPackage !== null} />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-muted-foreground">Ciudad / Municipio *</label>
                                        <input type="text" name="ciudad" value={shippingData.ciudad} onChange={handleShippingChange} required className="w-full flex h-11 rounded-xl border border-input bg-background/50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" disabled={loadingPackage !== null} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-muted-foreground">Colonia *</label>
                                        {coloniasOpt.length > 0 ? (
                                            <select name="colonia" value={shippingData.colonia} onChange={handleShippingChange} required className="w-full flex h-11 rounded-xl border border-input bg-background/50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" disabled={loadingPackage !== null}>
                                                <option value="">Selecciona Colonia</option>
                                                {coloniasOpt.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        ) : (
                                            <input type="text" name="colonia" value={shippingData.colonia} onChange={handleShippingChange} required className="w-full flex h-11 rounded-xl border border-input bg-background/50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" disabled={loadingPackage !== null} />
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-muted-foreground">Calle y # Exterior *</label>
                                        <input type="text" name="calle_numero" value={shippingData.calle_numero} onChange={handleShippingChange} required className="w-full flex h-11 rounded-xl border border-input bg-background/50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Ej. Insurgentes Sur 123" disabled={loadingPackage !== null} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-muted-foreground">Número Interior (Opcional)</label>
                                        <input type="text" name="numero_interior" value={shippingData.numero_interior} onChange={handleShippingChange} className="w-full flex h-11 rounded-xl border border-input bg-background/50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Ej. Depto 4" disabled={loadingPackage !== null} />
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-semibold text-muted-foreground">Referencia de entrega *</label>
                                        <textarea name="referencia" value={shippingData.referencia} onChange={handleShippingChange} required rows={2} className="w-full flex min-h-[60px] rounded-xl border border-input bg-background/50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all resize-none" placeholder="Ej: Casa azul con portón negro, entre calle Hidalgo y Morelos, edificio 3 depto 402" disabled={loadingPackage !== null}></textarea>
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN 2 - Facturación */}
                            <div className="space-y-4 pt-4 border-t border-border">
                                <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-2xl cursor-pointer" onClick={() => setRequiresInvoice(!requiresInvoice)}>
                                    <input
                                        type="checkbox"
                                        checked={requiresInvoice}
                                        onChange={(e) => setRequiresInvoice(e.target.checked)}
                                        className="mt-1 w-5 h-5 rounded border-input accent-primary pointer-events-none"
                                    />
                                    <div>
                                        <label className="font-bold cursor-pointer text-foreground flex items-center gap-2">
                                            <FileText size={18} className="text-primary" /> ¿Requieres Factura?
                                        </label>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Si necesitas factura, marca esta casilla y completa tus datos fiscales.
                                        </p>
                                    </div>
                                </div>

                                {requiresInvoice && (
                                    <div className="space-y-4 animate-[fade-in_0.3s_ease-out] border border-border/50 p-5 rounded-2xl bg-muted/10">
                                        <h4 className="font-bold text-sm text-primary uppercase tracking-wider mb-2">Datos Fiscales</h4>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-muted-foreground">RFC *</label>
                                                <input type="text" name="rfc" value={invoiceData.rfc} onChange={handleInvoiceChange} required className="w-full flex h-11 rounded-xl border border-input bg-background/50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring uppercase transition-all" placeholder="ABCD123456XYZ" minLength={12} maxLength={13} disabled={loadingPackage !== null} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-muted-foreground">Código Postal Fiscal *</label>
                                                <input type="text" name="codigo_postal_fiscal" value={invoiceData.codigo_postal_fiscal} onChange={handleInvoiceChange} required className="w-full flex h-11 rounded-xl border border-input bg-background/50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Ej. 11000" minLength={5} maxLength={5} disabled={loadingPackage !== null} />
                                            </div>

                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-sm font-semibold text-muted-foreground">Razón Social / Nombre Fiscal *</label>
                                                <input type="text" name="nombre_fiscal" value={invoiceData.nombre_fiscal} onChange={handleInvoiceChange} required className="w-full flex h-11 rounded-xl border border-input bg-background/50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Nombre completo o Empresa SA de CV" disabled={loadingPackage !== null} />
                                            </div>

                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-sm font-semibold text-muted-foreground">Régimen Fiscal *</label>
                                                <select name="regimen_fiscal" value={invoiceData.regimen_fiscal} onChange={handleInvoiceChange} required className="w-full flex h-11 rounded-xl border border-input bg-background/50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" disabled={loadingPackage !== null}>
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

                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-sm font-semibold text-muted-foreground">Uso de CFDI *</label>
                                                <select name="uso_cfdi" value={invoiceData.uso_cfdi} onChange={handleInvoiceChange} required className="w-full flex h-11 rounded-xl border border-input bg-background/50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" disabled={loadingPackage !== null}>
                                                    <option value="G01 - Adquisición de mercancías">G01 - Adquisición de mercancías</option>
                                                    <option value="G03 - Gastos en general">G03 - Gastos en general</option>
                                                    <option value="S01 - Sin efectos fiscales">S01 - Sin efectos fiscales</option>
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-muted-foreground">Email (Receptor) *</label>
                                                <input type="email" name="email_factura" value={invoiceData.email_factura} onChange={handleInvoiceChange} required className="w-full flex h-11 rounded-xl border border-input bg-background/50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="tu@correo.com" disabled={loadingPackage !== null} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-muted-foreground">WhatsApp (Avisos) *</label>
                                                <input type="tel" name="whatsapp_factura" value={invoiceData.whatsapp_factura} onChange={handleInvoiceChange} required className="w-full flex h-11 rounded-xl border border-input bg-background/50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="5500000000" disabled={loadingPackage !== null} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </form>
                    </div>

                    <div className="p-6 border-t border-border/50 bg-card flex flex-col sm:flex-row items-center gap-4 justify-end">
                        <button
                            type="button"
                            onClick={() => { setSelectedPackage(null); setRequiresInvoice(false); }}
                            className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold bg-muted text-foreground hover:bg-muted-foreground/20 transition-all disabled:opacity-50"
                            disabled={loadingPackage !== null}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="checkout-form"
                            disabled={loadingPackage !== null}
                            className="w-full flex justify-center items-center gap-2 sm:w-auto px-8 py-3 rounded-xl font-black bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] shadow-lg shadow-primary/20 transition-all disabled:opacity-70 disabled:pointer-events-none disabled:transform-none"
                        >
                            {loadingPackage !== null ? <Loader2 className="animate-spin" size={20} /> : <ShoppingCart size={20} />}
                            {loadingPackage !== null ? "Procesando..." : "Continuar al Pago"}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-muted/30">
            {renderCheckoutModal()}

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
                                onClick={() => setSelectedPackage("individual")}
                                className="w-full flex justify-center items-center gap-2 bg-muted text-foreground font-bold h-14 rounded-xl hover:bg-muted-foreground/20 transition-all"
                            >
                                Comprar
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
                                onClick={() => setSelectedPackage("pareja")}
                                className="w-full flex justify-center items-center gap-2 bg-primary text-primary-foreground font-black h-14 rounded-xl hover:bg-primary/90 hover:scale-[1.02] shadow-lg shadow-primary/20 transition-all"
                            >
                                Comprar
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
                                onClick={() => setSelectedPackage("familiar")}
                                className="w-full flex justify-center items-center gap-2 bg-muted text-foreground font-bold h-14 rounded-xl hover:bg-muted-foreground/20 transition-all"
                            >
                                Comprar
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
