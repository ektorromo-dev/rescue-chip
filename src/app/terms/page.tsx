import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";

export default function TermsOfService() {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0A0A08', padding: '48px 16px', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
            <div style={{ maxWidth: '720px', margin: '0 auto', backgroundColor: '#131311', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>

                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg, #1C0A09 0%, #2C1210 60%, #1A0808 100%)', padding: '48px 32px', textAlign: 'center', borderBottom: '1px solid rgba(232,35,26,0.2)' }}>
                    <Scale size={48} style={{ color: '#E8231A', margin: '0 auto 16px', display: 'block' }} />
                    <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#F4F0EB', margin: '0 0 8px', letterSpacing: '-0.02em' }}>Términos de Servicio</h1>
                    <p style={{ color: '#9E9A95', fontSize: '14px', margin: 0 }}>
                        Última actualización: 10 de marzo de 2026
                    </p>
                </div>

                {/* Body */}
                <div style={{ padding: '40px 32px', color: '#9E9A95', lineHeight: 1.7, fontSize: '15px' }}>
                    <p style={{ color: '#F4F0EB', fontWeight: 500, marginBottom: '32px', fontSize: '16px' }}>
                        Al utilizar los servicios y productos de RescueChip, usted acepta sujetarse a los siguientes Términos y Condiciones. Por favor, léalos cuidadosamente.
                    </p>

                    {[
                        {
                            title: '1. Naturaleza del Servicio',
                            content: 'RescueChip provee una etiqueta NFC que redirige a un perfil web con información médica de emergencia. Nuestro servicio no sustituye de ninguna forma la atención, consejo, diagnóstico o tratamiento de un profesional médico certificado.'
                        },
                        {
                            title: '2. Responsabilidad de la Información (Exención de Responsabilidad)',
                            content: 'Es entera y exclusiva responsabilidad del usuario proporcionar información veraz, precisa y actualizada en su perfil médico. RescueChip no valida, audita ni verifica médicamente los datos proporcionados (tipo de sangre, alergias, medicamentos, etc.). RescueChip y sus representantes se deslindan de cualquier responsabilidad por negligencia, tratamientos erróneos, complicaciones o fallecimiento derivados de información médica incorrecta, incompleta o desactualizada suministrada por el usuario, o de la falta de lectura del chip por parte del personal de emergencia.'
                        },
                        {
                            title: '3. Funcionamiento de la Tecnología',
                            content: 'Aunque el chip NFC es pasivo y no requiere batería, el escaneo exitoso del mismo requiere de un dispositivo móvil (smartphone) compatible, configurado correctamente (NFC encendido) y con acceso a internet. RescueChip no garantiza que todos los paramédicos o primeros respondientes en el lugar del accidente posean la tecnología o la capacitación para escanear el dispositivo.'
                        },
                        {
                            title: '4. Disponibilidad del Sistema',
                            content: 'RescueChip se esfuerza por mantener una disponibilidad del servidor del 99.9%, sin embargo, no nos hacemos responsables de interrupciones temporales causadas por fallas en la red, mantenimiento de servidores o causas de fuerza mayor.'
                        },
                        {
                            title: '5. Conservación Física del Chip',
                            content: 'El usuario es responsable de colocar correctamente el adhesivo NFC en el exterior de su casco, así como de su conservación. Daños físicos extremos, cortes, exposición a sustancias químicas corrosivas o impactos severos pueden inutilizar el chip. Si el chip sufre daños, debe ser reemplazado adquiriendo una nueva unidad.'
                        },
                        {
                            title: '6. Modificaciones a los Términos',
                            content: 'Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones entrarán en vigor inmediatamente después de su publicación en esta plataforma.'
                        }
                    ].map((section, i) => (
                        <div key={i} style={{ marginBottom: '32px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#F4F0EB', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                {section.title}
                            </h3>
                            <p style={{ margin: 0 }}>{section.content}</p>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div style={{ padding: '24px 32px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#E8231A', textDecoration: 'none' }}>
                        <ArrowLeft size={16} /> Volver a la página principal
                    </Link>
                </div>
            </div>
        </div>
    );
}
