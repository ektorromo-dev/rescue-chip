import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';

export interface PhoneValidationResult {
  isValid: boolean;
  formatted: string | null;
  country: string | null;
  error?: string;
}

export function validateAndFormatPhone(
  phoneInput: string,
  countryCode: CountryCode
): PhoneValidationResult {
  try {
    const phoneNumber = parsePhoneNumber(phoneInput, countryCode);

    if (!phoneNumber || !phoneNumber.isValid()) {
      return {
        isValid: false,
        formatted: null,
        country: null,
        error: 'Número no válido para el país seleccionado'
      };
    }

    return {
      isValid: true,
      formatted: phoneNumber.format('E.164'),
      country: phoneNumber.country || null
    };
  } catch {
    return {
      isValid: false,
      formatted: null,
      country: null,
      error: 'Número inválido'
    };
  }
}

export function formatStoredPhone(phoneRaw: string): string {
  try {
    const cleaned = phoneRaw.replace(/\s/g, '');
    const withPlus = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
    const parsed = parsePhoneNumber(withPlus);
    if (parsed && parsed.isValid()) {
      return parsed.format('E.164');
    }
    return withPlus;
  } catch {
    return phoneRaw.startsWith('+') ? phoneRaw : `+${phoneRaw}`;
  }
}

export const SUPPORTED_COUNTRIES: {
  code: CountryCode;
  name: string;
  flag: string;
  dialCode: string;
  placeholder: string;
}[] = [
  { code: 'MX', name: 'México', flag: '🇲🇽', dialCode: '+52', placeholder: '55 1234 5678' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷', dialCode: '+506', placeholder: '8888 8888' },
  { code: 'DO', name: 'Rep. Dominicana', flag: '🇩🇴', dialCode: '+1', placeholder: '809 555 1234' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', dialCode: '+56', placeholder: '9 8765 4321' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', dialCode: '+54', placeholder: '11 5555 5555' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', dialCode: '+57', placeholder: '310 123 4567' },
];
