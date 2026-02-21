import Link from "next/link";
import { ArrowLeft, Mail, MessageSquare } from "lucide-react";

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-muted py-12 px-4 flex flex-col items-center justify-center">
            <div className="max-w-xl w-full text-center mb-8">
                <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mb-6">
                    <ArrowLeft size={16} /> Volver a la página principal
                </Link>
                <h1 className="text-4xl font-black tracking-tight mb-4">Contáctanos</h1>
                <p className="text-lg text-muted-foreground">¿Tienes dudas sobre RescueChip, necesitas ayuda con tu dispositivo o quieres actualizar tu información? Estamos aquí para ayudarte.</p>
            </div>

            <div className="max-w-xl w-full bg-card rounded-3xl shadow-xl border border-border/50 p-8 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                    <MessageSquare size={36} />
                </div>

                <h2 className="text-2xl font-bold mb-4">Soporte y Atención al Cliente</h2>
                <p className="text-muted-foreground mb-8 text-balance">
                    Nuestro equipo responderá a tus dudas lo más rápido posible. Por favor envíanos un correo directamente a nuestra bandeja principal de atención.
                </p>

                <a
                    href="mailto:contacto@rescue-chip.com"
                    className="flex items-center justify-center gap-3 bg-primary text-primary-foreground w-full py-5 rounded-2xl text-xl font-bold hover:scale-[1.02] hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                    <Mail size={24} />
                    contacto@rescue-chip.com
                </a>

                <div className="mt-8 pt-8 border-t border-border/50 w-full text-sm text-muted-foreground">
                    <p>
                        Si ya cuentas con un chip y deseas actualizar tus datos, asegúrate de incluir tu <strong>Número de Folio</strong> (ej. RSC-0001) en el cuerpo del correo.
                    </p>
                </div>
            </div>
        </div>
    );
}
