const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src/components/ProfileViewer.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. ADD STATE AND THEME LOGIC
// We need to inject the state inside the component: `export default function ProfileViewer({ ... }: ProfileViewerProps) {`
const themeCode = `
    const getAutoTheme = () => {
        const h = new Date().getHours();
        return (h >= 6 && h < 19) ? 'day' : 'night';
    };
    const [theme, setTheme] = useState<'day' | 'night'>(getAutoTheme());
    const toggleTheme = () => setTheme(t => t === 'day' ? 'night' : 'day');
    const d = theme === 'day';

    const C = {
        bgPage:        d ? '#F5F0E8' : '#0A0A08',
        bgCard:        d ? '#FEFCF8' : '#131311',
        bgInput:       d ? '#EDE8DE' : '#1A1A18',
        bgSection:     d ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
        textMain:      d ? '#1A100A' : '#F4F0EB',
        textMuted:     d ? '#5C4F42' : '#9E9A95',
        textDim:       d ? '#8C7F72' : '#6B6762',
        border:        d ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.08)',
        borderSoft:    d ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.12)',
        red:           d ? '#B91C1C' : '#E8231A',
        redDim:        d ? 'rgba(185,28,28,0.10)' : 'rgba(232,35,26,0.14)',
        redBorder:     d ? 'rgba(185,28,28,0.35)' : 'rgba(232,35,26,0.30)',
        amber:         d ? '#92400E' : '#D97706',
        amberDim:      d ? 'rgba(146,64,14,0.10)' : 'rgba(217,119,6,0.14)',
        amberBorder:   d ? 'rgba(146,64,14,0.30)' : 'rgba(217,119,6,0.28)',
        green:         d ? '#166534' : '#22c55e',
        greenDim:      d ? 'rgba(22,101,52,0.12)' : 'rgba(34,197,94,0.14)',
        blue:          d ? '#1D4ED8' : '#3B82F6',
        blueDim:       d ? 'rgba(29,78,216,0.12)' : 'rgba(59,130,246,0.15)',
        orange:        d ? '#C2410C' : '#F97316',
        orangeDim:     d ? 'rgba(194,65,12,0.08)' : 'rgba(249,115,22,0.10)',
        orangeBorder:  d ? 'rgba(194,65,12,0.28)' : 'rgba(249,115,22,0.25)',
        tickerBg:      d ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
        tickerText:    d ? 'rgba(26,16,10,0.45)' : 'rgba(244,240,235,0.4)',
    };
`;

const toggleBtn = `
            <button
                onClick={toggleTheme}
                style={{
                    position: 'fixed',
                    top: '12px',
                    right: '12px',
                    zIndex: 999,
                    background: C.bgCard,
                    border: \`1px solid \${C.borderSoft}\`,
                    borderRadius: '999px',
                    padding: '7px 14px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: C.textMuted,
                    fontFamily: "'Inter', sans-serif",
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                }}
            >
                {theme === 'day' ? '🌙 Noche' : '☀️ Día'}
            </button>
`;

// Inject state AFTER the signature
const compStartRegex = /export default function ProfileViewer\([^)]*\)\s*\{/;
content = content.replace(compStartRegex, (match) => {
    return match + '\n' + themeCode;
});

// Inject toggle button exactly after the main `<div style={{ minHeight: '100vh', ... }}>` of the profile renderer.
// The code has:
// return (
//     <div style={{ minHeight: '100vh', backgroundColor: '#0A0A08', ... }}>
// We will replace colors later, but let's inject button first.
// In the current code:
content = content.replace(/(return \(\s*<div style=\{\{ minHeight:\s*'100vh',[^}]*\}\}>\s*)/, (match) => {
    return match + toggleBtn;
});

// 2. REPLACE COLORS GLOBALLY
// We need to carefully replace the exact strings in the JSX.
const replacements = [
    { regex: /'#0A0A08'/g, rep: 'C.bgPage' },
    { regex: /'#131311'/g, rep: 'C.bgCard' },
    { regex: /'#1A1A18'|'#0F0F0D'|'#0D0D0B'/g, rep: 'C.bgInput' },
    { regex: /'rgba\(255,255,255,0\.04\)'/g, rep: 'C.bgSection' },
    { regex: /'#F4F0EB'/g, rep: 'C.textMain' },
    { regex: /'#9E9A95'/g, rep: 'C.textMuted' },
    { regex: /'rgba\(255,255,255,0\.08\)'/g, rep: 'C.border' },
    { regex: /'rgba\(255,255,255,0\.12\)'/g, rep: 'C.borderSoft' },
    { regex: /'#E8231A'|'#DC2626'/g, rep: 'C.red' },
    { regex: /'rgba\(232,35,26,0\.14\)'|'rgba\(232,35,26,0\.08\)'/g, rep: 'C.redDim' },
    { regex: /'rgba\(232,35,26,0\.35\)'|'rgba\(232,35,26,0\.3\)'|'rgba\(232,35,26,0\.30\)'/g, rep: 'C.redBorder' },
    { regex: /'#D97706'/g, rep: 'C.amber' },
    { regex: /'rgba\(217,119,6,0\.14\)'/g, rep: 'C.amberDim' },
    { regex: /'rgba\(217,119,6,0\.3\)'|'rgba\(217,119,6,0\.30\)'/g, rep: 'C.amberBorder' },
    { regex: /'#22c55e'/g, rep: 'C.green' },
    { regex: /'rgba\(34,197,94,0\.14\)'/g, rep: 'C.greenDim' },
    { regex: /'#3B82F6'|'#2563EB'/g, rep: 'C.blue' },
    { regex: /'rgba\(59,130,246,0\.15\)'/g, rep: 'C.blueDim' },
    { regex: /'#F97316'/g, rep: 'C.orange' },
    { regex: /'rgba\(249,115,22,0\.10\)'/g, rep: 'C.orangeDim' },
    { regex: /'rgba\(249,115,22,0\.25\)'/g, rep: 'C.orangeBorder' },
];

for (const { regex, rep } of replacements) {
    content = content.replace(regex, rep);
}

// Special case for Ticker (Watermark)
// Right now it's just:
// <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', opacity: 0.03 }}>
// And text is standard color. The user requested:
// "Su background por C.tickerBg, el color del texto por C.tickerText".
// Maybe there's a specific ticker component or we just add it to the exact elements.
content = content.replace(
    /style=\{\{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100(.*) \}\}>/g,
    `style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100, backgroundColor: C.tickerBg, color: C.tickerText, $1 }}>`
);

content = content.replace( // removing opacity 0.03 if we apply it to ticker content directly? The text is colored with C.tickerText natively, we'll strip opacity just in case it double cascades.
    /opacity: 0\.03/g, 'opacity: 1'
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Script completed.');
