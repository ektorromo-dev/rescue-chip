const fs = require('fs');

const paths = [
    'src/app/activate/page.tsx',
    'src/app/dashboard/page.tsx',
    'src/app/shop/page.tsx'
];

paths.forEach(path => {
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');

    // Fix duplicate styles created when an input already had a style
    // Pattern: style={{ A }} onFocus={B} onBlur={C} style={{ D }}
    content = content.replace(/style=\{\{([\s\S]*?)\}\}\s*onFocus=\{\(e\) => e\.target\.style\.borderColor = 'rgba\(\d+,\d+,\d+,[\d.]+\)'\}\s*onBlur=\{\(e\) => e\.target\.style\.borderColor = 'rgba\(\d+,\d+,\d+,[\d.]+\)'\}\s*style=\{\{([\s\S]*?)\}\}/g, (match, p1, p2) => {
        return `style={{${p2}, ${p1}}} onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'} onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}`;
    });

    // Also the other way around: style={{ D }} ... style={{ A }} onFocus={B} onBlur={C}
    content = content.replace(/style=\{\{([\s\S]*?)\}\}\s*(?:[a-zA-Z]+=\{\S+\}\s*)*style=\{\{([\s\S]*?)\}\}\s*onFocus=\{\(e\) => e\.target\.style\.borderColor = /g, (match, p1, p2) => {
        // Just merge them if they are adjacent
        return `style={{${p1}, ${p2}}} onFocus={(e) => e.target.style.borderColor = `;
    });

    // Fix missed className="space-y-2 md:col-span-2"
    content = content.replace(/className="space-y-2 md:col-span-2"/g, "style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}");
    content = content.replace(/className="space-y-4 md:col-span-2"/g, "style={{ display: 'flex', flexDirection: 'column', gap: '16px', gridColumn: '1 / -1' }}");

    // General missed classes check
    content = content.replace(/className="animate-spin text-primary\/30 mb-4"/g, "style={{ animation: 'spin 1s linear infinite', color: 'rgba(232,35,26,0.3)', marginBottom: '16px' }}");
    content = content.replace(/className="font-medium animate-pulse"/g, "style={{ fontWeight: 500, animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}");
    content = content.replace(/className="p-24 flex flex-col items-center justify-center text-muted-foreground"/g, "style={{ padding: '96px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9E9A95' }}");
    content = content.replace(/className="space-y-10"/g, "style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}");
    content = content.replace(/className="relative"/g, "style={{ position: 'relative' }}");

    fs.writeFileSync(path, content, 'utf8');
});
