import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import twilio from 'twilio';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

const formatMexicanPhone = (phoneRaw: string): string => {
  let phone = phoneRaw.replace(/\D/g, '');
  if (phone.length === 12 && phone.startsWith('52')) {
    return `+${phone}`;
  } else if (phone.length === 10) {
    return `+52${phone}`;
  } else if (!phone.startsWith('+52')) {
    return `+52${phone}`;
  }
  return `+${phone}`;
};

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
    }

    // 1. Buscar incidente
    const { data: incidente, error: fetchError } = await supabaseAdmin
      .from('incidentes')
      .select('id, expires_at, profile_id, chip_folio, familiar_en_camino')
      .eq('token', token)
      .single();

    if (fetchError || !incidente) {
      return NextResponse.json({ error: 'Incidente no encontrado' }, { status: 404 });
    }

    if (new Date(incidente.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Incidente expirado' }, { status: 410 });
    }

    // Si ya se marcó antes, no notificar de nuevo (evitar spam)
    if (incidente.familiar_en_camino) {
      return NextResponse.json({ ok: true, already: true });
    }

    // 2. Marcar en camino
    const { error: updateError } = await supabaseAdmin
      .from('incidentes')
      .update({
        familiar_en_camino: true,
        familiar_en_camino_at: new Date().toISOString(),
      })
      .eq('id', incidente.id);

    if (updateError) {
      console.error('Error actualizando incidente:', updateError);
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }

    // 3. Si hay perfil, notificar a contactos + accidentado
    if (incidente.profile_id) {
      const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('user_id, full_name, emergency_contacts, phone')
        .eq('id', incidente.profile_id)
        .single();

      if (profileData) {
        const userName = profileData.full_name || 'Usuario';
        const contacts: { name?: string; email?: string; phone?: string }[] =
          profileData.emergency_contacts || [];

        // Obtener datos del dueño (accidentado) desde Auth
        let ownerEmail: string | null = null;
        let ownerPhone: string | null = null;

        if (profileData.user_id) {
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(
            profileData.user_id
          );
          if (userData?.user) {
            ownerEmail = userData.user.email ?? null;
            ownerPhone = userData.user.phone ?? null;
          }
        }

        // Si tiene phone en profiles, usarlo también
        if (profileData.phone && !ownerPhone) {
          ownerPhone = profileData.phone;
        }

        // ── EMAILS ────────────────────────────────
        const contactEmails = contacts
          .filter((c) => c.email && c.email.trim() !== '')
          .map((c) => c.email!.trim());

        const allEmails = Array.from(
          new Set([...(ownerEmail ? [ownerEmail] : []), ...contactEmails])
        );

        console.log(`[En camino DEBUG] ownerEmail: ${ownerEmail}, contactEmails: ${JSON.stringify(contactEmails)}, allEmails: ${JSON.stringify(allEmails)}, profilePhone: ${profileData.phone}, contacts: ${JSON.stringify(contacts)}`);
        if (allEmails.length > 0) {
          const emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #166534; border-radius: 10px;">
              <h2 style="color: #166534; margin-top: 0; text-align: center;">✅ Un familiar va en camino</h2>
              <p style="font-size: 16px; text-align: center;">
                Un contacto de emergencia de <strong>${userName}</strong> confirmó que ya va en camino al lugar del incidente.
              </p>
              <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <p style="color: #166534; font-size: 15px; margin: 0;">
                  Folio del chip: <strong>${incidente.chip_folio}</strong>
                </p>
              </div>
              <p style="color: #555; font-size: 14px; text-align: center;">
                Si necesitas ayuda, llama al 911 o contacta a:<br/>
                <a href="mailto:contacto@rescue-chip.com" style="color: #166534; font-weight: bold;">contacto@rescue-chip.com</a>
              </p>
            </div>
          `;

          try {
            await transporter.sendMail({
              from: 'RescueChip <contacto@rescue-chip.com>',
              replyTo: 'contacto@rescue-chip.com',
              to: allEmails.join(', '),
              subject: '✅ Un familiar va en camino — RescueChip',
              html: emailHtml,
            });
            console.log(`[En camino] Email enviado a: ${allEmails.join(', ')}`);
          } catch (mailError) {
            console.error('[En camino] Error enviando email:', mailError);
          }
        }

        // ── SMS ───────────────────────────────────
        const contactPhones = contacts
          .filter((c) => c.phone && c.phone.trim() !== '')
          .map((c) => c.phone!.trim());

        const allPhones = Array.from(
          new Set([...(ownerPhone ? [ownerPhone] : []), ...contactPhones])
        );

        const smsBody = `✅ RescueChip: Un familiar de ${userName} confirmó que ya va en camino al lugar del incidente.`;

        console.log(`[En camino DEBUG] ownerPhone: ${ownerPhone}, contactPhones: ${JSON.stringify(contactPhones)}, allPhones: ${JSON.stringify(allPhones)}`);
        const smsPromises = allPhones.map(async (rawPhone) => {
          const formatted = formatMexicanPhone(rawPhone);
          try {
            await twilioClient.messages.create({
              body: smsBody,
              from: process.env.TWILIO_PHONE_NUMBER,
              to: formatted,
            });
            console.log(`[En camino SMS] Enviado a ${formatted}`);
          } catch (smsError: any) {
            console.error(`[En camino SMS Error] ${formatted}:`, smsError.message);
          }
        });

        await Promise.all(smsPromises);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('en-camino error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
