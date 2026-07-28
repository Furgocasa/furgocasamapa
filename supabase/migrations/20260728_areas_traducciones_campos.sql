-- ============================================================
-- AMPLIAR areas_traducciones: nombre + ubicación
-- ============================================================
-- Si ya se ejecutó 20260728_areas_traducciones.sql, este ALTER
-- añade los campos de texto visibles. Idempotente.
--
-- Ejecutar en Supabase SQL Editor.

ALTER TABLE public.areas_traducciones ADD COLUMN IF NOT EXISTS nombre text;
ALTER TABLE public.areas_traducciones ADD COLUMN IF NOT EXISTS direccion text;
ALTER TABLE public.areas_traducciones ADD COLUMN IF NOT EXISTS ciudad text;
ALTER TABLE public.areas_traducciones ADD COLUMN IF NOT EXISTS provincia text;
ALTER TABLE public.areas_traducciones ADD COLUMN IF NOT EXISTS comunidad text;
ALTER TABLE public.areas_traducciones ADD COLUMN IF NOT EXISTS pais text;
