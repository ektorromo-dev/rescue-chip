import { HeartPulse, Droplets, AlertTriangle, PhoneCall, CheckCircle2, FileText, UserSquare2, ArrowLeft, ShieldAlert, Navigation, Info } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

interface ProfileProps {
    params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: ProfileProps) {
    const { id: rawId } = await params;
    const id = decodeURIComponent(rawId);

    const supabase = await createClient();

    const cleanId = id.trim();
    console.log("Perfil - Buscando chip con folio:", cleanId);

    // 1. Fetch the chip by folio
    const { data: chip, error: chipError } = await supabase
        .from('chips')
        .select('*')
        .ilike('folio', cleanId)
        .single();

    console.log("Perfil - Respuesta de Supabase:", { chip, chipError });

    if (chipError || !chip) {
        if (!chip) return notFound(); // Chip not found in database
        console.error(chipError);
        return <div>Error al cargar información del dispositivo.</div>;
    }

    // If the chip exists but isn't activated yet
    if (!chip.activated) {
        return (
            <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
                <div className="bg-card p-10 rounded-3xl shadow-xl max-w-md text-center border border-border">
                    <HeartPulse size={48} className="mx-auto text-primary/50 mb-6" />
                    <h1 className="text-2xl font-bold mb-4">RescueChip Inactivo</h1>
                    <p className="text-muted-foreground mb-8">Este dispositivo ({chip.folio}) aún no ha sido registrado.</p>
                    <Link href={`/activate?folio=${encodeURIComponent(chip.folio)}`} className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors">
                        Activar Ahora
                    </Link>
                </div>
            </div>
        );
    }

    // 2. Fetch the profile for this chip
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('chip_id', chip.id)
        .single();

    if (profileError || !profile) {
        console.error(profileError);
        return <div>Error al cargar el perfil médico.</div>;
    }

    // Safe extraction of multiple contacts
    let emergencyContactsArray: any[] = [];
    if (profile.emergency_contacts) {
        try {
            if (Array.isArray(profile.emergency_contacts)) {
                emergencyContactsArray = profile.emergency_contacts;
            } else if (typeof profile.emergency_contacts === 'object') {
                emergencyContactsArray = [profile.emergency_contacts];
            }
        } catch (e) {
            console.error(e);
        }
    }

    const allergiesArray = profile.allergies ? profile.allergies.split(',').map((a: string) => a.trim()) : [];

    return (
        <div className="min-h-screen bg-muted flex justify-center pb-12 sm:pt-12 p-0 sm:p-4">
            <div className="w-full max-w-lg bg-card sm:rounded-[2.5rem] shadow-2xl border-x sm:border border-border/50 overflow-hidden flex flex-col items-center">

                {/* Motorcyclist Warning Banner (Topmost priority) */}
                {profile.is_motorcyclist && (
                    <div className="w-full bg-yellow-500 text-yellow-950 px-6 py-4 flex items-center justify-center gap-3 font-black text-center relative z-50">
                        <ShieldAlert className="animate-pulse" size={28} />
                        <span className="uppercase text-sm leading-tight">
                            PRECAUCIÓN MOTOCICLISTA: <br /> NO RETIRAR EL CASCO SIN PERSONAL CAPACITADO
                        </span>
                    </div>
                )}

                {/* Dynamic Header banner */}
                <div className="w-full bg-destructive px-8 pb-14 pt-8 text-destructive-foreground relative">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <Link href="/" className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                            <HeartPulse size={14} className="animate-pulse" /> Ficha de Rescate
                        </div>
                    </div>

                    <div className="relative z-10 text-center">
                        <div className="w-28 h-28 bg-card text-foreground mx-auto rounded-full flex items-center justify-center shadow-xl mb-4 border-4 border-card/80 overflow-hidden shrink-0">
                            {profile.photo_url ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={profile.photo_url} alt={profile.full_name} className="w-full h-full object-cover" />
                            ) : (
                                <UserSquare2 size={48} className="text-muted-foreground/50" />
                            )}
                        </div>
                        <h1 className="text-3xl font-black tracking-tight mb-2">{profile.full_name}</h1>
                        <p className="text-white/80 font-medium">
                            {profile.age ? `${profile.age} años • ` : ''} {profile.location}
                        </p>
                    </div>
                </div>

                {/* Content Body */}
                <div className="w-full px-6 md:px-10 -mt-6 relative z-20 pb-10 space-y-6">

                    {/* Critical Info Banner */}
                    <div className="bg-card w-full rounded-2xl p-6 shadow-lg border border-border flex justify-around items-center divide-x divide-border">
                        <div className="flex flex-col items-center px-4 w-1/2">
                            <Droplets size={28} className="text-primary mb-2" />
                            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Tipo de Sangre</span>
                            <span className="text-3xl font-black text-foreground">{profile.blood_type || "N/A"}</span>
                        </div>
                        <div className="flex flex-col items-center px-4 w-1/2">
                            <CheckCircle2 size={28} className={profile.organ_donor ? "text-green-500 mb-2" : "text-muted-foreground mb-2"} />
                            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1 flex items-center gap-1 text-center">
                                Donador de Órganos
                            </span>
                            <span className="text-xl font-bold text-foreground">{profile.organ_donor ? "SÍ" : "NO"}</span>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">

                        {/* MEDICAL DETIALS */}
                        {(allergiesArray.length > 0 || profile.medical_conditions || profile.important_medications) && (
                            <div className="bg-muted/50 rounded-2xl p-5 border border-border/80 outline outline-1 outline-transparent hover:outline-primary/20 transition-all">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border/50 pb-2">
                                    <FileText size={18} className="text-primary" /> Historial Médico
                                </h3>
                                <div className="space-y-4">

                                    {allergiesArray.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-bold text-destructive uppercase mb-2 flex items-center gap-1">
                                                <AlertTriangle size={14} /> Alergias
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {allergiesArray.map((allergy: string, i: number) => (
                                                    <span key={i} className="bg-destructive/10 text-destructive border border-destructive/20 px-3 py-1 rounded-full text-sm font-bold">
                                                        {allergy}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {profile.medical_conditions && (
                                        <div>
                                            <h4 className="text-xs font-bold text-muted-foreground uppercase mb-1">Condiciones Médicas</h4>
                                            <p className="text-sm font-medium leading-relaxed bg-background p-3 rounded-xl border border-border">{profile.medical_conditions}</p>
                                        </div>
                                    )}
                                    {profile.important_medications && (
                                        <div>
                                            <h4 className="text-xs font-bold text-muted-foreground uppercase mb-1">Medicamentos Importantes</h4>
                                            <p className="text-sm font-medium leading-relaxed bg-background p-3 rounded-xl border border-border">{profile.important_medications}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* INSURANCE DETAILS */}
                        {(profile.insurance_provider || profile.policy_number || profile.medical_system) && (
                            <div className="bg-muted/50 rounded-2xl p-5 border border-border/80">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                                    <Info size={18} className="text-primary" /> Seguro Médico
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {profile.medical_system && (
                                        <div className="col-span-2">
                                            <h4 className="text-xs font-bold text-muted-foreground uppercase">Sistema Institucional</h4>
                                            <p className="font-medium text-sm">{profile.medical_system}</p>
                                        </div>
                                    )}
                                    {profile.insurance_provider && (
                                        <div>
                                            <h4 className="text-xs font-bold text-muted-foreground uppercase">Aseguradora</h4>
                                            <p className="font-medium text-sm">{profile.insurance_provider}</p>
                                        </div>
                                    )}
                                    {profile.policy_number && (
                                        <div>
                                            <h4 className="text-xs font-bold text-muted-foreground uppercase">Póliza</h4>
                                            <p className="font-medium text-sm font-mono">{profile.policy_number}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* LOCATION & NOTES */}
                        {(profile.additional_notes || profile.google_maps_link) && (
                            <div className="bg-primary/5 rounded-2xl p-5 border border-primary/20">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wider mb-3">
                                    <ShieldAlert size={18} /> Notas e Instrucciones
                                </h3>
                                <div className="space-y-3">
                                    {profile.additional_notes && (
                                        <div>
                                            <p className="text-sm italic text-foreground opacity-90 leading-relaxed font-medium">"{profile.additional_notes}"</p>
                                        </div>
                                    )}
                                    {profile.google_maps_link && (
                                        <div>
                                            <a href={profile.google_maps_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline mt-2">
                                                <Navigation size={16} /> Abrir Mapa/Ubicación Guardada
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* EMERGENCY CONTACTS */}
                        {emergencyContactsArray.length > 0 && (
                            <div className="bg-destructive/10 rounded-2xl p-5 border border-destructive/20 relative overflow-hidden group">
                                <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-destructive/10 to-transparent pointer-events-none" />
                                <h3 className="flex items-center gap-2 text-sm font-bold text-destructive uppercase tracking-wider mb-4 border-b border-destructive/20 pb-2">
                                    <PhoneCall size={18} /> Contactos de Emergencia
                                </h3>

                                <div className="space-y-4 relative z-10">
                                    {emergencyContactsArray.map((contact, idx) => (
                                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/60 dark:bg-black/20 p-3 rounded-xl border border-destructive/10">
                                            <div>
                                                <p className="text-base font-bold text-foreground">{contact.name}</p>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase">Contacto {idx + 1}</p>
                                            </div>
                                            {contact.phone && (
                                                <a href={`tel:${contact.phone}`} className="flex items-center justify-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-xl text-sm font-bold hover:scale-105 transition-transform shadow-sm whitespace-nowrap">
                                                    Llamar {contact.phone}
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>

                </div>

                {/* Verification Footer Overlay */}
                <div className="w-full p-6 mt-auto text-center border-t border-border/50 bg-muted/30">
                    <p className="text-[10px] md:text-xs font-semibold text-muted-foreground">
                        Información proporcionada por el usuario.<br />
                        Este sistema no sustituye atención médica profesional.
                    </p>
                    <p className="text-[10px] text-muted-foreground opacity-40 mt-3 font-mono">
                        REF: {chip.folio} | V2
                    </p>
                </div>
            </div>
        </div>
    );
}
