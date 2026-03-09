const fs = require('fs');
let content = fs.readFileSync('src/components/ProfileViewer.tsx', 'utf8');

const regex = /\/\/ --- RENDER PROFILE ---[\s\S]*/m;

const profileReplacement = `// --- RENDER PROFILE ---
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0A0A08', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingBottom: '48px', paddingTop: '48px', WebkitTouchCallout: 'none', userSelect: 'none', position: 'relative', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>

            {/* Watermark */}
            <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', opacity: 0.03 }}>
                {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} style={{ whiteSpace: 'nowrap', transform: 'rotate(-45deg)', fontSize: '36px', fontWeight: 900, marginBottom: '96px' }}>
                        CONFIDENCIAL - ACCESO REGISTRADO - {new Date().toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' })}
                    </div>
                ))}
            </div>

            <div style={{ width: '100%', maxWidth: '512px', backgroundColor: '#131311', borderRadius: '40px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 10 }}>

                {/* Screenshot Warning */}
                {screenshotWarning && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', backgroundColor: '#E8231A', color: 'white', padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: 700, zIndex: 200, animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
                        Se ha detectado un posible intento de captura de pantalla. Este acceso está registrado.
                    </div>
                )}

                {/* Demo Notice */}
                {isDemo && (
                    <div style={{ width: '100%', backgroundColor: '#2563EB', color: 'white', padding: '8px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', position: 'relative', zIndex: 60 }}>
                        Este es un perfil de demostración con datos ficticios
                    </div>
                )}

                {/* Geo Error Notice */}
                {geoError && !isDemo && (
                    <div style={{ width: '100%', backgroundColor: 'rgba(220,38,38,0.9)', color: 'white', padding: '12px 24px', textAlign: 'center', fontSize: '11px', fontWeight: 700, lineHeight: 1.2, position: 'relative', zIndex: 60, borderBottom: '1px solid #7F1D1D', letterSpacing: '0.025em', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                        ⚠️ AVISO: No se pudo obtener tu ubicación. Este acceso queda registrado con tu dirección IP y dispositivo. El uso indebido de esta información será perseguido legalmente.
                    </div>
                )}

                {/* Security Bar */}
                {!isDemo && (
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', backgroundColor: '#09090b', color: '#d4d4d8', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', position: 'relative', zIndex: 50 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Lock size={12} /> Seguro</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f87171' }}>
                            Sesión expira en: {formatTime(timeLeft)}
                        </span>
                    </div>
                )}

                {/* 1. BARRA SUPERIOR FIJA (modo consulta / emergencia) */}
                {!isDemo && isEmergency && (
                    <div style={{ width: '100%', backgroundColor: '#DC2626', color: 'white', padding: '8px 16px', fontSize: '12px', fontWeight: 900, textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', zIndex: 60, position: 'relative' }}>
                        <AlertTriangle size={16} /> MODO EMERGENCIA - Contactos notificados
                    </div>
                )}
                {!isDemo && !isEmergency && (
                    <div style={{ width: '100%', backgroundColor: '#1A1A18', color: '#9E9A95', padding: '8px 16px', fontSize: '11px', fontWeight: 900, textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', zIndex: 60, position: 'relative', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        MODO CONSULTA - No se notificará a contactos
                    </div>
                )}

                {/* 2. HERO FOTO (sección roja superior) -> NOW DARK WITH FULL WIDTH PHOTO */}
                <div style={{ width: '100%', backgroundColor: '#1A1A18', position: 'relative', zIndex: 30, display: 'flex', flexDirection: 'column' }}>
                    
                    {/* FULL WIDTH PHOTO */}
                    <div style={{ width: '100%', position: 'relative' }}>
                        {isDemo ? (
                            <div style={{ width: '100%', height: '320px', backgroundColor: '#131311', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9E9A95', fontSize: '48px', fontWeight: 900 }}>
                                CM
                            </div>
                        ) : profile.photo_url ? (
                            <img src={profile.photo_url} alt={profile.full_name} style={{ objectFit: 'cover', width: '100%', maxHeight: '320px', display: 'block' }} />
                        ) : (
                            <div style={{ width: '100%', height: '240px', backgroundColor: '#131311', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <UserSquare2 size={80} style={{ color: 'rgba(158,154,149,0.5)' }} />
                            </div>
                        )}
                        
                        {/* Overlay with Name inside Photo at bottom */}
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)', padding: '40px 24px 16px 24px' }}>
                            <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.025em', marginBottom: '4px', color: '#F4F0EB' }}>
                                {isDemo ? 'Carlos Martínez' : profile.full_name}
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500, fontSize: '14px' }}>
                                {isDemo ? '32 años • Ciudad de México' : \`\${profile.age ? \`\${profile.age} años • \` : ''} \${profile.location}\`}
                            </p>
                        </div>
                    </div>

                    {/* Aviso "NO RETIRAR EL CASCO" */}
                    {profile.is_motorcyclist && (
                        <div style={{ width: '100%', backgroundColor: 'rgba(220,38,38,0.9)', color: 'white', padding: '8px 16px', fontSize: '12px', fontWeight: 900, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <ShieldAlert size={16} /> PRECAUCIÓN: NO RETIRAR EL CASCO
                        </div>
                    )}
                </div>

                {/* Content Body */}
                <div style={{ width: '100%', padding: '24px 32px', position: 'relative', zIndex: 20, display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* First Aid Banner */}
                    <FirstAidBanner />

                    {/* 3. CARD STATS */}
                    <div style={{ backgroundColor: '#131311', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px 24px', display: 'flex', justifyContent: 'space-around' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <Droplets size={24} style={{ color: '#E8231A', marginBottom: '4px' }} />
                            <span style={{ fontSize: '11px', color: '#9E9A95', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tipo de Sangre</span>
                            <span style={{ fontSize: '28px', fontWeight: 900, color: '#F4F0EB' }}>{profile.blood_type || "N/A"}</span>
                        </div>
                        <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={24} style={{ color: profile.organ_donor ? '#22c55e' : '#9E9A95', marginBottom: '4px' }} />
                            <span style={{ fontSize: '11px', color: '#9E9A95', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Donador</span>
                            <span style={{ fontSize: '28px', fontWeight: 900, color: '#F4F0EB' }}>{profile.organ_donor ? "SÍ" : "NO"}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {/* MEDICAL DETAILS */}
                        {(allergiesArray.length > 0) && (
                            /* 4. SECCIÓN ALERGIAS */
                            <div style={{ backgroundColor: 'rgba(232,35,26,0.08)', border: '1px solid rgba(232,35,26,0.2)', borderRadius: '16px', padding: '20px 24px' }}>
                                <h4 style={{ color: '#E8231A', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <AlertTriangle size={16} /> Alergias
                                </h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {allergiesArray.map((allergy, i) => (
                                        <span key={i} style={{ backgroundColor: 'rgba(232,35,26,0.1)', border: '1px solid rgba(232,35,26,0.25)', borderRadius: '8px', padding: '4px 12px', fontSize: '13px', color: '#F4F0EB', display: 'inline-block', fontWeight: 700 }}>
                                            {allergy}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 5. SECCIONES INFORMATIVAS */}
                        {(profile.medical_conditions || profile.important_medications) && (
                            <div style={{ backgroundColor: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.2)', borderRadius: '16px', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                
                                {profile.medical_conditions && (
                                    <div>
                                        <h4 style={{ color: '#D97706', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>Condiciones Médicas</h4>
                                        <p style={{ fontSize: '14px', fontWeight: 500, lineHeight: 1.6, backgroundColor: '#131311', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', color: '#F4F0EB' }}>{profile.medical_conditions}</p>
                                    </div>
                                )}
                                {profile.important_medications && (
                                    <div>
                                        <h4 style={{ color: '#D97706', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>Medicamentos Importantes</h4>
                                        <p style={{ fontSize: '14px', fontWeight: 500, lineHeight: 1.6, backgroundColor: '#131311', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', color: '#F4F0EB' }}>{profile.important_medications}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* INSURANCE DETAILS */}
                        {(profile.medical_system || profile.aseguradora || profile.numero_poliza) && profile.medical_system !== "Sin seguro médico" && (
                            <div style={{ backgroundColor: '#131311', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 900, color: '#F4F0EB', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                                    <Info size={16} style={{ color: '#9E9A95' }} /> Información de Seguro
                                </h3>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                                    {/* PRIVADO */}
                                    {(!profile.medical_system || profile.medical_system.includes("Privado") || profile.medical_system === "Otro") && (
                                        <>
                                            {profile.aseguradora && (
                                                <div>
                                                    <h4 style={{ fontSize: '11px', fontWeight: 900, color: '#9E9A95', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>🏦 Aseguradora</h4>
                                                    <p style={{ fontWeight: 900, fontSize: '16px', color: '#F4F0EB' }}>{profile.aseguradora}</p>
                                                </div>
                                            )}
                                            {profile.numero_poliza && (
                                                <div>
                                                    <h4 style={{ fontSize: '11px', fontWeight: 900, color: '#9E9A95', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>🔢 Número de Póliza</h4>
                                                    <p style={{ fontWeight: 700, fontSize: '16px', color: '#F4F0EB', backgroundColor: '#1A1A18', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', display: 'inline-block' }}>{maskNumber(profile.numero_poliza)}</p>
                                                </div>
                                            )}
                                            {profile.nombre_asegurado && (
                                                <div style={{ gridColumn: '1 / -1' }}>
                                                    <h4 style={{ fontSize: '11px', fontWeight: 900, color: '#9E9A95', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Titular</h4>
                                                    <p style={{ fontWeight: 700, fontSize: '16px', color: '#F4F0EB' }}>{profile.nombre_asegurado}</p>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* PUBLICO (IMSS, ISSSTE, PEMEX, etc) */}
                                    {profile.medical_system && !profile.medical_system.includes("Privado") && profile.medical_system !== "Otro" && (
                                        <>
                                            <div>
                                                <h4 style={{ fontSize: '11px', fontWeight: 900, color: '#9E9A95', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>🏥 Institución</h4>
                                                <p style={{ fontWeight: 900, fontSize: '16px', color: '#F4F0EB' }}>{profile.medical_system}</p>
                                            </div>
                                            {profile.nss && (
                                                <div>
                                                    <h4 style={{ fontSize: '11px', fontWeight: 900, color: '#9E9A95', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>NSS</h4>
                                                    <p style={{ fontWeight: 700, fontSize: '16px', color: '#F4F0EB', backgroundColor: '#1A1A18', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', display: 'inline-block' }}>{maskNumber(profile.nss)}</p>
                                                </div>
                                            )}
                                            {profile.numero_afiliacion && (
                                                <div>
                                                    <h4 style={{ fontSize: '11px', fontWeight: 900, color: '#9E9A95', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Afiliación</h4>
                                                    <p style={{ fontWeight: 700, fontSize: '16px', color: '#F4F0EB', backgroundColor: '#1A1A18', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', display: 'inline-block' }}>{maskNumber(profile.numero_afiliacion)}</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Call Action & Document */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {(() => {
                                        const sys = profile.medical_system;
                                        let phone = profile.telefono_aseguradora;
                                        let label = \`Llamar Institución\`;

                                        if (sys === "IMSS") { phone = "8002222668"; label = "Llamar a IMSS"; }
                                        else if (sys === "ISSSTE") { phone = "8000190900"; label = "Llamar ISSSTE"; }
                                        else if (sys === "PEMEX") { phone = "5519442500"; label = "Urgencias PEMEX"; }

                                        if (phone) {
                                            const cleanPhone = phone.replace(/\\D/g, '');
                                            return (
                                                <a href={\`tel:\${cleanPhone}\`} style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', color: '#F4F0EB', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '12px', fontWeight: 700, fontSize: '14px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.12)' }}>
                                                    <PhoneCall size={18} /> {label}
                                                </a>
                                            );
                                        }
                                        return null;
                                    })()}

                                    {signedPolizaUrl && (
                                        <div style={{ width: '100%', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                            <a href={signedPolizaUrl} target="_blank" rel="noopener noreferrer" style={{ width: '100%', display: 'flex', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#F4F0EB', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', borderRadius: '12px', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>
                                                <FileText size={20} /> Ver Póliza Completa
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 6. CONTACTOS DE EMERGENCIA */}
                        {emergencyContactsArray.length > 0 && (
                            <div style={{ backgroundColor: '#131311', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 900, color: '#F4F0EB', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <PhoneCall size={16} /> Contactos de Emergencia
                                </h3>

                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {emergencyContactsArray.map((contact, idx) => {
                                        const cleanPhone = contact.phone ? contact.phone.replace(/\\D/g, '') : "";
                                        const maskedPhone = maskNumber(contact.phone);
                                        const nameParts = contact.name ? contact.name.trim().split(' ') : [];
                                        const maskedName = nameParts.length > 0 ? nameParts[0] : "Contacto";

                                        return (
                                            <div key={idx} style={{ padding: '16px 20px', borderBottom: idx < emergencyContactsArray.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <p style={{ fontSize: '15px', fontWeight: 700, color: '#F4F0EB', marginBottom: '2px' }}>{maskedName}</p>
                                                        <p style={{ fontSize: '13px', color: '#9E9A95' }}>Familiar / Contacto {idx + 1}</p>
                                                    </div>
                                                    {contact.phone && (
                                                        <a href={\`tel:\${cleanPhone}\`} style={{ backgroundColor: 'rgba(232,35,26,0.1)', border: '1px solid rgba(232,35,26,0.3)', color: '#E8231A', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                                                            <PhoneCall size={14} /> Llamar
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* LOCATION & NOTES */}
                        {(profile.additional_notes || profile.google_maps_link) && (
                            <div style={{ backgroundColor: '#1A1A18', borderRadius: '16px', padding: '20px 24px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 900, color: '#9E9A95', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                                    <ShieldAlert size={16} /> Notas e Instrucciones
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {profile.additional_notes && (
                                        <div>
                                            <p style={{ fontSize: '14px', fontStyle: 'italic', color: '#F4F0EB', opacity: 0.9, lineHeight: 1.6, fontWeight: 500 }}>"{profile.additional_notes}"</p>
                                        </div>
                                    )}
                                    {profile.google_maps_link && (
                                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                            <h4 style={{ fontSize: '11px', fontWeight: 900, color: '#9E9A95', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Hospital / Clínica Preferida</h4>

                                            {profile.google_maps_link.startsWith('http') ? (
                                                <a
                                                    href={profile.google_maps_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', color: '#F4F0EB', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', borderRadius: '12px', fontWeight: 700, fontSize: '14px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.12)' }}
                                                >
                                                    📍 Abrir en Maps
                                                </a>
                                            ) : (
                                                <p style={{ fontSize: '14px', fontWeight: 700, backgroundColor: '#131311', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', color: '#F4F0EB', wordBreak: 'break-word' }}>{profile.google_maps_link}</p>
                                            )}

                                            <p style={{ fontSize: '10px', color: '#9E9A95', marginTop: '12px', lineHeight: 1.4, opacity: 0.8 }}>En caso de emergencia, el personal médico determinará el hospital más adecuado según tu estado de salud y criterio profesional. Este dato es solo una referencia.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>

                </div>

                {/* 7. FOOTER */}
                <div style={{ width: '100%', backgroundColor: '#0D0D0B', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 24px', textAlign: 'center' }}>
                    <p style={{ fontSize: '11px', color: 'rgba(158,154,149,0.5)', marginBottom: '12px', fontWeight: 600 }}>
                        Información proporcionada por el usuario.<br />
                        Este sistema no sustituye atención médica profesional.
                    </p>
                    <p style={{ fontSize: '10px', color: 'rgba(158,154,149,0.3)', fontFamily: 'monospace' }}>
                        REF: {chip.folio} | V3
                    </p>
                </div>
            </div>
        </div>
    );
}
`;

content = content.replace(regex, profileReplacement);
fs.writeFileSync('src/components/ProfileViewer.tsx', content);
