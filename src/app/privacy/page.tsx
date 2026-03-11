import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function PrivacyPolicy() {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0A0A08', padding: '48px 16px', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
            <div style={{ maxWidth: '720px', margin: '0 auto', backgroundColor: '#131311', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>

                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg, #1C0A09 0%, #2C1210 60%, #1A0808 100%)', padding: '48px 32px', textAlign: 'center', borderBottom: '1px solid rgba(232,35,26,0.2)' }}>
                    <ShieldCheck size={48} style={{ color: '#E8231A', margin: '0 auto 16px', display: 'block' }} />
                    <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#F4F0EB', margin: '0 0 8px', letterSpacing: '-0.02em' }}>Aviso de Privacidad</h1>
                    <p style={{ color: '#9E9A95', fontSize: '14px', margin: 0 }}>
                        Última actualización: 10 de marzo de 2026
                    </p>
                </div>

                {/* Body */}
                <div style={{ padding: '40px 32px', color: '#9E9A95', lineHeight: 1.7, fontSize: '15px' }}>
                    <p style={{ color: '#F4F0EB', fontWeight: 500, marginBottom: '32px', fontSize: '16px' }}>
                        En RescueChip, nos tomamos muy en serio la privacidad y protección de sus datos médicos y personales, cumpliendo con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) en México.
                    </p>

                    {[
                        {
                            title: '1. Datos que recopilamos',
                            content: 'Recopilamos la información que usted proporciona voluntariamente al activar su dispositivo NFC, la cual incluye pero no se limita a: nombre completo, edad, tipo de sangre, alergias, condiciones médicas, medicamentos, información de seguro médico, estatus de donador de órganos, contactos de emergencia y fotografía.'
                        },
                        {
                            title: '2. Finalidad del tratamiento de datos',
                            content: null,
                            list: [
                                'Crear su perfil de emergencia vinculado a su dispositivo físico (RescueChip).',
                                'Proporcionar información vital a paramédicos, primeros respondientes y personal de salud exclusivamente en caso de accidente o emergencia médica.',
                                'Contactar a sus familiares o designados en caso de emergencia.'
                            ]
                        },
                        {
                            title: '3. Acceso limitado a su información',
                            content: 'Su información solo es accesible de forma pública a través del escaneo físico del chip NFC mediante un dispositivo móvil, o ingresando la URL pública exacta asociada a su número de folio. El usuario asume que, debido a la naturaleza vital del servicio, el perfil médico está intencionalmente diseñado para ser accesible en el lugar del accidente por cualquier primer respondiente que atienda la emergencia y escanee el casco.'
                        },
                        {
                            title: '4. Transferencia de datos',
                            content: 'RescueChip no venderá, alquilará ni compartirá su información con terceros para fines de marketing, publicidad o análisis de datos. Sus datos están alojados en servidores seguros y solo se comparten en la circunstancia de una emergencia médica a través del escaneo de su chip.'
                        },
                        {
                            title: '5. Derechos ARCO',
                            content: 'Usted tiene en todo momento el derecho de Acceder, Rectificar, Cancelar u Oponerse (Derechos ARCO) al tratamiento de su información. Si desea eliminar permanentemente su perfil médico o actualizar sus datos, puede solicitarlo enviando un correo electrónico a contacto@rescue-chip.com incluyendo su número de folio.'
                        },
                        {
                            title: '6. Consentimiento explícito',
                            content: 'Al activar el servicio de RescueChip y completar el formulario de registro, usted otorga su consentimiento expreso para el tratamiento de sus datos personales sensibles según lo estipulado en este aviso de privacidad.'
                        }
                    ].map((section, i) => (
                        <div key={i} style={{ marginBottom: '32px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#F4F0EB', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                {section.title}
                            </h3>
                            {section.content && <p style={{ margin: 0 }}>{section.content}</p>}
                            {section.list && (
                                <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {section.list.map((item, j) => (
                                        <li key={j}>{item}</li>
                                    ))}
                                </ul>
                            )}
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
