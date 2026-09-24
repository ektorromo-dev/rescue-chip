import { randomBytes } from 'crypto';
import nodemailer from 'nodemailer';
import { createAdminClient } from '@/lib/supabase/admin';

export const INVITATIONS_ENABLED = process.env.INVITATIONS_ENABLED === 'true';
export const NEXT_PUBLIC_INVITATIONS_ENABLED = process.env.NEXT_PUBLIC_INVITATIONS_ENABLED === 'true';

export interface EmergencyContactItem {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  [key: string]: unknown;
}

export interface ContactInvitationRecord {
  id: string;
  inviter_profile_id: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  token: string;
  status: 'pending' | 'accepted' | 'cancelled' | 'expired';
  expires_at: string | null;
  linked_user_id: string | null;
  accepted_at: string | null;
  created_at?: string;
}

function generarTokenInvitacion(): string {
  return randomBytes(16).toString('hex');
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

/**
 * Envía el correo de invitación al contacto.
 * Exportado para reusarse tanto en la creación inicial como en el reenvío.
 */
export async function sendInvitationEmail(invitationId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();

    const { data: invitation, error: inviteError } = await supabase
      .from('contact_invitations')
      .select('id, inviter_profile_id, contact_name, contact_email, token')
      .eq('id', invitationId)
      .maybeSingle<ContactInvitationRecord>();

    if (inviteError || !invitation || !invitation.contact_email) {
      console.warn(`[contact-invitations] No se encontró invitación o correo para id: ${invitationId}`);
      return false;
    }

    let riderFullName = 'Un motociclista';
    if (invitation.inviter_profile_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', invitation.inviter_profile_id)
        .maybeSingle();

      if (profile?.full_name?.trim()) {
        riderFullName = profile.full_name.trim();
      }
    }

    const primerNombreRider = riderFullName.split(' ')[0] || riderFullName;
    const vincularUrl = `https://rescue-chip.com/vincular/${invitation.token}`;
    const appDownloadUrl = process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL?.trim();

    const emailHtml = `
      <div style="background-color: #0D0D0C; color: #F4F0EB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 32px 16px; margin: 0;">
        <div style="max-width: 560px; margin: 0 auto; background-color: #141412; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.4);">
          
          <!-- Encabezado de Marca -->
          <div style="padding: 28px 32px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); text-align: center;">
            <span style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
              <span style="color: #F4F0EB;">RESCUE</span><span style="color: #E8231A;">CHIP</span>
            </span>
          </div>

          <!-- Contenido Principal -->
          <div style="padding: 32px 32px 24px;">
            <h1 style="color: #F4F0EB; font-size: 20px; font-weight: 700; line-height: 1.4; margin: 0 0 16px; text-align: center;">
              ${riderFullName} te agregó como contacto de emergencia en RescueChip.
            </h1>
            
            <p style="color: #D4D0CA; font-size: 15px; line-height: 1.6; margin: 0 0 28px; text-align: center;">
              Si su chip es escaneado en un accidente, serás de las primeras personas en saberlo, con su ubicación y los pasos exactos a seguir.
            </p>

            <!-- Botón Principal -->
            <div style="text-align: center; margin: 0 0 32px;">
              <a href="${vincularUrl}" target="_blank" rel="noopener noreferrer"
                 style="display: inline-block; background-color: #E8231A; color: #FFFFFF; font-size: 16px; font-weight: 700; padding: 14px 32px; border-radius: 10px; text-decoration: none; letter-spacing: 0.3px; box-shadow: 0 2px 10px rgba(232,35,26,0.3);">
                Confirmar mi vínculo
              </a>
            </div>

            <!-- Bloque Secundario App -->
            <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 12px;">
              <p style="color: #9E9A95; font-size: 14px; line-height: 1.5; margin: 0 0 14px;">
                Para recibir las alertas al instante, descarga la app de RescueChip e inicia sesión con este mismo correo.
              </p>
              ${
                appDownloadUrl
                  ? `<a href="${appDownloadUrl}" target="_blank" rel="noopener noreferrer"
                        style="display: inline-block; background-color: #1E1E1C; color: #F4F0EB; border: 1px solid rgba(255,255,255,0.12); font-size: 13px; font-weight: 600; padding: 10px 20px; border-radius: 8px; text-decoration: none;">
                       Descargar la app
                     </a>`
                  : `<span style="display: inline-block; color: #6E6A65; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
                       Muy pronto en Google Play y App Store
                     </span>`
              }
            </div>
          </div>

          <!-- Footer Legal -->
          <div style="background-color: #0F0F0E; padding: 20px 24px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center;">
            <p style="font-size: 11px; color: #6A6763; line-height: 1.6; max-width: 420px; margin: 0 auto 10px;">
              <strong style="color: #9E9A95;">RESCUECHIP</strong> es un sistema de identificación prehospitalaria de emergencia. No sustituye servicios de emergencia. Llame al <strong style="color: #E8231A;">911</strong> ante cualquier emergencia.
            </p>
            <p style="font-size: 11px; color: #9E9A95; margin: 0;">
              <a href="https://rescue-chip.com/terminos" target="_blank" rel="noopener noreferrer" style="color: #9E9A95; text-decoration: underline;">Términos</a>
              <span style="color: #4A4744;"> &bull; </span>
              <a href="https://rescue-chip.com/privacidad" target="_blank" rel="noopener noreferrer" style="color: #9E9A95; text-decoration: underline;">Privacidad</a>
            </p>
          </div>

        </div>
      </div>
    `;

    const transporter = getTransporter();
    await transporter.sendMail({
      from: 'RescueChip <contacto@rescue-chip.com>',
      replyTo: 'contacto@rescue-chip.com',
      to: invitation.contact_email,
      subject: `${primerNombreRider} te eligió como su contacto de emergencia`,
      html: emailHtml,
    });

    console.log(`[contact-invitations] Correo de invitación enviado a ${invitation.contact_email}`);
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[contact-invitations] Error enviando correo de invitación:`, msg);
    return false;
  }
}

/**
 * Sincroniza las invitaciones de contacto del rider con base en la lista actual de emergency_contacts.
 * Crea nuevas invitaciones para contactos nuevos.
 * Cancela ('cancelled', linked_user_id = null) invitaciones de contactos eliminados o modificados.
 * NUNCA bloquea el guardado del perfil en caso de error.
 */
export async function syncContactInvitations(
  profileId: string,
  riderName: string,
  contacts: EmergencyContactItem[]
): Promise<void> {
  if (!profileId) return;

  try {
    const supabase = createAdminClient();

    // 1. Obtener todas las invitaciones actuales del rider ('pending' o 'accepted')
    const { data: existingInvites, error: fetchError } = await supabase
      .from('contact_invitations')
      .select('id, contact_name, contact_phone, contact_email, status, linked_user_id, token')
      .eq('inviter_profile_id', profileId)
      .in('status', ['pending', 'accepted']);

    if (fetchError) {
      console.error('[contact-invitations] Error obteniendo invitaciones existentes:', fetchError);
      return;
    }

    const currentInvites = (existingInvites as ContactInvitationRecord[]) || [];
    const matchedInviteIds = new Set<string>();

    // 2. Procesar cada contacto entrante
    if (Array.isArray(contacts)) {
      for (const contacto of contacts) {
        try {
          const rawPhone = contacto.phone ? String(contacto.phone).trim() : null;
          const rawEmail = contacto.email ? String(contacto.email).trim() : null;
          const contactName = contacto.name ? String(contacto.name).trim() : null;

          if (!rawPhone && !rawEmail) continue;

          // Buscar coincidencia en las invitaciones existentes por teléfono O email
          const matchingInvite = currentInvites.find((inv) => {
            const phoneMatch = rawPhone && inv.contact_phone && inv.contact_phone.trim() === rawPhone;
            const emailMatch = rawEmail && inv.contact_email && inv.contact_email.trim().toLowerCase() === rawEmail.toLowerCase();
            return phoneMatch || emailMatch;
          });

          if (matchingInvite) {
            matchedInviteIds.add(matchingInvite.id);
            // Si el nombre cambió, actualizamos suavemente el nombre del contacto
            if (contactName && contactName !== matchingInvite.contact_name) {
              await supabase
                .from('contact_invitations')
                .update({ contact_name: contactName })
                .eq('id', matchingInvite.id);
            }
          } else {
            // No existe invitación previa → Insertar nueva con token de 16 bytes y expiración a 7 días
            const token = generarTokenInvitacion();
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

            const { data: newInvite, error: insertError } = await supabase
              .from('contact_invitations')
              .insert({
                inviter_profile_id: profileId,
                contact_name: contactName,
                contact_phone: rawPhone,
                contact_email: rawEmail,
                token,
                status: 'pending',
                expires_at: expiresAt,
              })
              .select('id')
              .single();

            if (insertError) {
              console.error('[contact-invitations] Error creando invitación:', insertError);
            } else if (newInvite?.id) {
              matchedInviteIds.add(newInvite.id);

              // Si tiene email y las invitaciones están habilitadas → enviar correo fire & forget
              if (rawEmail && INVITATIONS_ENABLED) {
                sendInvitationEmail(newInvite.id).catch((emailErr) => {
                  console.error('[contact-invitations] Error fire & forget en sendInvitationEmail:', emailErr);
                });
              }
            }
          }
        } catch (contactErr) {
          console.error('[contact-invitations] Error procesando contacto en bucle:', contactErr);
        }
      }
    }

    // 3. Cancelar invitaciones previas ('pending' o 'accepted') que ya no coincidan con ningún contacto actual
    const invitesToCancel = currentInvites.filter((inv) => !matchedInviteIds.has(inv.id));
    for (const invite of invitesToCancel) {
      try {
        const { error: cancelError } = await supabase
          .from('contact_invitations')
          .update({
            status: 'cancelled',
            linked_user_id: null,
          })
          .eq('id', invite.id);

        if (cancelError) {
          console.error(`[contact-invitations] Error cancelando invitación ${invite.id}:`, cancelError);
        } else {
          console.log(`[contact-invitations] Invitación ${invite.id} cancelada al ser removida de los contactos.`);
        }
      } catch (cancelErr) {
        console.error(`[contact-invitations] Excepción cancelando invitación ${invite.id}:`, cancelErr);
      }
    }
  } catch (err: unknown) {
    console.error('[contact-invitations] Error general en syncContactInvitations:', err);
  }
}
