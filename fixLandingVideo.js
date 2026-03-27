const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src/app/page.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// Replace all occurrences of fps.mp4 with Heartbeat%201.mp4
const newUrl = 'https://kaihkhyqjmattriozick.supabase.co/storage/v1/object/public/Media%20Landing%20Page/Heartbeat%201.mp4';
content = content.replace(/https:\/\/kaihkhyqjmattriozick\.supabase\.co\/storage\/v1\/object\/public\/Media%20Landing%20Page\/fps\.mp4/g, newUrl);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Video URLs replaced successfully.');
