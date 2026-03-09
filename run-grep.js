const fs = require('fs');

function grep(file, regexStr, limit) {
    try {
        const lines = fs.readFileSync(file, 'utf8').split('\n');
        const regex = new RegExp(regexStr);
        let count = 0;
        for (let i = 0; i < lines.length; i++) {
            // use .replace(/\r$/,'') to handle windows line endings
            if (regex.test(lines[i])) {
                console.log((i + 1) + ':' + lines[i].replace(/\r$/, ''));
                count++;
                if (count >= limit) break;
            }
        }
    } catch (e) {
        console.error('File missing or error:', e.message);
    }
}

console.log('\\n--- 1. grep -n "input|Input|style=" src/app/activate/page.tsx | head -60 ---');
grep('src/app/activate/page.tsx', 'input|Input|style=', 60);

console.log('\\n--- 2. grep -n "input|Input|style=" src/app/dashboard/page.tsx | head -60 ---');
grep('src/app/dashboard/page.tsx', 'input|Input|style=', 60);

console.log('\\n--- 3. grep -n "className=" src/app/activate/page.tsx | head -40 ---');
grep('src/app/activate/page.tsx', 'className=', 40);

console.log('\\n--- 4. grep -n "Ver mi Perfil|card|container|wrapper" src/app/dashboard/page.tsx | head -30 ---');
grep('src/app/dashboard/page.tsx', 'Ver mi Perfil|card|container|wrapper', 30);
