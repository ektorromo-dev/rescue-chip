export const EMAIL_REQUIRED_FROM = '2026-10-22T00:00:00-06:00';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmailRequired(profileCreatedAt: string | null | undefined): boolean {
  if (!profileCreatedAt) return true;
  const createdTime = new Date(profileCreatedAt).getTime();
  const cutoffTime = new Date(EMAIL_REQUIRED_FROM).getTime();
  if (isNaN(createdTime)) return true;
  return createdTime >= cutoffTime;
}

export function validateEmergencyContacts(
  contacts: { name?: string; phone?: string; email?: string }[],
  opts: { requireEmail: boolean; country?: string }
): { ok: true } | { ok: false; error: string } {
  if (!Array.isArray(contacts) || contacts.length === 0) {
    return { ok: false, error: 'Debes proporcionar al menos un contacto de emergencia.' };
  }

  let completeContactsCount = 0;

  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    const contactNum = i + 1;

    const name = (contact?.name || '').trim();
    const phone = (contact?.phone || '').trim();
    const email = (contact?.email || '').trim();

    // Un slot con name, phone y email todos vacíos (tras trim) se ignora.
    if (!name && !phone && !email) {
      continue;
    }

    // Todo slot con algún campo lleno exige nombre y teléfono.
    if (!name) {
      return { ok: false, error: `Contacto ${contactNum}: falta el nombre.` };
    }

    if (!phone) {
      return { ok: false, error: `Contacto ${contactNum}: falta el teléfono.` };
    }

    // Teléfono: 10 dígitos si country es 'MX' o viene vacío/undefined; 8 para cualquier otro país.
    const minDigits = !opts.country || opts.country.trim() === '' || opts.country.trim().toUpperCase() === 'MX' ? 10 : 8;
    const digits = phone.replace(/\D/g, '');
    if (digits.length < minDigits) {
      return { ok: false, error: `Contacto ${contactNum}: el teléfono debe tener al menos ${minDigits} dígitos.` };
    }

    // El correo se exige solo si opts.requireEmail es true.
    if (opts.requireEmail && !email) {
      return { ok: false, error: `Contacto ${contactNum}: falta el correo electrónico.` };
    }

    // Correo: si viene escrito (sea o no obligatorio), debe tener formato válido.
    if (email && !EMAIL_REGEX.test(email)) {
      return { ok: false, error: `Contacto ${contactNum}: el correo electrónico no es válido.` };
    }

    completeContactsCount++;
  }

  // Debe haber al menos 1 contacto completo.
  if (completeContactsCount === 0) {
    return { ok: false, error: 'Debes proporcionar al menos un contacto de emergencia.' };
  }

  return { ok: true };
}
