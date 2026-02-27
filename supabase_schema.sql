-- Create 'chips' table
create table public.chips (
  id uuid default gen_random_uuid() primary key,
  folio text unique not null,
  status text default 'disponible',
  activated boolean default false,
  activated_by uuid references auth.users(id),
  activated_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create 'chip_accesos' table
create table public.chip_accesos (
  id uuid default gen_random_uuid() primary key,
  chip_folio text not null,
  tipo text not null check (tipo in ('emergencia', 'prueba')),
  latitud numeric,
  longitud numeric,
  ip_address text,
  user_agent text,
  session_token text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Opcional index para búsquedas rápidas en dashboard
create index idx_chip_accesos_folio on public.chip_accesos(chip_folio);

-- Create 'profiles' table
create table public.profiles (
  id uuid default gen_random_uuid() primary key,
  chip_id uuid references public.chips(id) on delete cascade not null,
  user_id uuid references auth.users(id),
  
  -- IDENTIFICACIÓN
  full_name text not null,
  photo_url text,
  age integer,
  location text not null,
  
  -- CONTACTOS DE EMERGENCIA
  emergency_contacts jsonb not null, -- Array de objetos: [{ name, phone }]
  
  -- INFORMACIÓN MÉDICA
  blood_type text not null,
  allergies text,
  medical_conditions text,
  important_medications text,
  
  -- SEGURO MÉDICO
  insurance_provider text,
  policy_number text,
  medical_system text, -- ej. IMSS, ISSSTE, Privado
  organ_donor boolean default false,
  aseguradora text,
  numero_poliza text,
  tipo_seguro text,
  nombre_asegurado text,
  vigencia_poliza date,
  telefono_aseguradora text,
  poliza_url text,
  nss text,
  numero_afiliacion text,
  clinica_asignada text,
  curp_seguro text,

  
  -- NOTAS IMPORTANTES Y AVISOS
  is_motorcyclist boolean default false,
  additional_notes text,
  
  -- UBICACIÓN
  google_maps_link text,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.chips enable row level security;
alter table public.profiles enable row level security;

-- Policies for 'chips'
-- Allow public read access to chips so the app can verify if a chip exists and is activated
create policy "Allow public read access to chips"
  on public.chips for select
  using (true);

-- Allow public update to chips (e.g., to set activated = true when registering)
-- In a real production app, this should be more secure.
create policy "Allow public update to chips"
  on public.chips for update
  using (true);

-- Policies for 'profiles'
-- Allow public read access to profiles so anyone scanning the chip can see the profile
create policy "Allow public read access to profiles"
  on public.profiles for select
  using (true);

-- Allow public insert to profiles (for the activation flow)
create policy "Allow public insert to profiles"
  on public.profiles for insert
  with check (true);

-- 5. Policies para INVOICE_REQUESTS
alter table public.factura_requests enable row level security;
create policy "Cualquiera puede insertar solicitudes de factura"
  on public.factura_requests
  for insert
  to public
  with check (true);

-- 6. Policies para CHIP_ACCESOS
alter table public.chip_accesos enable row level security;
-- Todos (incluso anónimos o Service Role) pueden insertar accesos
create policy "Cualquiera puede registrar un acceso"
  on public.chip_accesos
  for insert
  to public
  with check (true);

-- Sólo el dueño del chip puede ver los accesos de SU chip
create policy "Dueño puede ver accesos de su chip"
  on public.chip_accesos
  for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.chip_id = (select id from public.chips where folio = chip_accesos.chip_folio limit 1)
      and profiles.user_id = auth.uid()
    )
  );

-- Create function to increment profile viewers count
create or replace function increment_profile_views(profile_id uuid)
returns void as $$
begin
  update public.profiles
  set views = views + 1
  where id = profile_id;
end;
$$ language plpgsql security definer;

-- ==========================================
-- SESSIONS PARA DETECCIÓN DE NUEVO DISPOSITIVO
-- ==========================================

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_info TEXT,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'revoked')),
  verification_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asegurar que los perfiles existentes sean compatibles si se vuelve a correr el script
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'revoked'));
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS verification_token TEXT;
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Permitir a usuarios autenticados leer, insertar o actualizar sus propias sesiones
CREATE POLICY "Users manage own sessions" ON public.user_sessions
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- En el API de verificación actuaremos as sudo (Service Role) por lo que rebasaremos RLS.

-- Allow authenticated users to update their own profiles (dashboard)
create policy "Allow users to update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

-- Create storage bucket for profile photos
-- Run this manually in Supabase SQL editor or via dashboard if it doesn't execute
insert into storage.buckets (id, name, public) values ('profile-photos', 'profile-photos', true);

-- Enable RLS for the storage bucket
create policy "Public Access to Profile Photos"
  on storage.objects for select
  using ( bucket_id = 'profile-photos' );

create policy "Allow Inserts to Profile Photos"
  on storage.objects for insert
  with check ( bucket_id = 'profile-photos' );

-- Create storage bucket for medical insurance policies
insert into storage.buckets (id, name, public) 
values ('polizas', 'polizas', false)
on conflict (id) do nothing;

create policy "Permitir a usuarios subir su propia póliza"
on storage.objects for insert
with check ( bucket_id = 'polizas' and (storage.foldername(name))[1] = auth.uid()::text );

create policy "Permitir a usuarios actualizar su póliza"
on storage.objects for update
using ( bucket_id = 'polizas' and (storage.foldername(name))[1] = auth.uid()::text );

create policy "Permitir a usuarios ver su póliza"
on storage.objects for select
using ( bucket_id = 'polizas' and (storage.foldername(name))[1] = auth.uid()::text );

create policy "Permitir a usuarios borrar su póliza"
on storage.objects for delete
using ( bucket_id = 'polizas' and (storage.foldername(name))[1] = auth.uid()::text );

create policy "Permitir accesos de lectura a service_role para URLs firmadas"
on storage.objects for select
using ( bucket_id = 'polizas' );


-- Create 'factura_requests' table (Store Invoice Requests from /shop checkout)
create table public.factura_requests (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  nombre_fiscal text not null,
  rfc text not null,
  regimen_fiscal text not null,
  uso_cfdi text not null default 'G03',
  codigo_postal_fiscal text not null,
  email_factura text not null,
  whatsapp_factura text not null,
  paquete text,
  monto numeric,
  status text default 'pendiente',
  created_at timestamp default timezone('utc'::text, now()) not null
);

-- Create 'orders' table (Store Shopping Orders and Shipping info before Stripe Checkout)
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  paquete text not null,
  monto numeric not null,
  nombre_receptor text not null,
  telefono_receptor text not null,
  codigo_postal text not null,
  estado text not null,
  ciudad text not null,
  colonia text not null,
  calle_numero text not null,
  numero_interior text,
  referencia text not null,
  email_cliente text,
  requiere_factura boolean default false,
  factura_id uuid references public.factura_requests(id),
  status text default 'pendiente',
  created_at timestamp default timezone('utc'::text, now()) not null
);

-- Migración Final: Multi-chip y Planes ("Familiar", "Pareja", "Individual")
alter table public.profiles add column plan text default 'individual';
alter table public.chips add column owner_profile_id uuid references public.profiles(id);
alter table public.chips add column perfil_compartido boolean;
alter table public.chips add column assigned_plan text default 'individual';

-- Solución de Errores RLS (406) para Activación de Chips
drop policy if exists "Allow insert to profiles" on public.profiles;
create policy "Allow insert to profiles"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Allow public update to chips" on public.chips;
create policy "Allow update to chips"
  on public.chips for update
  to public
  using (true);

drop policy if exists "Allow select own profile" on public.profiles;
create policy "Allow select own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = user_id);
