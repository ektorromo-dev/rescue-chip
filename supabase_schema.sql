-- Create 'chips' table
create table public.chips (
  id uuid default gen_random_uuid() primary key,
  folio text unique not null,
  activated boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create 'profiles' table
create table public.profiles (
  id uuid default gen_random_uuid() primary key,
  chip_id uuid references public.chips(id) on delete cascade not null,
  
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
