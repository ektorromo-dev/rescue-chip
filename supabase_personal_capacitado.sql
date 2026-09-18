CREATE TABLE public.personal_capacitado (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  folio text UNIQUE NOT NULL,
  organizacion text NOT NULL,
  fecha_capacitacion text NOT NULL,
  duracion_horas numeric,
  sede text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.personal_capacitado ENABLE ROW LEVEL SECURITY;

CREATE POLICY "personal_capacitado_select_public"
  ON public.personal_capacitado
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Sin política de INSERT/UPDATE/DELETE para anon/authenticated:
-- solo se escribe con la service role key (yo la ejecuto manualmente
-- por ahora, o desde /admin más adelante).

CREATE INDEX idx_personal_capacitado_nombre ON public.personal_capacitado (nombre);
CREATE INDEX idx_personal_capacitado_folio ON public.personal_capacitado (folio);