async function countCsp() {
    const res = await fetch('https://rescue-chip.com/dashboard');
    let count = 0;
    const cspValues = [];
    for (const [key, value] of res.headers.entries()) {
        if (key.toLowerCase() === 'content-security-policy') {
            count++;
            cspValues.push(value);
        }
    }
    console.log(`CSP headers count: ${count}`);
    cspValues.forEach((val, i) => {
        console.log(`Header ${i + 1}: ${val}`);
    });
}
countCsp();
