const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src/app/dashboard/page.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

let matchCount = 0;

content = content.replace(/<select([\s\S]*?)<\/select>/g, (match) => {
    // Skip if we already wrapped it previously
    if (match.includes('WebkitAppearance: "none"')) return match;

    matchCount++;

    let newSelect = match.replace(/style=\{\{/, `style={{ appearance: "none", WebkitAppearance: "none", paddingRight: "36px", `);

    return `<div style={{ position: "relative" }}>
${newSelect}
<span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#9E9A95", fontSize: "12px" }}>▼</span>
</div>`;
});

fs.writeFileSync(targetPath, content, 'utf8');
console.log(`Updated ${matchCount} select tags.`);
