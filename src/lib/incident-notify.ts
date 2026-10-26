import nodemailer from "nodemailer";
import twilio from "twilio";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatStoredPhone } from "@/lib/phone-utils";
import { intentarPush } from "@/lib/push-notify";

interface ContactoEmergencia {
  name?: string;
  phone?: string;
  email?: string;
  relationship?: string;
}

interface Destinatario {
  name: string;
  email: string | null;
  phone: string | null;
}

export interface NotificarActualizacionIncidenteParams {
  profileId: string;
  excluirEmail?: string | null;
  titulo: string;
  cuerpo: string;
  smsTexto: string;
  emailAsunto: string;
  emailTexto: string;
  data: Record<string, string>;
}

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function resolverNombreActor(
  userId: string | null,
  profileId: string
): Promise<string> {
  if (!userId) return "Un contacto";

  try {
    const supabaseAdmin = createAdminClient();

    // 1. Si existe contact_invitations aceptada
    const { data: invitation } = await supabaseAdmin
      .from("contact_invitations")
      .select("contact_name")
      .eq("inviter_profile_id", profileId)
      .eq("linked_user_id", userId)
      .eq("status", "accepted")
      .maybeSingle();

    let fullName = invitation?.contact_name;

    // 2. Si no, profiles.full_name donde user_id = userId
    if (!fullName) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("user_id", userId)
        .maybeSingle();
      fullName = profile?.full_name;
    }

    if (!fullName || !fullName.trim()) {
      return "Un contacto";
    }

    const primerNombre = fullName.trim().split(/\s+/)[0];
    return primerNombre || "Un contacto";
  } catch (err: unknown) {
    console.error("[incident-notify] Error resolviendo nombre de actor:", err);
    return "Un contacto";
  }
}

export async function notificarActualizacionIncidente(
  params: NotificarActualizacionIncidenteParams
): Promise<void> {
  const {
    profileId,
    excluirEmail,
    titulo,
    cuerpo,
    smsTexto,
    emailAsunto,
    emailTexto,
    data,
  } = params;

  try {
    const supabaseAdmin = createAdminClient();

    // 1. Obtener perfil
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("id, user_id, full_name, emergency_contacts, phone")
      .eq("id", profileId)
      .maybeSingle();

    if (profileErr || !profile) {
      console.error("[incident-notify] Perfil no encontrado:", profileId, profileErr);
      return;
    }

    // 2. Obtener correo del dueño desde auth.users
    let ownerEmail: string | null = null;
    if (profile.user_id) {
      try {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(profile.user_id);
        ownerEmail = userData?.user?.email ?? null;
      } catch (authErr: unknown) {
        console.error("[incident-notify] Error obteniendo auth.users:", authErr);
      }
    }

    // 3. Compilar destinatarios: contactos + dueño
    const destinatarios: Destinatario[] = [];

    // Dueño del perfil
    if (ownerEmail || profile.phone) {
      destinatarios.push({
        name: profile.full_name || "Rider",
        email: ownerEmail ? ownerEmail.trim() : null,
        phone: profile.phone ? profile.phone.trim() : null,
      });
    }

    // Contactos de emergencia
    const rawContacts = Array.isArray(profile.emergency_contacts)
      ? (profile.emergency_contacts as ContactoEmergencia[])
      : [];

    for (const c of rawContacts) {
      const email = c.email && typeof c.email === "string" && c.email.trim() ? c.email.trim() : null;
      const phone = c.phone && typeof c.phone === "string" && c.phone.trim() ? c.phone.trim() : null;
      if (email || phone) {
        destinatarios.push({
          name: c.name || "Contacto",
          email,
          phone,
        });
      }
    }

    // 4. Filtrar excluirEmail (quien hizo la acción)
    const emailExcluirNormalizado = excluirEmail ? excluirEmail.trim().toLowerCase() : null;
    const destinatariosFiltrados = destinatarios.filter((d) => {
      if (!emailExcluirNormalizado || !d.email) return true;
      return d.email.toLowerCase() !== emailExcluirNormalizado;
    });

    // Deduplicar contactos idénticos por email y/o teléfono
    const vistos = new Set<string>();
    const unicos = destinatariosFiltrados.filter((d) => {
      const key = `${d.email?.toLowerCase() ?? ""}|${d.phone ?? ""}`;
      if (vistos.has(key)) return false;
      vistos.add(key);
      return true;
    });

    // 5. Enviar notificaciones en paralelo con Promise.allSettled
    await Promise.allSettled(
      unicos.map(async (dest) => {
        // A) Correo SIEMPRE
        const envioCorreo = (async () => {
          if (!dest.email) return;
          try {
            await transporter.sendMail({
              from: "RescueChip <contacto@rescue-chip.com>",
              replyTo: "contacto@rescue-chip.com",
              to: dest.email,
              subject: emailAsunto,
              text: emailTexto,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px;">
                  <h2 style="color: #166534; margin-top: 0;">${titulo}</h2>
                  <p style="font-size: 16px; line-height: 1.5; color: #1f2937;">${emailTexto}</p>
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                  <p style="font-size: 13px; color: #6b7280; margin: 0;">
                    RescueChip — Sistema de identificación médica y alertas prehospitalarias.
                  </p>
                </div>
              `,
            });
          } catch (mailErr: unknown) {
            console.error(`[incident-notify] Error enviando correo a ${dest.email}:`, mailErr);
          }
        })();

        // B) Push, y SMS SOLO si la push regresó false y hay teléfono
        const envioPushSms = (async () => {
          let pushExitosa = false;
          try {
            pushExitosa = await intentarPush(
              { email: dest.email ?? undefined, phone: dest.phone ?? undefined },
              titulo,
              cuerpo,
              data,
              profileId
            );
          } catch (pushErr: unknown) {
            console.error(`[incident-notify] Error enviando push a ${dest.name}:`, pushErr);
            pushExitosa = false;
          }

          if (!pushExitosa && dest.phone) {
            try {
              const formatted = formatStoredPhone(dest.phone);
              await twilioClient.messages.create({
                body: smsTexto,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: formatted,
              });
            } catch (smsErr: unknown) {
              console.error(`[incident-notify] Error enviando SMS a ${dest.phone}:`, smsErr);
            }
          }
        })();

        await Promise.allSettled([envioCorreo, envioPushSms]);
      })
    );
  } catch (err: unknown) {
    console.error("[incident-notify] Error general en notificarActualizacionIncidente:", err);
  }
}
