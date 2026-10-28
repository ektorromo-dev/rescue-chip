const LOWERCASE_EXCEPTIONS = new Set(['de', 'del', 'la', 'las', 'los', 'y']);

/**
 * Calcula la edad en años cumplidos a la fecha actual.
 * Retorna null si la fecha es inválida o no se proporciona.
 */
export function calcularEdad(fechaNacimiento: string | null | undefined): number | null {
  if (!fechaNacimiento) return null;
  const trimmed = fechaNacimiento.trim();
  if (!trimmed) return null;

  let birthYear: number;
  let birthMonth: number; // 1-12
  let birthDay: number; // 1-31

  const match = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    birthYear = parseInt(match[1], 10);
    birthMonth = parseInt(match[2], 10);
    birthDay = parseInt(match[3], 10);
  } else {
    const d = new Date(trimmed);
    if (isNaN(d.getTime())) return null;
    birthYear = d.getFullYear();
    birthMonth = d.getMonth() + 1;
    birthDay = d.getDate();
  }

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  let age = currentYear - birthYear;
  if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
    age--;
  }

  return age >= 0 ? age : null;
}

/**
 * Quita espacios dobles, hace trim y pone mayúscula inicial en cada palabra,
 * excepto "de", "del", "la", "las", "los", "y" cuando no son la primera palabra.
 */
export function normalizarMunicipio(texto: string): string {
  if (!texto) return '';
  const cleaned = texto.trim().replace(/\s+/g, ' ');
  if (!cleaned) return '';

  return cleaned
    .split(' ')
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && LOWERCASE_EXCEPTIONS.has(lower)) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

/**
 * Construye el string de location a partir de municipio y estado.
 */
export function construirLocation(municipio: string, estado: string): string {
  return `${municipio.trim()}, ${estado.trim()}`;
}

export const MESES_MX = [
  { value: '01', label: 'Enero' },
  { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },
  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
] as const;

export const DIAS_OPCIONES = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

export function generarAnios(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= 1930; y--) {
    years.push(y);
  }
  return years;
}
