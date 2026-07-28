-- ============================================================
-- CONTRIBUCIONES DE USUARIOS: verificación de datos de áreas
-- ============================================================
-- Los usuarios que han visitado un área pueden confirmar/corregir
-- servicios, precio y plazas. Las contribuciones quedan en estado
-- 'pendiente' hasta que el admin las revise o hasta que 2+ usuarios
-- coincidan (aplicación automática, fase 2).
--
-- Ejecutar en Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.area_contribuciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id uuid NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Servicios confirmados por el usuario (solo claves true/false que marcó)
  servicios jsonb,
  precio_noche numeric,
  plazas_totales integer,
  comentario text,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aplicada', 'rechazada')),
  -- Día civil (UTC) para anti-spam; evita índice sobre created_at::date (no IMMUTABLE)
  fecha date NOT NULL DEFAULT ((timezone('utc', now()))::date),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Si la tabla ya existía sin `fecha` (intento fallido anterior)
ALTER TABLE public.area_contribuciones
  ADD COLUMN IF NOT EXISTS fecha date;

UPDATE public.area_contribuciones
SET fecha = (timezone('utc', created_at))::date
WHERE fecha IS NULL;

ALTER TABLE public.area_contribuciones
  ALTER COLUMN fecha SET DEFAULT ((timezone('utc', now()))::date);

ALTER TABLE public.area_contribuciones
  ALTER COLUMN fecha SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_area_contribuciones_area ON public.area_contribuciones(area_id);
CREATE INDEX IF NOT EXISTS idx_area_contribuciones_estado ON public.area_contribuciones(estado);

-- Máximo una contribución por usuario/área/día (anti-spam)
CREATE UNIQUE INDEX IF NOT EXISTS idx_area_contribuciones_unica_dia
  ON public.area_contribuciones(area_id, user_id, fecha);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.area_contribuciones ENABLE ROW LEVEL SECURITY;

-- Insertar: cualquier usuario autenticado, solo en su propio nombre
DROP POLICY IF EXISTS "insert_propia_contribucion" ON public.area_contribuciones;
CREATE POLICY "insert_propia_contribucion" ON public.area_contribuciones
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Ver: cada usuario ve las suyas
DROP POLICY IF EXISTS "select_propias_contribuciones" ON public.area_contribuciones;
CREATE POLICY "select_propias_contribuciones" ON public.area_contribuciones
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admin: ver y actualizar todas (mismo patrón is_admin del resto del proyecto)
DROP POLICY IF EXISTS "admin_select_contribuciones" ON public.area_contribuciones;
CREATE POLICY "admin_select_contribuciones" ON public.area_contribuciones
  FOR SELECT TO authenticated
  USING (COALESCE((SELECT (raw_user_meta_data->>'is_admin')::boolean FROM auth.users WHERE id = auth.uid()), false) = true);

DROP POLICY IF EXISTS "admin_update_contribuciones" ON public.area_contribuciones;
CREATE POLICY "admin_update_contribuciones" ON public.area_contribuciones
  FOR UPDATE TO authenticated
  USING (COALESCE((SELECT (raw_user_meta_data->>'is_admin')::boolean FROM auth.users WHERE id = auth.uid()), false) = true);
