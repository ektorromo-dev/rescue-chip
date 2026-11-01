import type { Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import type { Twilio } from 'twilio';
import { formatStoredPhone } from '@/lib/phone-utils';

export function maskEmail(email: string): string {
  const atIndex = email.indexOf('@');
  if (atIndex === -1) {
    const visible = email.slice(0, Math.min(2, email.length));
    return `${visible}***`;
  }
  const name = email.slice(0, atIndex);
  const domain = email.slice(atIndex);
  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}***${domain}`;
}

export function maskPhone(phone: string): string {
  const clean = phone.trim();
  if (clean.length <= 4) return clean;
  return `***${clean.slice(-4)}`;
}

export interface EnviarCorreosIndividualesParams {
  transporter: Transporter<SMTPTransport.SentMessageInfo>;
  destinatarios: string[];
  asunto: string;
  html: string;
  etiqueta: string;
}

export interface EnviarSmsATodosParams {
  twilioClient: Twilio;
  destinatarios: { phone: string }[];
  cuerpo: string;
  etiqueta: string;
}

export async function enviarCorreosIndividuales({
  transporter,
  destinatarios,
  asunto,
  html,
  etiqueta,
}: EnviarCorreosIndividualesParams): Promise<PromiseSettledResult<SMTPTransport.SentMessageInfo>[]> {
  // Deduplicación sin distinguir mayúsculas
  const uniqueDestinatarios: string[] = [];
  const seen = new Set<string>();

  for (const email of destinatarios) {
    const trimmed = email.trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      uniqueDestinatarios.push(trimmed);
    }
  }

  const envios = uniqueDestinatarios.map(async (destinatario) => {
    const masked = maskEmail(destinatario);
    try {
      const info = await transporter.sendMail({
        from: 'RescueChip <contacto@rescue-chip.com>',
        replyTo: 'contacto@rescue-chip.com',
        to: destinatario,
        subject: asunto,
        html,
      });

      const isRejected = Array.isArray(info.rejected) && info.rejected.length > 0;
      const resultado = isRejected ? `rejected (${info.rejected.join(', ')})` : 'accepted';
      console.log(`[${etiqueta}] Email a ${masked}: ${resultado}`);
      return info;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log(`[${etiqueta}] Email a ${masked}: ${errorMsg}`);
      throw error;
    }
  });

  return Promise.allSettled(envios);
}

export async function enviarSmsATodos({
  twilioClient,
  destinatarios,
  cuerpo,
  etiqueta,
}: EnviarSmsATodosParams): Promise<PromiseSettledResult<unknown>[]> {
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!fromNumber) {
    console.error(`[${etiqueta}] TWILIO_PHONE_NUMBER no configurado en variables de entorno.`);
    return [];
  }

  // Normaliza cada teléfono con formatStoredPhone y elimina duplicados por el número normalizado
  const uniquePhones: string[] = [];
  const seenPhones = new Set<string>();

  for (const dest of destinatarios) {
    if (!dest.phone || !dest.phone.trim()) continue;
    const normalized = formatStoredPhone(dest.phone.trim());
    if (normalized && !seenPhones.has(normalized)) {
      seenPhones.add(normalized);
      uniquePhones.push(normalized);
    }
  }

  const envios = uniquePhones.map(async (phone) => {
    const masked = maskPhone(phone);
    try {
      const message = await twilioClient.messages.create({
        body: cuerpo,
        from: fromNumber,
        to: phone,
      });

      console.log(`[${etiqueta}] SMS a ${masked}: sid=${message.sid} status=${message.status}`);
      return message;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorCode =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code: unknown }).code)
          : undefined;

      const codeStr = errorCode ? ` code=${errorCode}` : '';
      console.log(`[${etiqueta}] SMS a ${masked}: error=${errorMsg}${codeStr}`);
      throw error;
    }
  });

  return Promise.allSettled(envios);
}
