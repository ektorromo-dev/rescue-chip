import Link from "next/link";
import { CheckCircle2, Home, ArrowRight } from "lucide-react";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ factura?: string }> }) {
    const params = await searchParams;
    const isFactura = params.factura === 'true';

    return (
        <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-card rounded-[2.5rem] shadow-2xl border border-border/50 overflow-hidden text-center p-10 relative">

                <div className="mx-auto w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6 animate-[bounce_1s_ease-in-out]">
                    <CheckCircle2 size={40} className="stroke-[2.5]" />
                </div>

                <h1 className="text-3xl font-black mb-4">¡Gracias por tu compra!</h1>

                <p className="text-muted-foreground leading-relaxed mb-8">
                    Tu pedido está siendo preparado. Recibirás tu chip NFC en 3-7 días hábiles. Una vez que lo recibas, actívalo en nuestra plataforma para estar protegido en todo momento.
                </p>

                {isFactura && (
                    <div className="bg-primary/10 border border-primary/20 text-primary-foreground text-sm font-semibold p-4 rounded-xl mb-8 flex flex-col gap-2">
                        <p className="text-foreground">Solicitaste factura.</p>
                        <p className="text-muted-foreground font-medium">Recibirás tu CFDI y XML en el correo y WhatsApp que proporcionaste en un máximo de 72 horas hábiles.</p>
                    </div>
                )}

                <div className="flex flex-col gap-4">
                    <Link href="/activate" className="flex items-center justify-center gap-2 bg-primary text-primary-foreground h-14 rounded-xl text-lg font-bold hover:scale-[1.02] hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                        Activar mi chip <ArrowRight size={20} />
                    </Link>
                    <Link href="/" className="flex items-center justify-center gap-2 bg-muted text-foreground h-14 rounded-xl font-bold hover:bg-muted/80 transition-all hover:scale-[1.02]">
                        <Home size={20} /> Volver al Inicio
                    </Link>
                </div>

            </div>
        </div>
    );
}
