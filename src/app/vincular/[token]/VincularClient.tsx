'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { aceptarInvitacion } from './actions';

interface VincularClientProps {
  token: string;
  riderName: string;
  contactEmail: string | null;
  contactName: string | null;
  existingAccountHint: boolean;
}

export default function VincularClient({
  token,
  riderName,
  contactEmail,
  existingAccountHint,
}: VincularClientProps) {
  const supabase = createClient();
  const [email, setEmail] = useState(contactEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const trimmedEmail = email.trim();
      if (!trimmedEmail || !password) {
        throw new Error('El correo electrónico y la contraseña son obligatorios.');
      }

      let userId = '';

      // Patrón idéntico a src/app/activate/page.tsx (líneas 167-207)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });

      if (signUpError) {
        if (
          signUpError.message.includes('User already registered') ||
          signUpError.message.toLowerCase().includes('already registered')
        ) {
          // Si ya existe, intentamos login para vincular
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password,
          });
          if (signInError) {
            throw new Error(
              'El usuario ya existe, pero la contraseña es incorrecta. Si ya tienes cuenta, ingresa tu contraseña correctamente.'
            );
          }
          userId = signInData.user?.id || '';
        } else {
          throw new Error('Error al crear cuenta: ' + signUpError.message);
        }
      } else {
        userId = signUpData.user?.id || '';

        // Asegurar que exista una sesión activa explícita
        if (!signUpData.session) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password,
          });
          if (signInError) {
            throw new Error(
              'Cuenta creada, pero hubo un error de sesión: ' +
                signInError.message +
                '. Intenta iniciar sesión manualmente.'
            );
          }
          if (!signInData.session) {
            throw new Error('Falló la sesión automática posterior a la creación de cuenta.');
          }
        }

        // Delay corto para asegurar que Supabase propague las credenciales Auth internamente
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      if (!userId) {
        throw new Error('No se pudo confirmar la cuenta.');
      }

      // Actualizar la invitación a accepted mediante Server Action
      await aceptarInvitacion(token, userId);

      setIsSuccess(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Ocurrió un error inesperado al procesar la vinculación.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
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
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
            }}
          >
            <Check size={32} color="#22c55e" />
          </div>

          <h1
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#F4F0EB',
              marginBottom: '12px',
              lineHeight: 1.3,
            }}
          >
            ¡Vinculación completada!
          </h1>

          <p
            style={{
              fontSize: '15px',
              color: '#D4D0CA',
              lineHeight: 1.6,
              marginBottom: '24px',
            }}
          >
            Listo. Ahora eres contacto de emergencia de{' '}
            <strong style={{ color: '#F4F0EB' }}>{riderName}</strong>. Recibirás alertas si activa una
            emergencia.
          </p>

          <Link
            href="/dashboard"
            style={{
              display: 'inline-block',
              backgroundColor: '#1A1A18',
              color: '#F4F0EB',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '10px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'background-color 0.2s',
            }}
          >
            Ir a mi panel
          </Link>
        </div>

        {/* Banner discreto informativo */}
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

  return (
    <div style={{ width: '100%', maxWidth: '440px' }}>
      <div
        style={{
          backgroundColor: '#131311',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '40px 32px',
        }}
      >
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#F4F0EB',
            marginBottom: '12px',
            lineHeight: 1.35,
          }}
        >
          {riderName} te agregó como su contacto de emergencia en RescueChip
        </h1>

        <p
          style={{
            fontSize: '14px',
            color: '#9E9A95',
            lineHeight: 1.55,
            marginBottom: '28px',
          }}
        >
          Si {riderName} activa una alerta de emergencia, recibirás una notificación con su ubicación
          en tiempo real para que puedas ayudarlo más rápido.
        </p>

        {error && (
          <div
            style={{
              backgroundColor: 'rgba(232,35,26,0.12)',
              border: '1px solid rgba(232,35,26,0.3)',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '20px',
              color: '#E8231A',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              lineHeight: 1.4,
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {existingAccountHint && !error && (
          <div
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '20px',
              color: '#93C5FD',
              fontSize: '13px',
              lineHeight: 1.5,
            }}
          >
            Detectamos que ya existe una cuenta de RescueChip asociada a este
            número de teléfono. Si esa cuenta es tuya, usa el correo con el que
            la registraste en vez del correo pre-llenado.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: '#9E9A95',
                marginBottom: '8px',
              }}
            >
              Tu correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
              style={{
                width: '100%',
                backgroundColor: '#1A1A18',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                padding: '12px 16px',
                color: '#F4F0EB',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: '#9E9A95',
                marginBottom: '8px',
              }}
            >
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa o crea tu contraseña"
                required
                minLength={6}
                style={{
                  width: '100%',
                  backgroundColor: '#1A1A18',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  padding: '12px 42px 12px 16px',
                  color: '#F4F0EB',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9E9A95',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <span style={{ display: 'block', fontSize: '11px', color: '#6E6A65', marginTop: '6px' }}>
              ¿Ya tienes cuenta en RescueChip? Cambia el correo de arriba por el de
              tu cuenta e ingresa tu contraseña. Si no tienes cuenta, esta será tu
              clave de acceso con el correo indicado.
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '10px',
              width: '100%',
              backgroundColor: loading ? '#8B1410' : '#E8231A',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '14px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.3px',
              transition: 'background-color 0.2s',
            }}
          >
            {loading ? 'Vinculando...' : 'Aceptar y vincularme'}
          </button>
        </form>
      </div>

      {/* Banner discreto informativo */}
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
