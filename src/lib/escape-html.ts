/**
 * Escapa caracteres especiales de HTML para prevenir inyecciones XSS en correos.
 * Escapa en orden: & < > " '
 */
export function escapeHtml(texto: string): string {
  if (!texto) return '';
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
