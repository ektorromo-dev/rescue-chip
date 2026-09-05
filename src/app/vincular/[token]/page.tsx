import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import VincularClient from './VincularClient';
import { AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Contacto de Emergencia — RescueChip',
    description: 'Acepta la invitación para ser contacto de emergencia en RescueChip.',
    robots: 'noindex, nofollow',
  };
}

interface PageProps {
  params: Promise<{ token: string }>;
}

function StatusCard({
  icon,
  title,
  message,
  badgeText,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  badgeText?: string;
}) {
  return (
    <div style={{ width: '100%', maxWidth: '440px' }}>
      <div
        style={{
          backgroundColor: '#131311',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '40px 32px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
          }}
        >
          {icon}
        </div>

        {badgeText && (
          <span
            style={{
              display: 'inline-block',
              backgroundColor: 'rgba(232,35,26,0.12)',
              border: '1px solid rgba(232,35,26,0.3)',
              color: '#E8231A',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              borderRadius: '999px',
              padding: '4px 12px',
              marginBottom: '14px',
            }}
          >
            {badgeText}
          </span>
        )}

        <h1
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#F4F0EB',
            marginBottom: '12px',
            lineHeight: 1.3,
          }}
        >
          {title}
        </h1>

        <p
          style={{
            fontSize: '15px',
            color: '#9E9A95',
            lineHeight: 1.6,
            marginBottom: '28px',
          }}
        >
          {message}
        </p>

        <Link
          href="/"
          style={{
            display: 'inline-block',
            backgroundColor: '#1A1A18',
            color: '#F4F0EB',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Ir al inicio
        </Link>
      </div>

      {/* Banner discreto */}
      <div
        style={{
          marginTop: '20px',
          backgroundColor: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px',
          padding: '16px 20px',
          textAlign: 'center',
        }}
      >
        <p style={{ margin: 0, fontSize: '13px', color: '#9E9A95', lineHeight: 1.5 }}>
          ¿Tú también quieres estar protegido con RescueChip?{' '}
          <Link
            href="/#precios"
            style={{
              color: '#E8231A',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Consigue el tuyo &rarr;
          </Link>
        </p>
      </div>
    </div>
  );
}

export default async function VincularPage({ params }: PageProps) {
  const { token } = await params;

  if (!token || typeof token !== 'string') {
    return (
      <PageLayout>
        <StatusCard
          icon={<AlertCircle size={28} color="#E8231A" />}
          title="Link no válido"
          message="Este link no es válido."
        />
      </PageLayout>
    );
  }

  const supabase = createAdminClient();

  const { data: invitation, error: inviteError } = await supabase
    .from('contact_invitations')
    .select('id, inviter_profile_id, contact_name, contact_email, status, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (inviteError || !invitation) {
    return (
      <PageLayout>
        <StatusCard
          icon={<AlertCircle size={28} color="#E8231A" />}
          title="Link no válido"
          message="Este link no es válido."
        />
      </PageLayout>
    );
  }

  // Obtener nombre del rider asociado
  let riderName = 'El motociclista';
  if (invitation.inviter_profile_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', invitation.inviter_profile_id)
      .maybeSingle();

    if (profile?.full_name && profile.full_name.trim()) {
      riderName = profile.full_name.trim();
    }
  }

  // 1. Caso: Invitación ya aceptada
  if (invitation.status === 'accepted') {
    return (
      <PageLayout>
        <StatusCard
          icon={<CheckCircle2 size={28} color="#22c55e" />}
          title="Invitación ya aceptada"
          message="Esta invitación ya fue aceptada anteriormente."
          badgeText="Completado"
        />
      </PageLayout>
    );
  }

  // 2. Caso: Invitación cancelada
  if (invitation.status === 'cancelled') {
    return (
      <PageLayout>
        <StatusCard
          icon={<XCircle size={28} color="#ef4444" />}
          title="Invitación no disponible"
          message={`Esta invitación ya no está disponible. Contacta a ${riderName} para un nuevo link.`}
          badgeText="Cancelada"
        />
      </PageLayout>
    );
  }

  // 3. Caso: Expiración
  const isExpired =
    invitation.status === 'expired' ||
    (Boolean(invitation.expires_at) && new Date(invitation.expires_at) < new Date());

  if (isExpired) {
    if (invitation.status !== 'expired') {
      await supabase
        .from('contact_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);
    }

    return (
      <PageLayout>
        <StatusCard
          icon={<Clock size={28} color="#f59e0b" />}
          title="Link expirado"
          message={`Este link expiró. Contacta a ${riderName} para uno nuevo.`}
          badgeText="Expirado"
        />
      </PageLayout>
    );
  }

  // 4. Caso: Pending (activo)
  return (
    <PageLayout>
      <VincularClient
        token={token}
        riderName={riderName}
        contactEmail={invitation.contact_email}
        contactName={invitation.contact_name}
      />
    </PageLayout>
  );
}

function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0A0A08',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Logo */}
      <Link href="/" style={{ marginBottom: '36px', textDecoration: 'none' }}>
        <span style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' }}>
          <span style={{ color: '#F4F0EB' }}>RESCUE</span>
          <span style={{ color: '#E8231A' }}>CHIP</span>
        </span>
      </Link>

      {children}
    </div>
  );
}
