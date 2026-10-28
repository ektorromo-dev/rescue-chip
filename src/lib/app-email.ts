import { randomInt, createHash } from "crypto";
import nodemailer from "nodemailer";
import { escapeHtml } from "@/lib/escape-html";

export function generarCodigo6Digitos(): string {
  return String(randomInt(0, 1000000)).padStart(6, "0");
}

export function hashCodigo(codigo: string): string {
  return createHash("sha256").update(codigo.trim()).digest("hex");
}

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function enviarCodigoVerificacionEmail(
  email: string,
  codigo: string,
  proposito: "registro" | "dispositivo"
): Promise<boolean> {
  try {
    const transporter = getTransporter();
    const safeCodigo = escapeHtml(codigo);

    let subject = "";
    let text = "";
    let htmlContent = "";

    if (proposito === "registro") {
      subject = `Tu código de RescueChip: ${codigo}`;
      text = `Tu código para crear tu cuenta es ${codigo}. Vence en 10 minutos. Si no lo pediste, ignora este correo.`;
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px; background-color: #0D0D0C; color: #F4F0EB; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
              <span style="color: #F4F0EB;">RESCUE</span><span style="color: #E8231A;">CHIP</span>
            </span>
          </div>
          <h2 style="font-size: 20px; font-weight: 700; color: #F4F0EB; margin-top: 0; text-align: center;">Código de verificación</h2>
          <p style="font-size: 15px; line-height: 1.5; color: #D4D0CA; text-align: center;">
            Tu código para crear tu cuenta es:
          </p>
          <div style="background-color: #1A1A18; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 18px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #E8231A;">${safeCodigo}</span>
          </div>
          <p style="font-size: 13px; color: #9E9A95; text-align: center; margin: 0;">
            Vence en 10 minutos. Si no lo pediste, ignora este correo.
          </p>
        </div>
      `;
    } else {
      subject = `Código para entrar en un dispositivo nuevo: ${codigo}`;
      text = `Alguien inició sesión en tu cuenta de RescueChip desde un celular nuevo. Si fuiste tú, tu código es ${codigo} (vence en 10 minutos). Si no fuiste tú, cambia tu contraseña de inmediato.`;
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px; background-color: #0D0D0C; color: #F4F0EB; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
              <span style="color: #F4F0EB;">RESCUE</span><span style="color: #E8231A;">CHIP</span>
            </span>
          </div>
          <h2 style="font-size: 20px; font-weight: 700; color: #F4F0EB; margin-top: 0; text-align: center;">Nuevo dispositivo detectado</h2>
          <p style="font-size: 15px; line-height: 1.5; color: #D4D0CA; text-align: center;">
            Alguien inició sesión en tu cuenta de RescueChip desde un celular nuevo. Si fuiste tú, tu código es:
          </p>
          <div style="background-color: #1A1A18; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 18px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #E8231A;">${safeCodigo}</span>
          </div>
          <p style="font-size: 13px; color: #9E9A95; text-align: center; margin: 0;">
            Vence en 10 minutos. Si no fuiste tú, cambia tu contraseña de inmediato.
          </p>
        </div>
      `;
    }

    await transporter.sendMail({
      from: "RescueChip <contacto@rescue-chip.com>",
      replyTo: "contacto@rescue-chip.com",
      to: email,
      subject,
      text,
      html: htmlContent,
    });

    return true;
  } catch (err: unknown) {
    console.error("[app-email] Error enviando correo de código:", err);
    return false;
  }
}
