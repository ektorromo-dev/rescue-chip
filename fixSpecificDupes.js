const fs = require('fs');

const paths = [
    'src/app/activate/page.tsx',
    'src/app/dashboard/page.tsx',
    'src/app/shop/page.tsx'
];

paths.forEach(path => {
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');

    // Manually fix known exact duplicates
    content = content.replace(/padding:\s*"0\s+16px",\s*padding:\s*"8px\s+0"/g, 'padding: "8px 16px"');
    content = content.replace(/padding:\s*"16px",\s*padding:\s*"32px"/g, 'padding: "32px"');
    content = content.replace(/flexDirection:\s*"column",\s*flexDirection:\s*"row"/g, 'flexDirection: "row"');
    content = content.replace(/padding:\s*"0\s+24px",\s*padding:\s*"16px\s+0"/g, 'padding: "16px 24px"');
    content = content.replace(/padding:\s*"0\s+16px",\s*padding:\s*"16px\s+0"/g, 'padding: "16px 16px"');

    // Also remove empty trailing padding if it exists
    content = content.replace(/padding:\s*"0\s+16px",\s*padding:\s*"0\s+16px"/g, 'padding: "0 16px"');

    fs.writeFileSync(path, content, 'utf8');
});
