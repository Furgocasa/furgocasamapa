-- ============================================================
-- REGISTRO DE TODAS LAS RESPUESTAS DEL TÍO VIAJERO (auditoría)
-- ============================================================
-- Guarda CADA respuesta del chatbot (también de usuarios anónimos,
-- que no tienen conversación) para poder revisarlas desde
-- /admin/chatbot-respuestas y detectar errores o malas respuestas.
--
-- Ejecutar en Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.chatbot_respuestas_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  conversacion_id uuid,           -- null si el usuario es anónimo
  user_id uuid,                   -- null si el usuario es anónimo
  locale text,
  pregunta text,
  respuesta text,
  funciones jsonb,                -- [{ name, args }] de las búsquedas ejecutadas
  areas_ids jsonb,                -- ids de las áreas devueltas en tarjetas
  tokens integer,
  modelo text,
  duracion_ms integer,
  -- Revisión manual
  revisado boolean NOT NULL DEFAULT false,
  nota_revision text
);

CREATE INDEX IF NOT EXISTS idx_chatbot_log_created ON public.chatbot_respuestas_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chatbot_log_revisado ON public.chatbot_respuestas_log(revisado);

-- RLS: solo el admin puede leer y marcar como revisado.
-- La inserción la hace el servidor con service role (ignora RLS).
ALTER TABLE public.chatbot_respuestas_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_chatbot_log" ON public.chatbot_respuestas_log;
CREATE POLICY "admin_select_chatbot_log" ON public.chatbot_respuestas_log
  FOR SELECT TO authenticated
  USING (COALESCE((SELECT (raw_user_meta_data->>'is_admin')::boolean FROM auth.users WHERE id = auth.uid()), false) = true);

DROP POLICY IF EXISTS "admin_update_chatbot_log" ON public.chatbot_respuestas_log;
CREATE POLICY "admin_update_chatbot_log" ON public.chatbot_respuestas_log
  FOR UPDATE TO authenticated
  USING (COALESCE((SELECT (raw_user_meta_data->>'is_admin')::boolean FROM auth.users WHERE id = auth.uid()), false) = true);
