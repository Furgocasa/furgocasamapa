-- Voto del usuario (👍 / 👎) sobre cada respuesta del Tío Viajero.
-- Independiente de la valoración IA: puede gustar una incorrecta o al revés.

ALTER TABLE public.chatbot_respuestas_log
  ADD COLUMN IF NOT EXISTS voto_usuario text CHECK (voto_usuario IN ('up', 'down')),
  ADD COLUMN IF NOT EXISTS votado_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_chatbot_log_voto
  ON public.chatbot_respuestas_log (voto_usuario)
  WHERE voto_usuario IS NOT NULL;
