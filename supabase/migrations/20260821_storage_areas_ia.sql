-- Bucket público para ilustraciones propias de áreas (generadas con IA).
-- Si el bucket ya existe (creado por la API), este script no lo rompe.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'areas',
  'areas',
  true,
  6291456,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "areas_ia_public_read" ON storage.objects;
CREATE POLICY "areas_ia_public_read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'areas');

DROP POLICY IF EXISTS "areas_ia_service_write" ON storage.objects;
CREATE POLICY "areas_ia_service_write"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'areas')
WITH CHECK (bucket_id = 'areas');
