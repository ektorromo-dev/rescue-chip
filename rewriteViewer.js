const fs = require('fs');
let content = fs.readFileSync('src/components/ProfileViewer.tsx', 'utf8');

const universalFont = `fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"`;

// ACCESO RESTRINGIDO
content = content.replace(
    /<div className="min-h-screen bg-muted flex items-center justify-center p-4">[\s\S]*?<div className="bg-card w-full max-w-md rounded-3xl p-8 shadow-2xl border border-border">[\s\S]*?<ShieldAlert size=\{48\} className="mx-auto text-destructive mb-6" \/>[\s\S]*?<h1 className="text-2xl font-black text-center mb-6">Acceso Restringido<\/h1>[\s\S]*?<div className="bg-muted\/50 p-4 rounded-xl mb-8 text-xs text-muted-foreground text-justify leading-relaxed border border-border">([\s\S]*?)<\/div>[\s\S]*?<div className="space-y-4">[\s\S]*?<button[\s\S]*?<span className="flex items-center gap-2 uppercase tracking-wide">([\s\S]*?)<\/span>[\s\S]*?\(Notificará contactos de emergencia\)<\/span>\}[\s\S]*?<\/button>[\s\S]*?<button[\s\S]*?<Info size=\{18\} \/> Solo es una consulta o prueba[\s\S]*?<\/button>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>/m,
    `<div style={{ minHeight: '100vh', backgroundColor: '#0A0A08', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', ${universalFont} }}>
                <div style={{ backgroundColor: '#131311', width: '100%', maxWidth: '480px', borderRadius: '20px', padding: '48px 32px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                    <ShieldAlert size={48} style={{ margin: '0 auto', color: '#E8231A', marginBottom: '24px', display: 'block' }} />
                    <h1 style={{ fontSize: '28px', fontWeight: 900, textAlign: 'center', marginBottom: '16px', color: '#F4F0EB' }}>Acceso Restringido</h1>

                    <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '12px', fontSize: '12px', color: '#9E9A95', textAlign: 'justify', lineHeight: 1.6, marginBottom: '24px' }}>$1</div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                            onClick={() => handleConsent('emergencia')}
                            disabled={isLoadingConsent}
                            style={{ width: '100%', backgroundColor: '#E8231A', color: '#F4F0EB', padding: '14px 24px', borderRadius: '12px', fontWeight: 900, fontSize: '14px', border: 'none', cursor: isLoadingConsent ? 'not-allowed' : 'pointer', textTransform: 'uppercase', opacity: isLoadingConsent ? 0.5 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isLoadingConsent ? "PROCESANDO..." : <><AlertTriangle size={20} /> ES UNA EMERGENCIA REAL</>}
                            </span>
                            {!isLoadingConsent && <span style={{ fontSize: '10px', fontWeight: 400, opacity: 0.8, letterSpacing: '0.05em' }}>(Notificará contactos de emergencia)</span>}
                        </button>

                        <button
                            onClick={() => handleConsent('prueba')}
                            disabled={isLoadingConsent}
                            style={{ width: '100%', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#9E9A95', padding: '12px 24px', borderRadius: '12px', fontWeight: 600, fontSize: '13px', cursor: isLoadingConsent ? 'not-allowed' : 'pointer', opacity: isLoadingConsent ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <Info size={16} /> Solo es una consulta o prueba
                        </button>
                    </div>
                </div>
            </div>`
);

// SESSION EXPIRED
content = content.replace(
    /<div className="min-h-screen bg-muted flex items-center justify-center p-4">[\s\S]*?<div className="bg-card w-full max-w-md rounded-3xl p-10 text-center shadow-2xl border border-destructive\/30">[\s\S]*?<Clock size=\{56\} className="mx-auto text-muted-foreground mb-6" \/>[\s\S]*?<h2 className="text-2xl font-black mb-4">Sesión Expirada<\/h2>[\s\S]*?<p className="text-muted-foreground mb-8">Por seguridad, esta sesión ha expirado. Si necesitas ver los datos nuevamente, escanea el chip otra vez.<\/p>[\s\S]*?<Link href="\/" className="inline-flex items-center justify-center bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold">[\s\S]*?Entendido[\s\S]*?<\/Link>[\s\S]*?<\/div>[\s\S]*?<\/div>/m,
    `<div style={{ minHeight: '100vh', backgroundColor: '#0A0A08', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', ${universalFont} }}>
                <div style={{ backgroundColor: '#131311', width: '100%', maxWidth: '480px', borderRadius: '20px', padding: '40px', textAlign: 'center', border: '1px solid rgba(232,35,26,0.3)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                    <Clock size={56} style={{ margin: '0 auto', color: '#9E9A95', marginBottom: '24px', display: 'block' }} />
                    <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '16px', color: '#F4F0EB' }}>Sesión Expirada</h2>
                    <p style={{ color: '#9E9A95', marginBottom: '32px' }}>Por seguridad, esta sesión ha expirado. Si necesitas ver los datos nuevamente, escanea el chip otra vez.</p>
                    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8231A', color: '#F4F0EB', padding: '12px 24px', borderRadius: '12px', fontWeight: 700, textDecoration: 'none' }}>
                        Entendido
                    </Link>
                </div>
            </div>`
);


// RENDER PROFILE BASE - Just a start, ensuring no classNames remain where we do literal mapping
// As there are many classes, let's parse via regex to safely strip tailwind across the rest? 
// No, the user provided exact style requirements per section.

fs.writeFileSync('src/components/ProfileViewer_mod.tsx', content);
