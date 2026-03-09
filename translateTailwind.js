const fs = require('fs');

const inputReplacement = `style={{
                                width: '100%',
                                backgroundColor: '#1A1A18',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '10px',
                                padding: '12px 16px',
                                fontSize: '15px',
                                color: '#F4F0EB',
                                outline: 'none',
                                boxSizing: 'border-box',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'rgba(232,35,26,0.5)'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}`;

const labelReplacement = `style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9E9A95', marginBottom: '8px' }}`;

const paths = [
    'src/app/activate/page.tsx',
    'src/app/dashboard/page.tsx',
    'src/app/shop/page.tsx'
];

paths.forEach(path => {
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');

    // Remove the style block if it exists
    content = content.replace(/<style dangerouslySetInnerHTML=\{[\s\S]*?\}\} \/>/g, '');

    // Form containers
    content = content.replace(/className="space-y-10"/g, "style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}");
    content = content.replace(/className="space-y-8"/g, "style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}");
    content = content.replace(/className="space-y-6"/g, "style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}");
    content = content.replace(/className="space-y-4"/g, "style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}");
    content = content.replace(/className="space-y-3"/g, "style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}");
    content = content.replace(/className="space-y-2"/g, "style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}");

    // Grids
    content = content.replace(/className="grid grid-cols-1 md:grid-cols-2 gap-4"/g, "style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}");
    content = content.replace(/className="grid grid-cols-1 md:grid-cols-2 gap-6"/g, "style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}");
    content = content.replace(/className="grid md:grid-cols-2 gap-6"/g, "style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}");
    content = content.replace(/className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start"/g, "style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '32px', alignItems: 'flex-start' }}");
    content = content.replace(/className="grid md:grid-cols-3 gap-8 items-start"/g, "style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '32px', alignItems: 'flex-start' }}");
    content = content.replace(/className="grid grid-cols-1 md:grid-cols-3 gap-6"/g, "style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}");
    content = content.replace(/className="grid md:grid-cols-3 gap-6"/g, "style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}");

    // Inputs
    content = content.replace(/className="w-full flex h-12 rounded-xl border border-white\/40 bg-\[#1E1E1C\] px-4 py-2 text-sm focus-[^"]*"/g, inputReplacement);
    content = content.replace(/className="w-full flex h-12 rounded-xl border border-white\/40 bg-\[#1E1E1C\] px-4 py-2 pr-12 text-sm focus-[^"]*"/g, inputReplacement);
    content = content.replace(/className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"/g, inputReplacement);
    content = content.replace(/className="w-full flex rounded-xl border border-white\/40 bg-\[#1E1E1C\] px-4 py-3 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all min-h-\[120px\] resize-y"/g, inputReplacement.replace(/height: '56px'/g, "minHeight: '120px'")); // Textareas
    content = content.replace(/className="w-full h-12 px-4 rounded-xl border border-white\/40 bg-\[#1E1E1C\] text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all"/g, inputReplacement);

    content = content.replace(/className="w-full flex rounded-xl border border-white\/40 bg-\[#1E1E1C\] px-4 py-3 text-sm focus-visible:ring-2 focus-visible:ring-ring transition-all min-h-\[100px\] resize-y"/g, inputReplacement + " style={{minHeight: '100px'}}");

    // Labels
    content = content.replace(/className=\"text-sm font-semibold\"/g, labelReplacement);

    // Checkboxes / Radios
    content = content.replace(/className="w-5 h-5 rounded border-white\/40 bg-\[#1E1E1C\] text-primary focus:ring-primary focus:ring-offset-background"/g, "style={{ width: '20px', height: '20px', accentColor: '#E8231A', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}");
    content = content.replace(/className="w-5 h-5 rounded-full border-white\/40 bg-\[#1E1E1C\] text-primary focus:ring-primary focus:ring-offset-background"/g, "style={{ width: '20px', height: '20px', accentColor: '#E8231A', backgroundColor: '#1A1A18', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}");

    // Checkbox labels wrappers
    content = content.replace(/className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted\/30"/g, "style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#131311' }}");
    content = content.replace(/className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card"/g, "style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#1A1A18' }}");

    // Help details
    content = content.replace(/className="text-sm text-muted-foreground font-medium"/g, "style={{ fontSize: '14px', color: '#9E9A95', fontWeight: 500, margin: '4px 0 0 0' }}");
    content = content.replace(/className="text-muted-foreground text-sm font-medium"/g, "style={{ fontSize: '14px', color: '#9E9A95', fontWeight: 500, margin: '4px 0 0 0' }}");
    content = content.replace(/className="text-sm text-muted-foreground mt-4 font-medium"/g, "style={{ fontSize: '13px', color: '#9E9A95', textAlign: 'center', marginTop: '16px', fontWeight: 500 }}");

    // Form Submits
    content = content.replace(/className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground h-16 rounded-2xl text-xl font-black hover:scale-\[1.02\] hover:bg-primary\/90 transition-all shadow-xl shadow-primary\/20 mt-8 disabled:opacity-70 disabled:pointer-events-none disabled:transform-none"/g,
        `style={{ marginTop: '32px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#E8231A', color: '#fff', height: '64px', borderRadius: '16px', fontSize: '20px', fontWeight: 900, border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}`);

    // Eye button / Absolute buttons
    content = content.replace(/className="absolute right-0 top-0 h-12 px-4 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"/g, "style={{ position: 'absolute', right: 0, top: 0, height: '48px', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9E9A95', background: 'none', border: 'none', cursor: 'pointer' }}");

    fs.writeFileSync(path, content, 'utf8');
});
