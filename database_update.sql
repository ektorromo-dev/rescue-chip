-- Script de actualización de Base de Datos para RescueChip Seguridad
-- Nivel 2: Anti-hackeo // Corrección de expiración de Tokens

-- 1. Asegurar la existencia de la tabla (por si no existe)
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT,
    device_info TEXT,
    status TEXT DEFAULT 'pending',
    verification_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Añadir la columna de expiración del token si la tabla ya existía pero no la columna
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'user_sessions'
          AND column_name = 'token_expires_at'
    ) THEN
        ALTER TABLE public.user_sessions
        ADD COLUMN token_expires_at TIMESTAMP WITH TIME ZONE;
        
        RAISE NOTICE 'Columna token_expires_at agregada exitosamente a user_sessions.';
    ELSE
        RAISE NOTICE 'La columna token_expires_at ya existe en user_sessions.';
    END IF;
END
$$;

-- 3. Inhabilitar/Revocar tokens antiguos que puedan estar colgados sin fecha de expiración por seguridad retroactiva
UPDATE public.user_sessions
SET status = 'expired'
WHERE status = 'pending' AND token_expires_at IS NULL;
