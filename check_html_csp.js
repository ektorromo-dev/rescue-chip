async function checkHtml() {
    const res = await fetch('https://rescue-chip.com/dashboard');
    const html = await res.text();
    const metaCsps = html.match(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi);
    console.log('Meta CSPs found:', metaCsps ? metaCsps.length : 0);
    if (metaCsps) {
        metaCsps.forEach(m => console.log(m));
    }
}
checkHtml();
