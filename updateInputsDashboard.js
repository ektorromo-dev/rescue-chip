const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src/app/dashboard/page.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// FIX 2
const oldButton = `<button type="button" onClick={handleDeleteInsuranceInfo} style={{ color: "#E8231A", fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center" }}>`;
const newButton = `<button type="button" onClick={handleDeleteInsuranceInfo} style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "transparent", border: "1px solid rgba(232,35,26,0.5)", borderRadius: "8px", padding: "5px 12px", color: "#F4F0EB", fontSize: "12px", fontWeight: 600, cursor: "pointer", background: "none" }}>`;
content = content.replace(oldButton, newButton);

// FIX 3
content = content.replace(/<(input|select|textarea)([^>]*)style=\{\{([\s\S]*?)\}\}/g, (match, tag, beforeStyle, styleContent) => {
    let cleanStyle = styleContent
        .replace(/fontSize:\s*["'][^"']+["'],?/g, '')
        .replace(/fontWeight:\s*\d+,?/g, '')
        .replace(/fontFamily:\s*["'][^"']+["'],?/g, '')
        .replace(/,\s*,/g, ',') // clean up commas
        .trim();

    if (cleanStyle && !cleanStyle.endsWith(',')) cleanStyle += ', ';

    return `<${tag}${beforeStyle}style={{ ${cleanStyle}fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: "14px", fontWeight: 400 }}`;
});

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Dashboard inputs and button updated.');
