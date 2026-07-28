-- ============================================================
-- Nº de valoraciones Google (para ranking ponderado)
-- ============================================================
-- Permite ordenar "mejores áreas" por score bayesiano
-- (nota × volumen de reseñas) en lugar de solo google_rating.
--
-- Ejecutar en Supabase SQL Editor.

ALTER TABLE public.areas
  ADD COLUMN IF NOT EXISTS google_ratings_total integer;

COMMENT ON COLUMN public.areas.google_ratings_total IS
  'Número de valoraciones de Google Places (user_ratings_total). Null = desconocido.';

CREATE INDEX IF NOT EXISTS idx_areas_rating_reviews
  ON public.areas (google_rating DESC NULLS LAST, google_ratings_total DESC NULLS LAST)
  WHERE activo = true AND google_rating IS NOT NULL;
