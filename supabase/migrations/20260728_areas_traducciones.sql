-- ============================================================
-- TRADUCCIONES DE ÁREAS (i18n)
-- ============================================================
-- Guarda textos traducidos por IA (FR, DE, IT, EN): nombre,
-- descripción y ubicación. El español vive en public.areas.
--
-- Ejecutar en Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.areas_traducciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id uuid NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
  idioma text NOT NULL CHECK (idioma IN ('fr', 'de', 'it', 'en', 'pt', 'nl')),
  nombre text,
  descripcion text NOT NULL,
  direccion text,
  ciudad text,
  provincia text,
  comunidad text,
  pais text,
  modelo text,                    -- modelo IA usado
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (area_id, idioma)
);

CREATE INDEX IF NOT EXISTS idx_areas_traducciones_area ON public.areas_traducciones(area_id);
CREATE INDEX IF NOT EXISTS idx_areas_traducciones_idioma ON public.areas_traducciones(idioma);

-- RLS: lectura pública (las traducciones son contenido público),
-- escritura solo vía service role (los scripts).
ALTER TABLE public.areas_traducciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_publico_traducciones" ON public.areas_traducciones;
CREATE POLICY "select_publico_traducciones" ON public.areas_traducciones
  FOR SELECT TO anon, authenticated
  USING (true);
