"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2, LogOut, LayoutDashboard, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
    const router = useRouter();
    const supabase = createClient();

    const [loadingAuth, setLoadingAuth] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const [profileId, setProfileId] = useState("");
    const [folio, setFolio] = useState("");

    // Photo
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);

    // Form fields
    const [fullName, setFullName] = useState("");
    const [age, setAge] = useState("");
    const [location, setLocation] = useState("");
    const [bloodType, setBloodType] = useState("");
    const [allergies, setAllergies] = useState("");
    const [medicalConditions, setMedicalConditions] = useState("");
    const [importantMedications, setImportantMedications] = useState("");
    const [insuranceProvider, setInsuranceProvider] = useState("");
    const [policyNumber, setPolicyNumber] = useState("");
    const [medicalSystem, setMedicalSystem] = useState("");

    // New Insurance fields
    const [aseguradora, setAseguradora] = useState("");
    const [aseguradoraOtra, setAseguradoraOtra] = useState("");
    const [numeroPoliza, setNumeroPoliza] = useState("");
    const [tipoSeguro, setTipoSeguro] = useState("");
    const [nombreAsegurado, setNombreAsegurado] = useState("");
    const [vigenciaPoliza, setVigenciaPoliza] = useState("");
    const [telefonoAseguradora, setTelefonoAseguradora] = useState("");

    const [polizaFile, setPolizaFile] = useState<File | null>(null);
    const [currentPolizaUrl, setCurrentPolizaUrl] = useState<string | null>(null);

    const [organDonor, setOrganDonor] = useState(false);
    const [isMotorcyclist, setIsMotorcyclist] = useState(false);
    const [additionalNotes, setAdditionalNotes] = useState("");
    const [googleMapsLink, setGoogleMapsLink] = useState("");

    // Contacts
    const [contact1Name, setContact1Name] = useState("");
    const [contact1Phone, setContact1Phone] = useState("");
    const [contact2Name, setContact2Name] = useState("");
    const [contact2Phone, setContact2Phone] = useState("");
    const [contact3Name, setContact3Name] = useState("");
    const [contact3Phone, setContact3Phone] = useState("");

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.replace("/login");
                return;
            }

            try {
                // Fetch profile associated with this user_id
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*, chips(folio)')
                    .eq('user_id', session.user.id)
                    .single();

                if (profileError || !profile) {
                    throw new Error("No se encontró un perfil médico asociado a esta cuenta.");
                }

                // Populate state
                setProfileId(profile.id);
                setFolio(profile.chips?.folio || "");
                setCurrentPhotoUrl(profile.photo_url || null);

                setFullName(profile.full_name || "");
                setAge(profile.age ? profile.age.toString() : "");
                setLocation(profile.location || "");
                setBloodType(profile.blood_type || "");
                setAllergies(profile.allergies || "");
                setMedicalConditions(profile.medical_conditions || "");
                setImportantMedications(profile.important_medications || "");
                setInsuranceProvider(profile.insurance_provider || "");
                setPolicyNumber(profile.policy_number || "");
                setMedicalSystem(profile.medical_system || "");

                const knownAseguradoras = ['AXA', 'GNP', 'Monterrey New York Life (Seguros Monterrey)', 'Allianz', 'MetLife', 'Zurich', 'BUPA', 'Mapfre', 'Seguros Atlas'];
                if (profile.aseguradora && !knownAseguradoras.includes(profile.aseguradora)) {
                    setAseguradora("Otro");
                    setAseguradoraOtra(profile.aseguradora);
                } else {
                    setAseguradora(profile.aseguradora || "");
                }
                setNumeroPoliza(profile.numero_poliza || "");
                setTipoSeguro(profile.tipo_seguro || "");
                setNombreAsegurado(profile.nombre_asegurado || "");
                setVigenciaPoliza(profile.vigencia_poliza || "");
                setTelefonoAseguradora(profile.telefono_aseguradora || "");
                setCurrentPolizaUrl(profile.poliza_url || null);

                setOrganDonor(profile.organ_donor || false);
                setIsMotorcyclist(profile.is_motorcyclist || false);
                setAdditionalNotes(profile.additional_notes || "");
                setGoogleMapsLink(profile.google_maps_link || "");

                if (profile.emergency_contacts && Array.isArray(profile.emergency_contacts)) {
                    const c1 = profile.emergency_contacts[0];
                    if (c1) { setContact1Name(c1.name || ""); setContact1Phone(c1.phone || ""); }

                    const c2 = profile.emergency_contacts[1];
                    if (c2) { setContact2Name(c2.name || ""); setContact2Phone(c2.phone || ""); }

                    const c3 = profile.emergency_contacts[2];
                    if (c3) { setContact3Name(c3.name || ""); setContact3Phone(c3.phone || ""); }
                }

            } catch (err: any) {
                setErrorMsg(err.message);
            } finally {
                setLoadingAuth(false);
            }
        };

        fetchUserData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            const emergencyContacts = [];
            if (contact1Name && contact1Phone) emergencyContacts.push({ name: contact1Name, phone: contact1Phone });
            if (contact2Name && contact2Phone) emergencyContacts.push({ name: contact2Name, phone: contact2Phone });
            if (contact3Name && contact3Phone) emergencyContacts.push({ name: contact3Name, phone: contact3Phone });

            if (emergencyContacts.length === 0) {
                throw new Error("Debes proporcionar al menos un contacto de emergencia.");
            }

            let newPhotoUrl = currentPhotoUrl;
            if (photoFile) {
                const fileExt = photoFile.name.split('.').pop();
                const fileName = `${folio}-${Math.random()}.${fileExt}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('profile-photos')
                    .upload(fileName, photoFile);

                if (uploadError) {
                    throw new Error("No se pudo subir la nueva foto de perfil. Inténtalo de nuevo.");
                }

                const { data: publicUrlData } = supabase.storage
                    .from('profile-photos')
                    .getPublicUrl(fileName);

                newPhotoUrl = publicUrlData.publicUrl;
            }

            let newPolizaUrl = currentPolizaUrl;
            if (polizaFile) {
                const sessionResponse = await supabase.auth.getSession();
                const userId = sessionResponse.data.session?.user.id;
                const fileExt = polizaFile.name.split('.').pop();
                const fileName = `poliza.${fileExt}`;
                const fullPath = `${userId}/${fileName}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('polizas')
                    .upload(fullPath, polizaFile, { upsert: true });

                if (uploadError) {
                    throw new Error("No se pudo subir el archivo de la póliza. Inténtalo de nuevo.");
                }

                newPolizaUrl = fullPath;
            }

            const finalAseguradora = aseguradora === "Otro" ? aseguradoraOtra : (aseguradora || null);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    photo_url: newPhotoUrl,
                    age: age ? parseInt(age, 10) : null,
                    location: location,
                    emergency_contacts: emergencyContacts,
                    blood_type: bloodType,
                    allergies: allergies,
                    medical_conditions: medicalConditions,
                    important_medications: importantMedications,
                    insurance_provider: insuranceProvider,
                    policy_number: policyNumber,
                    medical_system: medicalSystem,
                    organ_donor: organDonor,
                    is_motorcyclist: isMotorcyclist,
                    additional_notes: additionalNotes,
                    google_maps_link: googleMapsLink,
                    aseguradora: finalAseguradora,
                    numero_poliza: numeroPoliza || null,
                    tipo_seguro: tipoSeguro || null,
                    nombre_asegurado: nombreAsegurado || null,
                    vigencia_poliza: vigenciaPoliza || null,
                    telefono_aseguradora: telefonoAseguradora || null,
                    poliza_url: newPolizaUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', profileId);

            if (updateError) {
                throw new Error("No se pudieron guardar los cambios: " + updateError.message);
            }

            setSuccessMsg("¡Perfil actualizado con éxito!");
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (err: any) {
            setErrorMsg(err.message || "Ocurrió un error inesperado al guardar.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteInsuranceInfo = async () => {
        if (!confirm("¿Estás seguro de que deseas eliminar toda la información y documento de tu seguro?")) return;
        setSaving(true);
        try {
            if (currentPolizaUrl) {
                await supabase.storage.from('polizas').remove([currentPolizaUrl]);
            }
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    aseguradora: null,
                    numero_poliza: null,
                    tipo_seguro: null,
                    nombre_asegurado: null,
                    vigencia_poliza: null,
                    telefono_aseguradora: null,
                    poliza_url: null,
                })
                .eq('id', profileId);

            if (updateError) throw updateError;

            setAseguradora("");
            setAseguradoraOtra("");
            setNumeroPoliza("");
            setTipoSeguro("");
            setNombreAsegurado("");
            setVigenciaPoliza("");
            setTelefonoAseguradora("");
            setPolizaFile(null);
            setCurrentPolizaUrl(null);

            setSuccessMsg("Información de seguro eliminada.");
        } catch (err: any) {
            setErrorMsg(err.message || "Error al eliminar información.");
        } finally {
            setSaving(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    if (loadingAuth) {
        return (
            <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
                <Loader2 size={48} className="animate-spin text-primary/30 mb-4" />
                <p className="font-medium animate-pulse text-muted-foreground">Cargando tu panel de control...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-0 md:p-4">
            <div className="w-full max-w-3xl bg-card md:rounded-[2.5rem] shadow-2xl border-x md:border border-border/50 overflow-hidden">
                {/* Header */}
                <div className="bg-destructive px-8 pt-10 pb-12 text-destructive-foreground relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

                    <div className="flex justify-between items-center mb-8 relative z-10 w-full">
                        <Link href="/" className="inline-flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full text-white/90 hover:bg-white/30 hover:text-white transition-colors font-medium text-xs uppercase tracking-wider">
                            <ArrowLeft size={16} /> Volver
                        </Link>
                        <button onClick={handleSignOut} className="inline-flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full text-white/90 hover:bg-white/30 hover:text-white transition-colors font-medium text-xs uppercase tracking-wider">
                            Cerrar Sesión <LogOut size={16} />
                        </button>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3 relative z-10 flex items-center gap-3">
                        <LayoutDashboard size={40} className="hidden sm:block" />
                        Mi Panel de Control
                    </h1>
                    <p className="text-white/90 relative z-10 text-lg md:text-xl font-medium max-w-lg">
                        Actualiza tu información médica en cualquier momento.
                    </p>
                </div>

                <div className="p-8 md:p-12 -mt-6 rounded-t-[2.5rem] relative z-20 bg-card">

                    {errorMsg && (
                        <div className="mb-8 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm font-semibold flex items-center gap-2">
                            <AlertCircle size={18} /> {errorMsg}
                        </div>
                    )}

                    {successMsg && (
                        <div className="mb-8 p-4 bg-green-500/10 text-green-700 border border-green-500/20 rounded-xl text-sm font-semibold flex items-center gap-2">
                            <CheckCircle2 size={18} /> {successMsg}
                        </div>
                    )}

                    {!profileId ? (
                        <div className="text-center py-10">
                            <p className="text-muted-foreground text-lg">No tienes un perfil médico vinculado todavía.</p>
                            <Link href="/activate" className="inline-block mt-4 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold">Activar un Chip</Link>
                        </div>
                    ) : (
                        <form className="space-y-10" onSubmit={handleUpdate}>

                            {/* ENLACE PUBLICO */}
                            <section className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div>
                                    <h3 className="font-bold text-primary mb-1 flex items-center gap-2">
                                        <CheckCircle2 size={18} /> Chip Vinculado: {folio.toUpperCase()}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">Este es el enlace al que accederán los paramédicos al escanear tu chip.</p>
                                </div>
                                <Link
                                    href={`/profile/${folio}`}
                                    target="_blank"
                                    className="shrink-0 flex items-center gap-2 bg-background border border-border shadow-sm px-4 py-2 rounded-xl text-sm font-bold text-foreground hover:bg-muted transition-colors"
                                >
                                    Ver Perfil Público <ExternalLink size={16} />
                                </Link>
                            </section>

                            {/* IDENTIFICACIÓN */}
                            <section className="space-y-4">
                                <h3 className="text-xl font-bold flex items-center gap-2 border-b border-border pb-2">
                                    <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                                    Identificación
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-4 md:col-span-2 mt-2 mb-4">
                                        <label className="text-sm font-semibold">Foto de Perfil</label>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                            {photoFile ? (
                                                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary bg-muted shrink-0 shadow-md">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={URL.createObjectURL(photoFile)} alt="Preview" className="w-full h-full object-cover" />
                                                </div>
                                            ) : currentPhotoUrl ? (
                                                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-border/50 bg-muted shrink-0 shadow-sm relative group">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={currentPhotoUrl} alt="Foto actual" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="text-[10px] text-white font-bold">Actual</span>
                                                    </div>
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
                                                <p className="text-xs text-muted-foreground mt-2 leading-relaxed font-medium">Sube una nueva foto si deseas cambiar la actual.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label htmlFor="fullName" className="text-sm font-semibold">Nombre Completo *</label>
                                        <input type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" required />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="age" className="text-sm font-semibold">Edad</label>
                                        <input type="number" id="age" value={age} onChange={(e) => setAge(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" min="0" max="130" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="location" className="text-sm font-semibold">Ciudad / País *</label>
                                        <input type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" required />
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
                                            <label className="text-sm font-semibold text-muted-foreground">Nombre</label>
                                            <input type="text" value={contact1Name} onChange={(e) => setContact1Name(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" required />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-muted-foreground">Teléfono</label>
                                            <input type="tel" value={contact1Phone} onChange={(e) => setContact1Phone(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" required />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 border border-border rounded-xl space-y-4 bg-muted/10">
                                    <h4 className="text-sm font-bold opacity-70">Contacto 2 (Opcional)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-muted-foreground">Nombre</label>
                                            <input type="text" value={contact2Name} onChange={(e) => setContact2Name(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-muted-foreground">Teléfono</label>
                                            <input type="tel" value={contact2Phone} onChange={(e) => setContact2Phone(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 border border-border rounded-xl space-y-4 bg-muted/10">
                                    <h4 className="text-sm font-bold opacity-70">Contacto 3 (Opcional)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-muted-foreground">Nombre</label>
                                            <input type="text" value={contact3Name} onChange={(e) => setContact3Name(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-muted-foreground">Teléfono</label>
                                            <input type="tel" value={contact3Phone} onChange={(e) => setContact3Phone(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
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
                                        <select id="bloodType" value={bloodType} onChange={(e) => setBloodType(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" required>
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
                                        <label htmlFor="allergies" className="text-sm font-semibold">Alergias Conocidas</label>
                                        <input type="text" id="allergies" value={allergies} onChange={(e) => setAllergies(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label htmlFor="medicalConditions" className="text-sm font-semibold">Condiciones Médicas</label>
                                        <textarea id="medicalConditions" value={medicalConditions} onChange={(e) => setMedicalConditions(e.target.value)} className="w-full flex min-h-[100px] rounded-xl border border-input bg-background px-4 py-3 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label htmlFor="importantMedications" className="text-sm font-semibold">Medicamentos Importantes</label>
                                        <textarea id="importantMedications" value={importantMedications} onChange={(e) => setImportantMedications(e.target.value)} className="w-full flex min-h-[100px] rounded-xl border border-input bg-background px-4 py-3 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                    </div>
                                </div>
                            </section>

                            {/* SEGURO MÉDICO */}
                            <section className="space-y-4">
                                <h3 className="text-xl font-bold flex items-center gap-2 border-b border-border pb-2">
                                    <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
                                    Seguro Médico
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2 md:col-span-2">
                                        <label htmlFor="medicalSystem" className="text-sm font-semibold">Sistema Médico u Organización</label>
                                        <select id="medicalSystem" value={medicalSystem} onChange={(e) => setMedicalSystem(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all">
                                            <option value="">Ninguno específico</option>
                                            <option value="IMSS">IMSS</option>
                                            <option value="ISSSTE">ISSSTE</option>
                                            <option value="Seguro Popular / Insabi">Seguro Popular / INSABI</option>
                                            <option value="Seguro Médico Privado">Seguro Médico Privado</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="insuranceProvider" className="text-sm font-semibold">Aseguradora</label>
                                        <input type="text" id="insuranceProvider" value={insuranceProvider} onChange={(e) => setInsuranceProvider(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="policyNumber" className="text-sm font-semibold">Número de Póliza</label>
                                        <input type="text" id="policyNumber" value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                    </div>
                                    <div className="space-y-2 flex items-center gap-3 pt-6 rounded-xl border border-border p-4 bg-muted/20 md:col-span-2">
                                        <input type="checkbox" id="organDonor" checked={organDonor} onChange={(e) => setOrganDonor(e.target.checked)} className="w-5 h-5 rounded border-input accent-primary text-primary" />
                                        <label htmlFor="organDonor" className="text-sm font-semibold cursor-pointer">Soy donante oficial de órganos</label>
                                    </div>
                                </div>
                            </section>

                            {/* MI PÓLIZA DE SEGURO */}
                            <section className="space-y-4">
                                <h3 className="text-xl font-bold flex items-center justify-between border-b border-border pb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">5</span>
                                        Mi Póliza de Seguro
                                    </div>
                                    {(aseguradora || currentPolizaUrl) && (
                                        <button type="button" onClick={handleDeleteInsuranceInfo} className="text-destructive text-sm font-bold flex items-center gap-1 hover:underline">
                                            Eliminar información
                                        </button>
                                    )}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-5 rounded-2xl border border-border">
                                    <div className="space-y-2 lg:col-span-2">
                                        <label htmlFor="aseguradora" className="text-sm font-semibold">Aseguradora</label>
                                        <select id="aseguradora" value={aseguradora} onChange={(e) => setAseguradora(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all">
                                            <option value="">Selecciona una aseguradora</option>
                                            <option value="AXA">AXA</option>
                                            <option value="GNP">GNP</option>
                                            <option value="Monterrey New York Life (Seguros Monterrey)">Monterrey New York Life (Seguros Monterrey)</option>
                                            <option value="Allianz">Allianz</option>
                                            <option value="MetLife">MetLife</option>
                                            <option value="Zurich">Zurich</option>
                                            <option value="BUPA">BUPA</option>
                                            <option value="Mapfre">Mapfre</option>
                                            <option value="Seguros Atlas">Seguros Atlas</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>
                                    {aseguradora === "Otro" && (
                                        <div className="space-y-2 animate-in fade-in duration-300 md:col-span-2">
                                            <label htmlFor="aseguradoraOtra" className="text-sm font-semibold text-primary">Especificar Aseguradora *</label>
                                            <input type="text" id="aseguradoraOtra" value={aseguradoraOtra} onChange={(e) => setAseguradoraOtra(e.target.value)} required className="w-full flex h-12 rounded-xl border border-primary/50 bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <label htmlFor="numeroPoliza" className="text-sm font-semibold">Número de Póliza {aseguradora && "*"}</label>
                                        <input type="text" id="numeroPoliza" value={numeroPoliza} onChange={(e) => setNumeroPoliza(e.target.value)} required={!!aseguradora} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="tipoSeguro" className="text-sm font-semibold">Tipo de Seguro</label>
                                        <select id="tipoSeguro" value={tipoSeguro} onChange={(e) => setTipoSeguro(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all">
                                            <option value="">Selecciona un tipo</option>
                                            <option value="Gastos Médicos Mayores">Gastos Médicos Mayores</option>
                                            <option value="Seguro de Auto">Seguro de Auto</option>
                                            <option value="Seguro de Moto">Seguro de Moto</option>
                                            <option value="Seguro de Vida">Seguro de Vida</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="nombreAsegurado" className="text-sm font-semibold">Nombre Asegurado Titular {aseguradora && "*"}</label>
                                        <input type="text" id="nombreAsegurado" value={nombreAsegurado} onChange={(e) => setNombreAsegurado(e.target.value)} required={!!aseguradora} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="vigenciaPoliza" className="text-sm font-semibold">Vigencia (Opcional)</label>
                                        <input type="date" id="vigenciaPoliza" value={vigenciaPoliza} onChange={(e) => setVigenciaPoliza(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all text-foreground" style={{ colorScheme: 'dark' }} />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label htmlFor="telefonoAseguradora" className="text-sm font-semibold">Teléfono de Emergencias (Opcional)</label>
                                        <input type="tel" id="telefonoAseguradora" value={telefonoAseguradora} onChange={(e) => setTelefonoAseguradora(e.target.value)} placeholder="Ej: 800-123-4567" className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                    </div>

                                    {/* Subida de Póliza */}
                                    <div className="space-y-4 md:col-span-2 mt-4 pt-4 border-t border-border/50">
                                        <div>
                                            <label className="text-sm font-semibold">Documento (PDF, JPG, PNG)</label>
                                            <p className="text-xs text-muted-foreground mt-1">Sube el extracto de tu póliza (máx 5MB). Se mostrará a paramédicos.</p>
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                            {polizaFile ? (
                                                <div className="px-4 py-3 bg-primary/10 border border-primary/20 rounded-xl text-primary font-bold text-sm flex items-center gap-2">
                                                    📄 {polizaFile.name}
                                                </div>
                                            ) : currentPolizaUrl ? (
                                                <div className="px-4 py-3 bg-background border border-border rounded-xl text-foreground font-bold text-sm flex items-center gap-2 relative group overflow-hidden">
                                                    📄 Póliza Actual
                                                </div>
                                            ) : null}

                                            <div className="flex-1 w-full relative">
                                                <input
                                                    type="file"
                                                    accept=".pdf,image/png,image/jpeg,image/jpg"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            if (file.size > 5 * 1024 * 1024) {
                                                                alert("El archivo no debe pesar más de 5MB");
                                                                e.target.value = '';
                                                                return;
                                                            }
                                                            setPolizaFile(file);
                                                        }
                                                    }}
                                                    className="w-full flex h-14 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer shadow-sm relative z-10"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* NOTAS Y UBICACIÓN */}
                            <section className="space-y-4">
                                <h3 className="text-xl font-bold flex items-center gap-2 border-b border-border pb-2">
                                    <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">6</span>
                                    Notas y Ubicación

                                </h3>

                                <div className="space-y-2 flex items-center gap-3 pt-2 rounded-xl border border-primary/30 p-5 bg-primary/5 mb-6">
                                    <input type="checkbox" id="isMotorcyclist" checked={isMotorcyclist} onChange={(e) => setIsMotorcyclist(e.target.checked)} className="w-5 h-5 rounded border-input accent-primary text-primary" />
                                    <label htmlFor="isMotorcyclist" className="text-sm font-bold cursor-pointer text-primary">Mostrar Alerta de "No Retirar Casco" (Motociclistas)</label>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2 md:col-span-2">
                                        <label htmlFor="additionalNotes" className="text-sm font-semibold">Notas Adicionales</label>
                                        <textarea id="additionalNotes" value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} className="w-full flex min-h-[100px] rounded-xl border border-input bg-background px-4 py-3 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label htmlFor="googleMapsLink" className="text-sm font-semibold">Enlace de Ubicación (Google Maps)</label>
                                        <input type="url" id="googleMapsLink" value={googleMapsLink} onChange={(e) => setGoogleMapsLink(e.target.value)} className="w-full flex h-12 rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                                    </div>
                                </div>
                            </section>

                            <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground h-16 rounded-2xl text-xl font-black hover:scale-[1.02] hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 mt-8 disabled:opacity-70 disabled:pointer-events-none disabled:transform-none">
                                {saving ? <Loader2 size={24} className="animate-spin" /> : <CheckCircle2 size={24} />}
                                {saving ? "Guardando Cambios..." : "Guardar Cambios"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
