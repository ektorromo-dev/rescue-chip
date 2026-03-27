const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src/app/dashboard/page.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Add hospitalName state
content = content.replace(
    /const \[googleMapsLink, setGoogleMapsLink\] = useState\(\"\"\);/,
    `const [googleMapsLink, setGoogleMapsLink] = useState("");\n    const [hospitalName, setHospitalName] = useState("");`
);

// 2. Initialize hospitalName from profile
content = content.replace(
    /setGoogleMapsLink\(profile\.google_maps_link \|\| \"\"\);/,
    `setHospitalName(profile.hospital_name || "");\n                setGoogleMapsLink(profile.google_maps_link || "");`
);

// 3. Add to profileToUpdate payload
content = content.replace(
    /google_maps_link: googleMapsLink,/,
    `hospital_name: hospitalName,\n                google_maps_link: googleMapsLink,`
);

// 4. Add the input field before googleMapsLink
const inputBlock = `
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{
                                                fontSize: '11px', fontWeight: 700, color: '#9E9A95',
                                                textTransform: 'uppercase', letterSpacing: '0.08em'
                                            }}>
                                                Hospital / Clínica Preferida
                                            </label>
                                            <input
                                                type="text"
                                                value={hospitalName}
                                                onChange={(e) => setHospitalName(e.target.value)}
                                                placeholder="Ej. Hospital Ángeles Pedregal"
                                                maxLength={100}
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
                                                    boxSizing: 'border-box' as const
                                                }}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label htmlFor="googleMapsLink" style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}>Google Maps Link</label>`;

content = content.replace(
    /<div style=\{\{\s*display:\s*\'flex\',\s*flexDirection:\s*\'column\',\s*gap:\s*\'6px\'\s*\}\}>\s*<label htmlFor=\"googleMapsLink\"[^>]*>Google Maps Link<\/label>/,
    inputBlock
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Dashboard file updated successfully.');
