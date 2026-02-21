import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-muted py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-card rounded-3xl shadow-lg border border-border/50 overflow-hidden">
                <div className="bg-primary/5 p-8 border-b border-border/50 flex flex-col items-center text-center">
                    <Scale size={48} className="text-primary mb-4" />
                    <h1 className="text-3xl font-black tracking-tight mb-2">Términos de Servicio</h1>
                    <p className="text-muted-foreground">Última actualización: {new Date().toLocaleDateString('es-MX')}</p>
                </div>
                <div className="p-8 prose prose-slate dark:prose-invert max-w-none text-muted-foreground">
                    <p className="lead font-medium text-foreground">
                        Al utilizar los servicios y productos de RescueChip, usted acepta sujetarse a los siguientes Términos y Condiciones. Por favor, léalos cuidadosamente.
                    </p>

                    <h3 className="text-xl font-bold text-foreground mt-8 mb-4">1. Naturaleza del Servicio</h3>
                    <p>
                        RescueChip provee una etiqueta NFC que redirige a un perfil web con información médica de emergencia. <strong>Nuestro servicio no sustituye de ninguna forma la atención, consejo, diagnóstico o tratamiento de un profesional médico certificado.</strong>
                    </p>

                    <h3 className="text-xl font-bold text-foreground mt-8 mb-4">2. Responsabilidad de la Información (Exención de Responsabilidad)</h3>
                    <p>
                        Es entera y exclusiva responsabilidad del usuario proporcionar información veraz, precisa y actualizada en su perfil médico. RescueChip no valida, audita ni verifica médicamente los datos proporcionados (tipo de sangre, alergias, medicamentos, etc.). RescueChip y sus representantes se deslindan de cualquier responsabilidad por negligencia, tratamientos erróneos, complicaciones o fallecimiento derivados de información médica incorrecta, incompleta o desactualizada suministrada por el usuario, o de la falta de lectura del chip por parte del personal de emergencia.
                    </p>

                    <h3 className="text-xl font-bold text-foreground mt-8 mb-4">3. Funcionamiento de la Tecnología</h3>
                    <p>
                        Aunque el chip NFC es pasivo y no requiere batería, el escaneo exitoso del mismo requiere de un dispositivo móvil (smartphone) compatible, configurado correctamente (NFC encendido) y con acceso a internet. RescueChip no garantiza que todos los paramédicos o primeros respondientes en el lugar del accidente posean la tecnología o la capacitación para escanear el dispositivo.
                    </p>

                    <h3 className="text-xl font-bold text-foreground mt-8 mb-4">4. Disponibilidad del Sistema</h3>
                    <p>
                        RescueChip se esfuerza por mantener una disponibilidad del servidor del 99.9%, sin embargo, no nos hacemos responsables de interrupciones temporales causadas por fallas en la red, mantenimiento de servidores o causas de fuerza mayor.
                    </p>

                    <h3 className="text-xl font-bold text-foreground mt-8 mb-4">5. Conservación Física del Chip</h3>
                    <p>
                        El usuario es responsable de colocar correctamente el adhesivo NFC en el exterior de su casco, así como de su conservación. Daños físicos extremos, cortes, exposición a sustancias químicas corrosivas o impactos severos pueden inutilizar el chip. Si el chip sufre daños, debe ser reemplazado adquiriendo una nueva unidad.
                    </p>

                    <h3 className="text-xl font-bold text-foreground mt-8 mb-4">6. Modificaciones a los Términos</h3>
                    <p>
                        Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones entrarán en vigor inmediatamente después de su publicación en esta plataforma.
                    </p>
                </div>
                <div className="bg-muted/50 p-6 border-t border-border/50 text-center">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors">
                        <ArrowLeft size={16} /> Volver a la página principal
                    </Link>
                </div>
            </div>
        </div>
    );
}
