/**
 * Utilidad para interpretar cadenas de User-Agent y devolver un resumen corto y legible.
 * Ejemplo: "Android · Chrome", "iOS · Safari", "Windows · Chrome", "Dispositivo desconocido"
 */
export function parseUserAgentShort(ua?: string | null): string {
    if (!ua || ua === "Desconocido" || ua.trim() === "") {
        return "Dispositivo desconocido";
    }

    const raw = ua.toLowerCase();

    // 1. Detectar Sistema Operativo
    let os: string | null = null;
    if (raw.includes("iphone") || raw.includes("ipad") || raw.includes("ipod")) {
        os = "iOS";
    } else if (raw.includes("android")) {
        os = "Android";
    } else if (raw.includes("windows")) {
        os = "Windows";
    } else if (raw.includes("macintosh") || raw.includes("mac os x")) {
        os = "macOS";
    } else if (raw.includes("cros")) {
        os = "ChromeOS";
    } else if (raw.includes("linux")) {
        os = "Linux";
    }

    // 2. Detectar Navegador
    let browser: string | null = null;
    if (raw.includes("samsungbrowser")) {
        browser = "Samsung Internet";
    } else if (raw.includes("edg/") || raw.includes("edgios/") || raw.includes("edga/")) {
        browser = "Edge";
    } else if (raw.includes("opr/") || raw.includes("opera")) {
        browser = "Opera";
    } else if (raw.includes("crios/")) {
        browser = "Chrome";
    } else if (raw.includes("fxios/")) {
        browser = "Firefox";
    } else if (raw.includes("chrome/") || raw.includes("chromium/")) {
        browser = "Chrome";
    } else if (raw.includes("firefox/")) {
        browser = "Firefox";
    } else if (raw.includes("safari/") && !raw.includes("chrome") && !raw.includes("android")) {
        browser = "Safari";
    }

    if (os && browser) {
        return `${os} · ${browser}`;
    }
    if (os) {
        return os;
    }
    if (browser) {
        return browser;
    }
    return "Dispositivo desconocido";
}
