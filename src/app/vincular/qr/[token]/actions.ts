'use server';

import { procesarUsoVinculoQr } from '@/lib/vinculo-qr';

export interface VincularQrActionParams {
  token: string;
  userId: string;
  userEmail: string;
  contactName?: string;
  contactPhone?: string;
}

export async function vincularContactoQrAction({
  token,
  userId,
  userEmail,
  contactName,
  contactPhone,
}: VincularQrActionParams) {
  if (!token || !userId || !userEmail) {
    return {
      ok: false,
      mensaje: 'Faltan parámetros obligatorios para completar el vínculo.',
    };
  }

  const result = await procesarUsoVinculoQr({
    token,
    userId,
    userEmail,
    contactNameOverride: contactName,
    contactPhoneOverride: contactPhone,
  });

  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      mensaje: result.mensaje || 'Error al procesar la vinculación.',
    };
  }

  return {
    ok: true,
    rider_nombre: result.rider_nombre,
    rider_photo_url: result.rider_photo_url,
    ya_vinculado: result.ya_vinculado,
  };
}
