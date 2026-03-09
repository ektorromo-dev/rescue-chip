const fs = require('fs');

const paths = [
    'src/app/activate/page.tsx',
    'src/app/dashboard/page.tsx',
    'src/app/shop/page.tsx'
];

paths.forEach(path => {
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');

    content = content.replace(/style=\{\{([^\}]+)\}\}/g, (match, inner) => {
        // Safe split: split on commas that are NOT inside parentheses
        const props = inner.split(/,(?![^\(\)]*\))/g).map(s => s.trim()).filter(Boolean);
        const uniqueProps = {};

        props.forEach(prop => {
            const colonIdx = prop.indexOf(':');
            if (colonIdx > -1) {
                const key = prop.substring(0, colonIdx).trim();
                let val = prop.substring(colonIdx + 1).trim();

                // Keep the LAST property (simulates CSS specificity where md: overrides base)
                // Exception: if it's padding "0 16px" vs "8px 0", let's just keep the last one.
                uniqueProps[key] = val;
            }
        });

        const stringified = Object.keys(uniqueProps).map(k => `${k}: ${uniqueProps[k]}`).join(', ');
        return `style={{ ${stringified} }}`;
    });

    fs.writeFileSync(path, content, 'utf8');
});
