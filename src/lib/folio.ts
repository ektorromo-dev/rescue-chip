export const FOLIO_REGEX = /^RSC-[A-Za-z0-9_-]{3,20}$/i;

export function isValidFolio(folio?: string | null): boolean {
    if (!folio || typeof folio !== 'string') return false;
    return FOLIO_REGEX.test(folio.trim());
}
