import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-muted py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-card rounded-3xl shadow-lg border border-border/50 overflow-hidden">
                <div className="bg-primary/5 p-8 border-b border-border/50 flex flex-col items-center text-center">
                    <ShieldCheck size={48} className="text-primary mb-4" />
                    <h1 className="text-3xl font-black tracking-tight mb-2">Aviso de Privacidad</h1>
                    <p className="text-muted-foreground">Última actualización: {new Date().toLocaleDateString('es-MX')}</p>
                </div>
                <div className="p-8 prose prose-slate dark:prose-invert max-w-none text-muted-foreground">
                    <p className="lead font-medium text-foreground">
                        En RescueChip, nos tomamos muy en serio la privacidad y protección de sus datos médicos y personales, cumpliendo con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) en México.
                    </p>

                    <h3 className="text-xl font-bold text-foreground mt-8 mb-4">1. Datos que recopilamos</h3>
                    <p>
                        Recopilamos la información que usted proporciona voluntariamente al activar su dispositivo NFC, la cual incluye pero no se limita a: nombre completo, edad, tipo de sangre, alergias, condiciones médicas, medicamentos, información de seguro médico, estatus de donador de órganos, contactos de emergencia y fotografía.
                    </p>

                    <h3 className="text-xl font-bold text-foreground mt-8 mb-4">2. Finalidad del tratamiento de datos</h3>
                    <p>
                        Los datos personales sensibles (médicos) recopilados tienen como única finalidad:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-2">
                        <li>Crear su perfil de emergencia vinculado a su dispositivo físico (RescueChip).</li>
                        <li>Proporcionar información vital a paramédicos, primeros respondientes y personal de salud exclusivamente en caso de accidente o emergencia médica.</li>
                        <li>Contactar a sus familiares o designados en caso de emergencia.</li>
                    </ul>

                    <h3 className="text-xl font-bold text-foreground mt-8 mb-4">3. Acceso limitado a su información</h3>
                    <p>
                        Su información solo es accesible de forma pública a través del escaneo físico del chip NFC mediante un dispositivo móvil, o ingresando la URL pública exacta asociada a su número de folio. El usuario asume que, debido a la naturaleza vital del servicio, el perfil médico está intencionalmente diseñado para ser accesible en el lugar del accidente por cualquier primer respondiente que atienda la emergencia y escanee el casco.
                    </p>

                    <h3 className="text-xl font-bold text-foreground mt-8 mb-4">4. Transferencia de datos</h3>
                    <p>
                        RescueChip no venderá, alquilará ni compartirá su información con terceros para fines de marketing, publicidad o análisis de datos. Sus datos están alojados en servidores seguros y solo se comparten en la circunstancia de una emergencia médica a través del escaneo de su chip.
                    </p>

                    <h3 className="text-xl font-bold text-foreground mt-8 mb-4">5. Derechos ARCO</h3>
                    <p>
                        Usted tiene en todo momento el derecho de Acceder, Rectificar, Cancelar u Oponerse (Derechos ARCO) al tratamiento de su información. Si desea eliminar permanentemente su perfil médico o actualizar sus datos, puede solicitarlo enviando un correo electrónico a <strong>contacto@rescue-chip.com</strong> incluyendo su número de folio.
                    </p>

                    <h3 className="text-xl font-bold text-foreground mt-8 mb-4">6. Consentimiento explícito</h3>
                    <p>
                        Al activar el servicio de RescueChip y completar el formulario de registro, usted otorga su consentimiento expreso para el tratamiento de sus datos personales sensibles según lo estipulado en este aviso de privacidad.
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
