const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src/app/dashboard/page.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// The regex needs to carefully find <input, <textarea, <select and their style prop.
// Since JSX can span multiple lines, parsing with simple regex is tricky but can be done.
// Let's modify anything that matches `<input `, `<textarea `, `<select ` up to `>` or `/>`.

function injectFont(fullTag) {
    if (fullTag.includes('fontFamily')) {
        return fullTag;
    }

    const fontStr = `fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: "14px", fontWeight: 400`;

    if (fullTag.includes('style={{')) {
        // Has style prop, inject our fontStr.
        // We'll replace `style={{` with `style={{ ${fontStr}, `
        // And also strip out any existing fontSize or fontWeight just in case, though the prompt says "agrega".
        let updatedTag = fullTag.replace(/style=\{\{/, `style={{ ${fontStr}, `);
        // clean up possible existing ones
        updatedTag = updatedTag.replace(/fontSize:\s*['"][^'"]+['"]\s*,?/g, '');
        updatedTag = updatedTag.replace(/fontWeight:\s*\d+\s*,?/g, '');
        // We injected fontStr at the start and stripped existing ones, so we might have double commas or trailing commas before closing braces if we stripped from the end.
        // A cleaner way:
        return fullTag.replace(/style=\{\{/, `style={{ ${fontStr}, `).replace(/(\s*fontSize:\s*['"]?[^'"]+['"]?,?)|(\s*fontWeight:\s*\d+,?)/g, '');

    } else {
        // No style prop, insert one before the closing `/>` or `>`
        if (fullTag.endsWith('/>')) {
            return fullTag.replace(/\/>$/, `style={{ ${fontStr} }} />`);
        } else {
            return fullTag.replace(/>$/, ` style={{ ${fontStr} }}>`);
        }
    }
}

// More robust regex to match the tags even if they cross lines
const tagRegex = /<(input|textarea|select)([\s\S]*?)>/g;

let matchCount = 0;
let replaceCount = 0;

content = content.replace(tagRegex, (match) => {
    matchCount++;
    const prev = match;
    const next = injectFont(match);
    if (prev !== next) {
        replaceCount++;
    }
    return next;
});

fs.writeFileSync(targetPath, content, 'utf8');
console.log(`Found ${matchCount} tags. Updated ${replaceCount} tags.`);
