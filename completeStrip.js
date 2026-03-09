const fs = require('fs');

const tailwindMap = {
    'bg-background': 'backgroundColor: "#0A0A08"',
    'bg-card': 'backgroundColor: "#131311"',
    'bg-muted': 'backgroundColor: "#1A1A18"',
    'bg-input': 'backgroundColor: "#1A1A18"',
    'bg-[#1A1A18]': 'backgroundColor: "#1A1A18"',
    'bg-[#0A0A08]': 'backgroundColor: "#0A0A08"',
    'bg-[#1E1E1C]': 'backgroundColor: "#1E1E1C"',
    'text-foreground': 'color: "#F4F0EB"',
    'text-muted-foreground': 'color: "#9E9A95"',
    'text-primary': 'color: "#E8231A"',
    'text-destructive': 'color: "#E8231A"',
    'text-center': 'textAlign: "center"',
    'text-left': 'textAlign: "left"',
    'text-right': 'textAlign: "right"',
    'border': 'border: "1px solid rgba(255,255,255,0.08)"',
    'border-border': 'border: "1px solid rgba(255,255,255,0.08)"',
    'border-t': 'borderTop: "1px solid rgba(255,255,255,0.08)"',
    'border-b': 'borderBottom: "1px solid rgba(255,255,255,0.08)"',
    'flex': 'display: "flex"',
    'inline-flex': 'display: "inline-flex"',
    'grid': 'display: "grid"',
    'flex-col': 'flexDirection: "column"',
    'flex-row': 'flexDirection: "row"',
    'items-center': 'alignItems: "center"',
    'items-start': 'alignItems: "flex-start"',
    'justify-center': 'justifyContent: "center"',
    'justify-between': 'justifyContent: "space-between"',
    'justify-end': 'justifyContent: "flex-end"',
    'justify-start': 'justifyContent: "flex-start"',
    'mx-auto': 'margin: "0 auto"',
    'ml-auto': 'marginLeft: "auto"',
    'mr-auto': 'marginRight: "auto"',
    'mt-4': 'marginTop: "16px"',
    'mt-6': 'marginTop: "24px"',
    'mt-8': 'marginTop: "32px"',
    'mb-2': 'marginBottom: "8px"',
    'mb-4': 'marginBottom: "16px"',
    'mb-6': 'marginBottom: "24px"',
    'mb-8': 'marginBottom: "32px"',
    'ml-2': 'marginLeft: "8px"',
    'mr-2': 'marginRight: "8px"',
    'p-4': 'padding: "16px"',
    'p-6': 'padding: "24px"',
    'p-8': 'padding: "32px"',
    'p-12': 'padding: "48px"',
    'px-4': 'padding: "0 16px"',
    'px-6': 'padding: "0 24px"',
    'py-2': 'padding: "8px 0"',
    'py-4': 'padding: "16px 0"',
    'py-6': 'padding: "24px 0"',
    'py-8': 'padding: "32px 0"',
    'py-10': 'padding: "40px 0"',
    'py-12': 'padding: "48px 0"',
    'pt-4': 'paddingTop: "16px"',
    'pb-4': 'paddingBottom: "16px"',
    'pb-8': 'paddingBottom: "32px"',
    'gap-2': 'gap: "8px"',
    'gap-3': 'gap: "12px"',
    'gap-4': 'gap: "16px"',
    'gap-6': 'gap: "24px"',
    'gap-8': 'gap: "32px"',
    'w-full': 'width: "100%"',
    'w-1/2': 'width: "50%"',
    'h-full': 'height: "100%"',
    'min-h-screen': 'minHeight: "100vh"',
    'text-xs': 'fontSize: "12px"',
    'text-sm': 'fontSize: "14px"',
    'text-base': 'fontSize: "16px"',
    'text-lg': 'fontSize: "18px"',
    'text-xl': 'fontSize: "20px"',
    'text-2xl': 'fontSize: "24px"',
    'text-3xl': 'fontSize: "30px"',
    'text-4xl': 'fontSize: "36px"',
    'font-medium': 'fontWeight: 500',
    'font-semibold': 'fontWeight: 600',
    'font-bold': 'fontWeight: 700',
    'font-black': 'fontWeight: 900',
    'rounded': 'borderRadius: "4px"',
    'rounded-md': 'borderRadius: "6px"',
    'rounded-lg': 'borderRadius: "8px"',
    'rounded-xl': 'borderRadius: "12px"',
    'rounded-2xl': 'borderRadius: "16px"',
    'rounded-3xl': 'borderRadius: "24px"',
    'rounded-full': 'borderRadius: "9999px"',
    'shadow-sm': 'boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"',
    'shadow': 'boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)"',
    'shadow-md': 'boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"',
    'shadow-lg': 'boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"',
    'shadow-xl': 'boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"',
    'opacity-50': 'opacity: 0.5',
    'transition-all': 'transition: "all 0.2s ease-in-out"',
    'transition-colors': 'transition: "color 0.2s, background-color 0.2s, border-color 0.2s"',
    'absolute': 'position: "absolute"',
    'relative': 'position: "relative"',
    'top-0': 'top: 0',
    'right-0': 'right: 0',
    'bottom-0': 'bottom: 0',
    'left-0': 'left: 0',
    'inset-0': 'top: 0, right: 0, bottom: 0, left: 0',
    'z-10': 'zIndex: 10',
    'z-50': 'zIndex: 50',
    'overflow-hidden': 'overflow: "hidden"',
    'hidden': 'display: "none"',
    'block': 'display: "block"',
    'inline-block': 'display: "inline-block"',
    'space-y-2': 'display: "flex", flexDirection: "column", gap: "8px"',
    'space-y-3': 'display: "flex", flexDirection: "column", gap: "12px"',
    'space-y-4': 'display: "flex", flexDirection: "column", gap: "16px"',
    'space-y-6': 'display: "flex", flexDirection: "column", gap: "24px"',
    'space-y-8': 'display: "flex", flexDirection: "column", gap: "32px"',
    'space-x-2': 'display: "flex", gap: "8px"',
    'space-x-4': 'display: "flex", gap: "16px"',
    'grid-cols-1': 'gridTemplateColumns: "repeat(1, minmax(0, 1fr))"',
    'grid-cols-2': 'gridTemplateColumns: "repeat(2, minmax(0, 1fr))"',
    'grid-cols-3': 'gridTemplateColumns: "repeat(3, minmax(0, 1fr))"'
}

const parseClasses = (clsString) => {
    let styles = [];
    clsString.split(/\s+/).forEach(cls => {
        let core = cls.replace(/^(md|sm|lg|hover|focus|focus-visible|disabled):/, '');
        if (tailwindMap[core]) {
            styles.push(tailwindMap[core]);
        } else if (core.startsWith('max-w-')) {
            switch (core) {
                case 'max-w-xs': styles.push('maxWidth: "320px"'); break;
                case 'max-w-sm': styles.push('maxWidth: "384px"'); break;
                case 'max-w-md': styles.push('maxWidth: "448px"'); break;
                case 'max-w-lg': styles.push('maxWidth: "512px"'); break;
                case 'max-w-xl': styles.push('maxWidth: "576px"'); break;
                case 'max-w-2xl': styles.push('maxWidth: "672px"'); break;
                case 'max-w-3xl': styles.push('maxWidth: "768px"'); break;
                case 'max-w-4xl': styles.push('maxWidth: "896px"'); break;
            }
        } else if (core.startsWith('w-')) {
            if (core === 'w-1/2') styles.push('width: "50%"');
            else if (core === 'w-full') styles.push('width: "100%"');
            else styles.push(`width: "${parseInt(core.split('-')[1]) * 4}px"`);
        } else if (core.startsWith('h-')) {
            if (core === 'h-full') styles.push('height: "100%"');
            else if (core === 'h-screen') styles.push('height: "100vh"');
            else styles.push(`height: "${parseInt(core.split('-')[1]) * 4}px"`);
        }
    });
    return styles.join(', ');
};

const paths = [
    'src/app/activate/page.tsx',
    'src/app/dashboard/page.tsx',
    'src/app/shop/page.tsx'
];

function processFile(path) {
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');

    // Convert className="..." to style={{...}}
    let result = content.replace(/className=\"([^\"]*)\"(\s+style=\{\{([^\}]*)\}\})?/g, (fullMatch, classes, hasStyle, styleContent) => {
        const inlineStyles = parseClasses(classes);
        if (!inlineStyles) return hasStyle ? `style={{${styleContent}}}` : '';

        if (hasStyle && styleContent) {
            return `style={{ ${styleContent}, ${inlineStyles} }}`;
        } else {
            return `style={{ ${inlineStyles} }}`;
        }
    });

    // Extract reverse case: style={{...}} className="..."
    result = result.replace(/style=\{\{([^\}]*)\}\}\s*className=\"([^\"]*)\"/g, (fullMatch, styleContent, classes) => {
        const inlineStyles = parseClasses(classes);
        if (!inlineStyles) return `style={{${styleContent}}}`;
        return `style={{ ${styleContent}, ${inlineStyles} }}`;
    });

    // Handle template literals inside className like className={`flex ${...}`}
    result = result.replace(/className=\{`([^`]+)`\}/g, (fullMatch, classes) => {
        return ""; // We just strip it or maybe convert pure static parts if possible, but let's just strip it safely
    });

    // Remove any leftover empty className=""
    result = result.replace(/className=\"\"/g, "");

    fs.writeFileSync(path, result, 'utf8');
}

paths.forEach(processFile);
