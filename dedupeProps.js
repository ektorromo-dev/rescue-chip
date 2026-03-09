const fs = require('fs');

const paths = [
    'src/app/activate/page.tsx',
    'src/app/dashboard/page.tsx',
    'src/app/shop/page.tsx'
];

paths.forEach(path => {
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');

    // Regex to find style={{ ... }}
    content = content.replace(/style=\{\{([^\}]+)\}\}/g, (match, inner) => {
        // Split by comma
        const props = inner.split(',').map(s => s.trim()).filter(Boolean);
        const uniqueProps = {};

        props.forEach(prop => {
            const colonIdx = prop.indexOf(':');
            if (colonIdx > -1) {
                const key = prop.substring(0, colonIdx).trim();
                const val = prop.substring(colonIdx + 1).trim();
                // Later properties overwrite earlier ones (like Tailwind md: overrides default)
                uniqueProps[key] = val;
            }
        });

        const stringified = Object.keys(uniqueProps).map(k => `${k}: ${uniqueProps[k]}`).join(', ');
        return `style={{ ${stringified} }}`;
    });

    fs.writeFileSync(path, content, 'utf8');
});
