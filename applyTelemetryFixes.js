const fs = require('fs');
const path = require('path');

// 1. UPDATE ACTIVATE PAGE TEXTAREAS
const activatePath = path.join(__dirname, 'src/app/activate/page.tsx');
let activateContent = fs.readFileSync(activatePath, 'utf8');

// The user said: medicalConditions, importantMedications, additionalNotes textareas in activate/page.tsx
// Let's replace the style={{...}} for ANY <textarea>
const newStyle = `style={{ width: '100%', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', fontSize: '15px', color: '#F4F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', minHeight: '80px', resize: 'none', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}`;

activateContent = activateContent.replace(/<textarea([^>]*)style=\{\{[^}]*\}\}([^>]*)>/g, `<textarea$1${newStyle}$2>`);
// Note: if style isn't caught by the regex (e.g., nested braces), we can do it more carefully. But standard ones are caught.
// Wait, the existing textareas might have `style={{ ... }}` spanning multiple lines or with nested objects? Unlikely for activate.
// Let's use a simpler regex if possible, or AST. Instead of playing with regex for activate, let's just use string replacement if we know the exact IDs. But I couldn't find the IDs. That means they might be differently cased like `medical_conditions` or just completely different.
// Let's just replace all <textarea ... style={{ ... }}> with the new style.
// A simpler way:
let modifiedCount = 0;
activateContent = activateContent.replace(/<textarea([^>]*?)style=\{\{([^}]*?)\}\}([^>]*?)>/g, (match, before, styleStr, after) => {
    modifiedCount++;
    return `<textarea${before}${newStyle}${after}>`;
});
console.log(`Updated ${modifiedCount} textareas in activate/page.tsx`);
fs.writeFileSync(activatePath, activateContent, 'utf8');

// 2. UPDATE PROFILE VIEWER
const profileViewerPath = path.join(__dirname, 'src/components/ProfileViewer.tsx');
let profileViewerContent = fs.readFileSync(profileViewerPath, 'utf8');

const logScanFn = `
    const logScan = async (tipo: 'emergencia' | 'consulta') => {
        try {
            let latitud: number | null = null;
            let longitud: number | null = null;
            if (navigator.geolocation) {
                await new Promise<void>((resolve) => {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => { latitud = pos.coords.latitude; longitud = pos.coords.longitude; resolve(); },
                        () => resolve(),
                        { timeout: 3000 }
                    );
                });
            }
            await fetch('/api/log-scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chip_folio: chip.folio, tipo, latitud, longitud }),
            });
        } catch (e) {
            console.error('logScan error:', e);
        }
    };
`;

// Insert before `if (!hasConsented && !sessionExpired) {`
profileViewerContent = profileViewerContent.replace('if (!hasConsented && !sessionExpired) {', logScanFn + '\n    if (!hasConsented && !sessionExpired) {');

// Update buttons
// onClick={() => handleConsent('emergencia')} -> onClick={() => { handleConsent('emergencia'); logScan('emergencia'); }}
profileViewerContent = profileViewerContent.replace(/onClick=\{\(\) => handleConsent\('emergencia'\)\}/g, `onClick={() => { handleConsent('emergencia'); logScan('emergencia'); }}`);
// onClick={() => handleConsent('prueba')} -> onClick={() => { handleConsent('prueba'); logScan('consulta'); }}
profileViewerContent = profileViewerContent.replace(/onClick=\{\(\) => handleConsent\('prueba'\)\}/g, `onClick={() => { handleConsent('prueba'); logScan('consulta'); }}`);

fs.writeFileSync(profileViewerPath, profileViewerContent, 'utf8');
console.log('Updated ProfileViewer with telemetry.');
