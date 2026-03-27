const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src/app/dashboard/page.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

const fontStr = `fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: "14px", fontWeight: 400`;

function processTag(tagStr) {
    if (tagStr.includes('fontFamily')) {
        return tagStr;
    }

    if (tagStr.includes('style={{')) {
        let updated = tagStr.replace(/style=\{\{/, `style={{ ${fontStr}, `);
        updated = updated.replace(/(\s*fontSize:\s*['"]?[^'"]+['"]?,?)/g, '');
        updated = updated.replace(/(\s*fontWeight:\s*\d+,?)/g, '');
        return updated;
    } else {
        if (tagStr.endsWith('/>')) {
            return tagStr.replace(/\/>$/, `style={{ ${fontStr} }} />`);
        } else {
            return tagStr.replace(/>$/, ` style={{ ${fontStr} }}>`);
        }
    }
}

let result = '';
let i = 0;
let matchCount = 0;

while (i < content.length) {
    if (content.startsWith('<input ', i) || content.startsWith('<textarea ', i) || content.startsWith('<select ', i) || content.startsWith('<select\n', i)) {
        let start = i;
        let braceCount = 0;
        let inQuotes = false;
        let quoteChar = '';

        while (i < content.length) {
            let char = content[i];

            if (!inQuotes && (char === '"' || char === "'")) {
                inQuotes = true;
                quoteChar = char;
            } else if (inQuotes && char === quoteChar) {
                inQuotes = false;
            } else if (!inQuotes && char === '{') {
                braceCount++;
            } else if (!inQuotes && char === '}') {
                braceCount--;
            } else if (!inQuotes && braceCount === 0 && char === '>') {
                // Found the end of the tag!
                i++; // include '>'
                break;
            }
            i++;
        }

        const fullTag = content.substring(start, i);
        const newTag = processTag(fullTag);
        if (newTag !== fullTag) matchCount++;
        result += newTag;
    } else {
        result += content[i];
        i++;
    }
}

fs.writeFileSync(targetPath, result, 'utf8');
console.log(`Updated ${matchCount} tags safely.`);
