"use client";

import { useState } from "react";

export default function FirstAidBanner({ textColor = '#F4F0EB' }: { textColor?: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div style={{
            width: '100%',
            backgroundColor: 'rgba(249,115,22,0.08)',
            border: '1px solid rgba(249,115,22,0.22)',
            borderRadius: '14px',
            overflow: 'hidden',
            marginBottom: '16px',
            position: 'relative',
            zIndex: 30
        }}>
            {/* Header clickeable */}
            <button onClick={() => setIsOpen(!isOpen)} style={{
                width: '100%',
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                gap: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px', color: '#F97316' }}>⛑️</span>
                    <div>
                        <div style={{
                            fontSize: '12px', fontWeight: 900, color: '#F97316',
                            textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1
                        }}>
                            ¿No eres paramédico?
                        </div>
                        <div style={{
                            fontSize: '11px', color: textColor, marginTop: '2px',
                            textDecoration: 'underline', textDecorationStyle: 'dotted'
                        }}>
                            Toca aquí para ver cómo ayudar
                        </div>
                    </div>
                </div>
                {/* Flecha que rota */}
                <span style={{
                    color: '#F97316', fontSize: '16px', fontWeight: 900,
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    flexShrink: 0
                }}>▼</span>
            </button>

            {/* Panel expandido */}
            {isOpen && (
                <div style={{
                    padding: '0 20px 20px',
                    borderTop: '1px solid rgba(249,115,22,0.15)'
                }}>
                    <div style={{ paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                        {/* Paso 1 */}
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>🔴</span>
                            <div style={{ width: '100%' }}>
                                <div style={{ fontSize: '13px', fontWeight: 900, color: textColor, lineHeight: 1.3 }}>
                                    Llama al 911 ahora mismo
                                </div>
                                <div style={{ fontSize: '12px', color: textColor, marginTop: '2px', lineHeight: 1.4 }}>
                                    No muevas al motociclista. Espera a los paramédicos.
                                </div>
                                <a
                                    href="tel:911"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        width: '100%',
                                        padding: '14px',
                                        margin: '8px 0',
                                        backgroundColor: '#E8231A',
                                        color: '#FFFFFF',
                                        borderRadius: '12px',
                                        fontWeight: 800,
                                        fontSize: '16px',
                                        textDecoration: 'none',
                                        letterSpacing: '0.04em',
                                        boxShadow: '0 4px 12px rgba(232,35,26,0.4)',
                                    }}
                                >
                                    🚨 LLAMAR AL 911 AHORA
                                </a>
                            </div>
                        </div>

                        {/* Paso 2 */}
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>⛑️</span>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 900, color: textColor, lineHeight: 1.3 }}>
                                    No retires el casco
                                </div>
                                <div style={{ fontSize: '12px', color: textColor, marginTop: '2px', lineHeight: 1.4 }}>
                                    Solo personal capacitado debe hacerlo.
                                </div>
                            </div>
                        </div>

                        {/* Paso Hemorragia */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '8px 0', borderBottom: `1px solid rgba(0,0,0,0.06)` }}>
                            <span style={{ fontSize: '18px' }}>🩸</span>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 900, color: textColor, lineHeight: 1.3 }}>
                                    Controla hemorragias
                                </div>
                                <div style={{ fontSize: '12px', color: textColor, marginTop: '2px', lineHeight: 1.4, opacity: 0.7 }}>
                                    Presiona la herida con un trapo limpio sin soltar. No retires el trapo aunque se empape.
                                </div>
                            </div>
                        </div>

                        {/* Paso 3 */}
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>📍</span>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 900, color: textColor, lineHeight: 1.3 }}>
                                    Comparte tu ubicación
                                </div>
                                <div style={{ fontSize: '12px', color: textColor, marginTop: '2px', lineHeight: 1.4 }}>
                                    Describe referencias exactas al operador del 911.
                                </div>
                            </div>
                        </div>

                        {/* Paso 4 */}
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>📋</span>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 900, color: textColor, lineHeight: 1.3 }}>
                                    Muestra este perfil al paramédico
                                </div>
                                <div style={{ fontSize: '12px', color: textColor, marginTop: '2px', lineHeight: 1.4 }}>
                                    Contiene tipo de sangre, alergias y contactos de emergencia.
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
