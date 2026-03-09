const fs = require('fs');

function splitStyleProps(str) {
    const props = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    let parenDepth = 0;

    for (let i = 0; i < str.length; i++) {
        const char = str[i];

        if ((char === '"' || char === "'") && str[i - 1] !== '\\') {
            if (!inQuotes) {
                inQuotes = true;
                quoteChar = char;
            } else if (char === quoteChar) {
                inQuotes = false;
            }
        }

        if (!inQuotes) {
            if (char === '(') parenDepth++;
            else if (char === ')') parenDepth--;
        }

        if (char === ',' && !inQuotes && parenDepth === 0) {
            props.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    if (current.trim()) props.push(current.trim());
    return props;
}

const paths = [
    'src/app/activate/page.tsx',
    'src/app/dashboard/page.tsx',
    'src/app/shop/page.tsx'
];

paths.forEach(path => {
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');

    content = content.replace(/style=\{\{([^\}]+)\}\}/g, (match, inner) => {
        const props = splitStyleProps(inner);
        const uniqueProps = {};

        props.forEach(prop => {
            const colonIdx = prop.indexOf(':');
            if (colonIdx > -1) {
                const key = prop.substring(0, colonIdx).trim();
                const val = prop.substring(colonIdx + 1).trim();
                uniqueProps[key] = val; // Overwrites any previous duplicates!
            }
        });

        const stringified = Object.keys(uniqueProps).map(k => `${k}: ${uniqueProps[k]}`).join(', ');
        return `style={{ ${stringified} }}`;
    });

    fs.writeFileSync(path, content, 'utf8');
});
