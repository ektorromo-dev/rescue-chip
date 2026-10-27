'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Check, AlertCircle, Eye, EyeOff, User } from 'lucide-react';
import { vincularContactoQrAction } from './actions';

interface VincularQrClientProps {
  token: string;
  riderName: string;
  riderPhotoUrl: string | null;
}

export default function VincularQrClient({
  token,
  riderName,
  riderPhotoUrl,
}: VincularQrClientProps) {
  const supabase = createClient();
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('+52 ');
  const [email, setEmail] = useState('');
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
      const trimmedNombre = nombre.trim();
      const trimmedTelefono = telefono.trim();
      const trimmedEmail = email.trim();

      if (!trimmedNombre) {
        throw new Error('Por favor ingresa tu nombre completo.');
      }
      if (!trimmedTelefono || trimmedTelefono === '+52') {
        throw new Error('Por favor ingresa tu número de teléfono celular.');
      }
      if (!trimmedEmail || !password) {
        throw new Error('El correo electrónico y la contraseña son obligatorios.');
      }
      if (password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres.');
      }

      let userId = '';

      // 1. Intentar crear cuenta guardando nombre y teléfono en user_metadata
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            nombre: trimmedNombre,
            telefono: trimmedTelefono,
            full_name: trimmedNombre,
            phone: trimmedTelefono,
          },
        },
      });

      if (signUpError) {
        if (
          signUpError.message.includes('User already registered') ||
          signUpError.message.toLowerCase().includes('already registered')
        ) {
          // Si ya existe cuenta, iniciamos sesión
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password,
          });

          if (signInError) {
            throw new Error(
              'Este correo ya tiene una cuenta en RescueChip. Ingresa tu contraseña o usa ¿Olvidaste tu contraseña?'
            );
          }
          userId = signInData.user?.id || '';
        } else {
          throw new Error('Error al crear cuenta: ' + signUpError.message);
        }
      } else {
        userId = signUpData.user?.id || '';

        // Asegurar sesión activa explícita
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

        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      if (!userId) {
        throw new Error('No se pudo verificar la cuenta.');
      }

      // 2. Procesar el uso del vínculo QR mediante Server Action
      const result = await vincularContactoQrAction({
        token,
        userId,
        userEmail: trimmedEmail,
        contactName: trimmedNombre,
        contactPhone: trimmedTelefono,
      });

      if (!result.ok) {
        throw new Error(result.mensaje || 'Error al procesar el vínculo.');
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      let message =
        err instanceof Error ? err.message : 'Ocurrió un error inesperado al procesar la vinculación.';
      if (
        message.toLowerCase().includes('invalid login credentials') ||
        message.toLowerCase().includes('invalid_grant')
      ) {
        message =
          'Este correo ya tiene una cuenta en RescueChip. Ingresa tu contraseña o usa ¿Olvidaste tu contraseña?';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const primerNombreRider = riderName?.trim().split(/\s+/)[0] || riderName || 'tu familiar';

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
            Listo. Ya eres contacto de emergencia de{' '}
            <strong style={{ color: '#F4F0EB' }}>{riderName}</strong>.
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
              transition: 'background-color 0.15s',
            }}
          >
            Ir al inicio
          </Link>
        </div>

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
        {/* Foto del rider o avatar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          {riderPhotoUrl ? (
            <img
              src={riderPhotoUrl}
              alt={riderName}
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid rgba(255,255,255,0.15)',
              }}
            />
          ) : (
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '2px solid rgba(255,255,255,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F4F0EB',
              }}
            >
              <User size={36} color="#9E9A95" />
            </div>
          )}
        </div>

        <h1
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#F4F0EB',
            marginBottom: '12px',
            lineHeight: 1.35,
            textAlign: 'center',
          }}
        >
          {riderName} te invita a ser su contacto de emergencia
        </h1>

        <p
          style={{
            fontSize: '14px',
            color: '#9E9A95',
            lineHeight: 1.55,
            marginBottom: '28px',
            textAlign: 'center',
          }}
        >
          Recibirás las alertas de emergencia de {primerNombreRider} por correo y SMS, con su ubicación y los pasos a seguir.
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Nombre */}
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
              Tu nombre completo
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. María González"
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

          {/* Teléfono */}
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
              Tu número de celular
            </label>
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+52 55 1234 5678"
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

          {/* Correo */}
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

          {/* Contraseña */}
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
            <div style={{ marginTop: '8px', textAlign: 'right' }}>
              <Link
                href="/reset-password"
                style={{
                  fontSize: '12px',
                  color: '#9E9A95',
                  textDecoration: 'underline',
                }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <span style={{ display: 'block', fontSize: '11px', color: '#6E6A65', marginTop: '6px' }}>
              ¿Ya tienes cuenta en RescueChip? Ingresa tu contraseña de siempre. Si no tienes cuenta, esta será tu clave de acceso.
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
            {loading ? 'Vinculando...' : 'Aceptar desde la web'}
          </button>
        </form>
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
