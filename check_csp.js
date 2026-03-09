async function getCsp() {
    const fs = require('fs');
    const res = await fetch('https://rescue-chip.com/dashboard');
    const csp = res.headers.get('content-security-policy');
    if (!csp) {
        fs.writeFileSync('csp_out.txt', "NO CSP HEADER FOUND");
        return;
    }
    const directives = csp.split(';').map(d => d.trim());
    const connectSrc = directives.find(d => d.startsWith('connect-src'));
    fs.writeFileSync('csp_out.txt', connectSrc || "NO CONNECT-SRC DIRECTIVE FOUND");
}
getCsp();
