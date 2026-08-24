-- Ciudad/país del usuario (GPS del chat) para revisar anónimos.
ALTER TABLE public.chatbot_respuestas_log
  ADD COLUMN IF NOT EXISTS ciudad text,
  ADD COLUMN IF NOT EXISTS pais text,
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision;
