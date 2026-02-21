"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

function ActivationFormContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const supabase = createClient();

    const folioFromUrl = searchParams.get("folio") || "";

    const [folio, setFolio] = useState(folioFromUrl);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [isMotorcyclist, setIsMotorcyclist] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);

    useEffect(() => {
        if (folioFromUrl) {
            setFolio(folioFromUrl);
        }
    }, [folioFromUrl]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        const formData = new FormData(e.currentTarget);

        try {
            // Limpiar el folio de espacios innecesarios
            const cleanFolio = folio.trim();
            console.log("Activación - Buscando chip con folio:", cleanFolio);

            // 1. Verify chip exists and is not activated
            const { data: chip, error: chipError } = await supabase
                .from('chips')
                .select('*')
                .ilike('folio', cleanFolio)
                .single();

            console.log("Activación - Respuesta de Supabase:", { chip, chipError });

            if (chipError || !chip) {
                throw new Error("Folio de chip RescueChip inválido o no reconocido.");
            }

            if (chip.activated) {
                throw new Error("Este chip ya ha sido activado previamente.");
            }

            // Build emergency contacts array dynamically
            const emergencyContacts = [];

            // Contact 1 (Required)
            emergencyContacts.push({
                name: formData.get("contact1Name") as string,
                phone: formData.get("contact1Phone") as string
            });

            // Contact 2 (Optional)
            const contact2Name = formData.get("contact2Name") as string;
            const contact2Phone = formData.get("contact2Phone") as string;
            if (contact2Name && contact2Phone) {
                emergencyContacts.push({ name: contact2Name, phone: contact2Phone });
            }

            // Contact 3 (Optional)
            const contact3Name = formData.get("contact3Name") as string;
            const contact3Phone = formData.get("contact3Phone") as string;
            if (contact3Name && contact3Phone) {
                emergencyContacts.push({ name: contact3Name, phone: contact3Phone });
            }

            // Optional integer parsing
            const ageStr = formData.get("age") as string;
            const age = ageStr ? parseInt(ageStr, 10) : null;

            // Optional boolean parsing
            const organDonor = formData.get("organDonor") === "on";

            let photoUrl = null;
            if (photoFile) {
                const fileExt = photoFile.name.split('.').pop();
                const fileName = `${chip.id}-${Math.random()}.${fileExt}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('profile-photos')
                    .upload(fileName, photoFile);

                if (uploadError) {
                    throw new Error("No se pudo subir la foto de perfil. Inténtalo de nuevo.");
                }

                const { data: publicUrlData } = supabase.storage
                    .from('profile-photos')
                    .getPublicUrl(fileName);

                photoUrl = publicUrlData.publicUrl;
            }

            // 2. Insert profile
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    chip_id: chip.id,
                    photo_url: photoUrl,
                    full_name: formData.get("fullName") as string,
                    age: age,
                    location: formData.get("location") as string,
                    emergency_contacts: emergencyContacts,
                    blood_type: formData.get("bloodType") as string,
                    allergies: formData.get("allergies") as string,
                    medical_conditions: formData.get("medicalConditions") as string,
                    important_medications: formData.get("importantMedications") as string,
                    insurance_provider: formData.get("insuranceProvider") as string,
                    policy_number: formData.get("policyNumber") as string,
                    medical_system: formData.get("medicalSystem") as string,
                    organ_donor: organDonor,
                    is_motorcyclist: isMotorcyclist,
                    additional_notes: formData.get("additionalNotes") as string,
                    google_maps_link: formData.get("googleMapsLink") as string,
                });

            if (profileError) {
                throw new Error(profileError.message);
            }

            // 3. Update chip as activated
            const { error: activateError } = await supabase
                .from('chips')
                .update({ activated: true })
                .eq('id', chip.id);

            if (activateError) {
                throw new Error("Error al activar el chip. Por favor contacta a soporte.");
            }

            // 4. Redirect to the profile page
            router.push(`/profile/${encodeURIComponent(chip.folio)}`);

        } catch (err: any) {
            setErrorMsg(err.message || "Ocurrió un error inesperado.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 md:p-12">

            <div className="flex items-start gap-4 p-4 mb-8 bg-accent/50 text-accent-foreground rounded-2xl border border-accent/20">
                <div className="mt-1">
                    <AlertCircle size={20} />
                </div>
                <div>
                    <h4 className="font-semibold mb-1">Aviso de Privacidad</h4>
                    <p className="text-sm opacity-90 leading-relaxed">
                        La información que proporciones aquí será accesible únicamente al escanear físicamente el chip NFC asociado a este folio. Por favor revisa que tus datos sean correctos para asegurar la mejor atención médica posible en caso de emergencia.
                    </p>
                </div>
            </div>

            {errorMsg && (
                <div className="p-4 mb-8 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm font-semibold flex items-center gap-2">
                    <AlertCircle size={18} /> {errorMsg}
                </div>
            )}

            <form className="space-y-10" onSubmit={handleSubmit}>

                {/* Confirmación del Chip */}
                <section className="space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2 border-b border-border pb-2">
                        <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">✓</span>
                        Verificación del Chip
                    </h3>
                    <div className="space-y-2">
                        <label htmlFor="folio" className="text-sm font-semibold">Número de Folio (incluido en tu paquete) *</label>
                        <input type="text" id="folio" name="folio" value={folio} onChange={(e) => setFolio(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all uppercase placeholder:normal-case font-mono" placeholder="Ej. RSC-0001" required />
                    </div>
                </section>

                {/* IDENTIFICACIÓN */}
                <section className="space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2 border-b border-border pb-2">
                        <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                        Identificación
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4 md:col-span-2 mt-2 mb-4">
                            <label className="text-sm font-semibold">Foto de Perfil (Opcional pero Recomendado)</label>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                {photoFile ? (
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary bg-muted shrink-0 shadow-md">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={URL.createObjectURL(photoFile)} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-muted-foreground flex items-center justify-center bg-muted/50 text-muted-foreground shrink-0 text-2xl">
                                        📷
                                    </div>
                                )}
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setPhotoFile(e.target.files[0]);
                                            }
                                        }}
                                        className="w-full flex h-14 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer shadow-sm"
                                    />
                                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed font-medium">Sube o toma una foto clara de tu rostro.<br />Establece tu identidad rápidamente ante los paramédicos.</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label htmlFor="fullName" className="text-sm font-semibold">Nombre Completo *</label>
                            <input type="text" id="fullName" name="fullName" className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Juan Pérez" required />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="age" className="text-sm font-semibold">Edad (Opcional)</label>
                            <input type="number" id="age" name="age" className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Ej. 30" min="0" max="130" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="location" className="text-sm font-semibold">Ciudad / País *</label>
                            <input type="text" id="location" name="location" className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Ciudad de México, México" required />
                        </div>
                    </div>
                </section>

                {/* CONTACTOS DE EMERGENCIA */}
                <section className="space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2 border-b border-border pb-2">
                        <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                        Contactos de Emergencia
                    </h3>

                    <div className="p-4 border border-border rounded-xl space-y-4 bg-muted/20">
                        <h4 className="text-sm font-bold text-primary">Contacto 1 (Requerido)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="contact1Name" className="text-sm font-semibold text-muted-foreground">Nombre</label>
                                <input type="text" id="contact1Name" name="contact1Name" className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Ej. María López (Esposa)" required />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="contact1Phone" className="text-sm font-semibold text-muted-foreground">Teléfono</label>
                                <input type="tel" id="contact1Phone" name="contact1Phone" className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="+52 55 1234 5678" required />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border border-border rounded-xl space-y-4 bg-muted/10">
                        <h4 className="text-sm font-bold opacity-70">Contacto 2 (Opcional)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="contact2Name" className="text-sm font-semibold text-muted-foreground">Nombre</label>
                                <input type="text" id="contact2Name" name="contact2Name" className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Nombre completo o parentesco" />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="contact2Phone" className="text-sm font-semibold text-muted-foreground">Teléfono</label>
                                <input type="tel" id="contact2Phone" name="contact2Phone" className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="+52 55 0000 0000" />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border border-border rounded-xl space-y-4 bg-muted/10">
                        <h4 className="text-sm font-bold opacity-70">Contacto 3 (Opcional)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="contact3Name" className="text-sm font-semibold text-muted-foreground">Nombre</label>
                                <input type="text" id="contact3Name" name="contact3Name" className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Nombre completo o parentesco" />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="contact3Phone" className="text-sm font-semibold text-muted-foreground">Teléfono</label>
                                <input type="tel" id="contact3Phone" name="contact3Phone" className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="+52 55 0000 0000" />
                            </div>
                        </div>
                    </div>

                </section>

                {/* INFORMACIÓN MÉDICA */}
                <section className="space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2 border-b border-border pb-2">
                        <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
                        Información Médica
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="bloodType" className="text-sm font-semibold">Tipo de Sangre *</label>
                            <select id="bloodType" name="bloodType" className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" required>
                                <option value="">Selecciona tu tipo de sangre</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                                <option value="Desconocido">Lo desconozco</option>
                            </select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label htmlFor="allergies" className="text-sm font-semibold">Alergias Conocidas (Opcional)</label>
                            <input type="text" id="allergies" name="allergies" className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Ej. Penicilina, Látex, Mariscos..." />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label htmlFor="medicalConditions" className="text-sm font-semibold">Condiciones Médicas (Opcional)</label>
                            <textarea id="medicalConditions" name="medicalConditions" className="w-full flex min-h-[100px] rounded-xl border border-input bg-background px-4 py-3 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Ej. Asma, Diabetes Tipo 1, Hipertensión..." />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label htmlFor="importantMedications" className="text-sm font-semibold">Medicamentos Importantes (Opcional)</label>
                            <textarea id="importantMedications" name="importantMedications" className="w-full flex min-h-[100px] rounded-xl border border-input bg-background px-4 py-3 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Ej. Insulina, anticoagulantes..." />
                        </div>
                    </div>
                </section>

                {/* SEGURO MÉDICO */}
                <section className="space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2 border-b border-border pb-2">
                        <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
                        Seguro Médico <span className="text-muted-foreground font-normal text-sm ml-2">(Opcional)</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2">
                            <label htmlFor="medicalSystem" className="text-sm font-semibold">Sistema Médico u Organización</label>
                            <select id="medicalSystem" name="medicalSystem" className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all">
                                <option value="">Selecciona tu sistema (Opcional)</option>
                                <option value="IMSS">IMSS</option>
                                <option value="ISSSTE">ISSSTE</option>
                                <option value="Seguro Popular / Insabi">Seguro Popular / INSABI</option>
                                <option value="Seguro Médico Privado">Seguro Médico Privado</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="insuranceProvider" className="text-sm font-semibold">Aseguradora (Si aplica)</label>
                            <input type="text" id="insuranceProvider" name="insuranceProvider" className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Ej. GNP, AXA, MetLife..." />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="policyNumber" className="text-sm font-semibold">Número de Póliza / Afiliación</label>
                            <input type="text" id="policyNumber" name="policyNumber" className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Número de seguro o póliza" />
                        </div>
                        <div className="space-y-2 flex items-center gap-3 pt-6 rounded-xl border border-border p-4 bg-muted/20 md:col-span-2">
                            <input type="checkbox" id="organDonor" name="organDonor" className="w-5 h-5 rounded border-input accent-primary text-primary" />
                            <label htmlFor="organDonor" className="text-sm font-semibold cursor-pointer">Soy donante oficial de órganos</label>
                        </div>
                    </div>
                </section>

                {/* NOTAS IMPORTANTES & UBICACION */}
                <section className="space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2 border-b border-border pb-2">
                        <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">5</span>
                        Notas y Ubicación
                    </h3>

                    <div className="space-y-2 flex flex-col gap-2 pt-2 rounded-xl border border-primary/30 p-5 bg-primary/5 mb-6">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isMotorcyclist"
                                name="isMotorcyclist"
                                className="w-5 h-5 rounded border-input accent-primary text-primary"
                                checked={isMotorcyclist}
                                onChange={(e) => setIsMotorcyclist(e.target.checked)}
                            />
                            <label htmlFor="isMotorcyclist" className="text-sm font-bold cursor-pointer text-primary">¿Eres Motociclista?</label>
                        </div>
                        {isMotorcyclist && (
                            <div className="ml-8 mt-2 text-sm text-destructive font-bold flex items-center gap-2 animate-[fade-in-up_0.3s_ease-out_forwards]">
                                <AlertCircle size={16} />
                                Tu perfil mostrará una alerta para los paramédicos pidiendo "NO RETIRAR EL CASCO" si no hay personal médico capacitado.
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2">
                            <label htmlFor="additionalNotes" className="text-sm font-semibold">Notas Adicionales (Opcional)</label>
                            <textarea id="additionalNotes" name="additionalNotes" className="w-full flex min-h-[100px] rounded-xl border border-input bg-background px-4 py-3 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Cualquier información adicional que los paramédicos o doctores deban saber." />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label htmlFor="googleMapsLink" className="text-sm font-semibold">Enlace de Ubicación (Google Maps) (Opcional)</label>
                            <input type="url" id="googleMapsLink" name="googleMapsLink" className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" placeholder="Ejemplo: domicilio, ciudad u hospital particular" />
                        </div>
                    </div>
                </section>


                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground h-16 rounded-2xl text-xl font-black hover:scale-[1.02] hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 mt-8 disabled:opacity-70 disabled:pointer-events-none disabled:transform-none">
                    {loading ? <Loader2 size={24} className="animate-spin" /> : <CheckCircle2 size={24} />}
                    {loading ? "Registrando Ficha..." : "Aceptar y Activar Chip"}
                </button>
                <p className="text-xs text-center text-muted-foreground mt-4 font-medium">
                    Al registrarte, confirmas que la información ingresada es legítima y autorizas su exposición a personal de rescate/primeros auxilios a través de tu RescueChip.
                </p>
            </form>

        </div>
    );
}

export default function ActivatePage() {
    return (
        <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-0 md:p-4">
            <div className="w-full max-w-3xl bg-card md:rounded-[2.5rem] shadow-2xl border-x md:border border-border/50 overflow-hidden">

                {/* Header */}
                <div className="bg-destructive px-8 py-12 text-destructive-foreground relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                    <Link href="/" className="inline-flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full text-white/90 hover:bg-white/30 hover:text-white transition-colors mb-8 font-medium text-xs uppercase tracking-wider">
                        <ArrowLeft size={16} /> Volver al Inicio
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3 relative z-10">
                        Activa tu RescueChip
                    </h1>
                    <p className="text-white/90 relative z-10 text-lg md:text-xl font-medium max-w-lg">
                        Crea tu perfil médico de emergencia en minutos.
                    </p>
                </div>

                {/* Form Container with Suspense for useSearchParams */}
                <Suspense fallback={
                    <div className="p-24 flex flex-col items-center justify-center text-muted-foreground">
                        <Loader2 size={48} className="animate-spin text-primary/30 mb-4" />
                        <p className="font-medium animate-pulse">Cargando formulario de registro...</p>
                    </div>
                }>
                    <ActivationFormContent />
                </Suspense>

            </div>
        </div>
    );
}
