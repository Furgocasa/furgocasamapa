-- ============================================================
-- AGENTE REVISOR: evaluación IA de las respuestas del chatbot
-- ============================================================
-- Añade a chatbot_respuestas_log las columnas donde el agente
-- revisor guarda su veredicto sobre CADA respuesta individual.
--
-- Ejecutar en Supabase SQL Editor.

ALTER TABLE public.chatbot_respuestas_log
  ADD COLUMN IF NOT EXISTS valoracion_ia text CHECK (valoracion_ia IN ('correcta', 'mejorable', 'incorrecta')),
  ADD COLUMN IF NOT EXISTS motivo_ia text,
  ADD COLUMN IF NOT EXISTS sugerencia_ia text,
  ADD COLUMN IF NOT EXISTS evaluado_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_chatbot_log_valoracion ON public.chatbot_respuestas_log(valoracion_ia);
CREATE INDEX IF NOT EXISTS idx_chatbot_log_sin_evaluar ON public.chatbot_respuestas_log(evaluado_at) WHERE evaluado_at IS NULL;
