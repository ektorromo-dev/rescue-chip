import { parsePhoneNumber, isValidPhoneNumber, AsYouType } from 'libphonenumber-js';
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
    const cleanInput = phoneInput.replace(/[-\s().]/g, '');
    const phoneNumber = parsePhoneNumber(cleanInput, countryCode);

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
  maxDigits: number;
}[] = [
  { code: 'MX', name: 'México', flag: '🇲🇽', dialCode: '+52', placeholder: '55 1234 5678', maxDigits: 10 },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', dialCode: '+1', placeholder: '555 123 4567', maxDigits: 10 },
  { code: 'CA', name: 'Canadá', flag: '🇨🇦', dialCode: '+1', placeholder: '555 123 4567', maxDigits: 10 },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷', dialCode: '+506', placeholder: '8888 8888', maxDigits: 8 },
  { code: 'DO', name: 'Rep. Dominicana', flag: '🇩🇴', dialCode: '+1', placeholder: '809 555 1234', maxDigits: 10 },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', dialCode: '+56', placeholder: '9 8765 4321', maxDigits: 9 },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', dialCode: '+57', placeholder: '310 123 4567', maxDigits: 10 },
];

export function formatPhoneAsYouType(input: string, countryCode: CountryCode): string {
  const digits = input.replace(/\D/g, '');
  const formatter = new AsYouType(countryCode);
  return formatter.input(digits);
}
