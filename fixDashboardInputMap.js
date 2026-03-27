const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src/app/dashboard/page.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

const targetLabelRegex = /<label htmlFor="googleMapsLink"[^>]*>Hospital o clínica de preferencia<\/label>/;
const targetInputRegex = /<input type="text" id="googleMapsLink" value=\{googleMapsLink\} onChange=\{\(e\) => setGoogleMapsLink\(e\.target\.value\)\}/;

if (!targetLabelRegex.test(content) || !targetInputRegex.test(content)) {
    console.error("COULD NOT FIND TARGETS");
    process.exit(1);
}

// Replace label target
content = content.replace(targetLabelRegex, '<label htmlFor="hospitalName" style={{ display: \'block\', fontSize: \'13px\', fontWeight: 500, color: \'#9E9A95\', marginBottom: \'8px\' }}>Hospital o clínica de preferencia</label>');

// Replace input target
content = content.replace(targetInputRegex, '<input type="text" id="hospitalName" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)}');

// Add the other div
const wrapperEndRegex = /<p style=\{\{\s*fontSize:\s*"12px",\s*color:\s*"#9E9A95"\s*\}\}>.*<\/p>\n\s*<\/div>/;

const appendedContent = `
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px' }}>
                                                <label htmlFor="googleMapsLink" style={{
                                                    fontSize: '11px', fontWeight: 700, color: '#9E9A95',
                                                    textTransform: 'uppercase', letterSpacing: '0.08em'
                                                }}>
                                                    Link Google Maps (Ubicación para emergencias)
                                                </label>
                                                <input
                                                    type="url"
                                                    id="googleMapsLink"
                                                    value={googleMapsLink}
                                                    onChange={(e) => setGoogleMapsLink(e.target.value)}
                                                    placeholder="https://maps.google.com/..."
                                                    style={{
                                                        backgroundColor: '#1A1A18',
                                                        border: '1px solid rgba(255,255,255,0.08)',
                                                        borderRadius: '10px',
                                                        padding: '12px 14px',
                                                        color: '#F4F0EB',
                                                        fontSize: '14px',
                                                        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                                                        fontWeight: 400,
                                                        outline: 'none',
                                                        width: '100%',
                                                        boxSizing: 'border-box'
                                                    }}
                                                />
                                            </div>`;

content = content.replace(wrapperEndRegex, (match) => {
    return match + appendedContent;
});

fs.writeFileSync(targetPath, content, 'utf8');
console.log("SUCCESS");
