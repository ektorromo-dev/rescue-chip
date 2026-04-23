import Link from "next/link";
import { CheckCircle2, Home, ArrowRight, FileText } from "lucide-react";
import MetaPixelPurchase from "@/components/MetaPixelPurchase";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ factura?: string }> }) {
    const params = await searchParams;
    const isFactura = params.factura === 'true';

    return (
        <>
            <MetaPixelPurchase />
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#0A0A08',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        }}>
            <div style={{
                width: '100%',
                maxWidth: '480px',
                backgroundColor: '#131311',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.08)',
                overflow: 'hidden',
                textAlign: 'center',
                padding: '48px 32px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            }}>
                {/* Ícono de éxito */}
                <div style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(34,197,94,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                }}>
                    <CheckCircle2 size={36} color="#22c55e" strokeWidth={2.5} />
                </div>

                <h1 style={{
                    fontSize: '26px',
                    fontWeight: 900,
                    color: '#F4F0EB',
                    marginBottom: '12px',
                    lineHeight: 1.2,
                }}>
                    ¡Gracias por tu compra!
                </h1>

                <p style={{
                    fontSize: '14px',
                    color: '#9E9A95',
                    lineHeight: 1.7,
                    marginBottom: '28px',
                    maxWidth: '360px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                }}>
                    Tu pedido está siendo preparado. Recibirás tu kit RescueChip en 3-7 días hábiles.
                    Una vez que lo recibas, actívalo para estar protegido en todo momento.
                </p>

                {isFactura && (
                    <div style={{
                        backgroundColor: 'rgba(232,35,26,0.08)',
                        border: '1px solid rgba(232,35,26,0.2)',
                        borderRadius: '14px',
                        padding: '16px 20px',
                        marginBottom: '28px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        textAlign: 'left',
                    }}>
                        <FileText size={20} color="#E8231A" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <p style={{ fontSize: '13px', fontWeight: 700, color: '#F4F0EB', marginBottom: '4px' }}>
                                Solicitaste factura
                            </p>
                            <p style={{ fontSize: '12px', color: '#9E9A95', lineHeight: 1.5 }}>
                                Recibirás tu CFDI y XML en el correo y WhatsApp que proporcionaste en un máximo de 72 horas hábiles.
                            </p>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Link href="/activate" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        backgroundColor: '#E8231A',
                        color: '#F4F0EB',
                        height: '52px',
                        borderRadius: '14px',
                        fontSize: '15px',
                        fontWeight: 800,
                        textDecoration: 'none',
                        border: 'none',
                    }}>
                        Activar mi chip <ArrowRight size={18} />
                    </Link>

                    <Link href="/" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        backgroundColor: '#1A1A18',
                        color: '#9E9A95',
                        height: '52px',
                        borderRadius: '14px',
                        fontSize: '14px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        border: '1px solid rgba(255,255,255,0.08)',
                    }}>
                        <Home size={18} /> Volver al inicio
                    </Link>
                </div>
            </div>

            {/* Footer discreto */}
            <p style={{
                fontSize: '10px',
                color: 'rgba(158,154,149,0.3)',
                marginTop: '24px',
                fontFamily: 'monospace',
            }}>
                rescue-chip.com
            </p>
        </div>
        </>
    );
}
