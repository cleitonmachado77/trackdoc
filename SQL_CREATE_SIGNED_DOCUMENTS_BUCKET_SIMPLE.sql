-- 📝 SQL Simplificado para criar bucket de documentos assinados múltiplos
-- Execute este script no Supabase Dashboard (SQL Editor)

-- 1. Criar bucket para documentos assinados (execute apenas se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signed-documents',
  'signed-documents',
  true,
  52428800,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Habilitar RLS no bucket (se necessário)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Criar política para leitura pública (execute uma vez)
CREATE POLICY "Public read for signed documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'signed-documents');

-- 4. Criar política para upload autenticado (execute uma vez)
CREATE POLICY "Authenticated upload for signed documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'signed-documents' 
  AND auth.role() = 'authenticated'
);

-- 5. Criar política para atualização autenticada (execute uma vez)
CREATE POLICY "Authenticated update for signed documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'signed-documents' 
  AND auth.role() = 'authenticated'
);

-- 6. Verificar se foi criado corretamente
SELECT 
  'Bucket criado:' as status,
  id,
  name,
  public,
  file_size_limit
FROM storage.buckets 
WHERE id = 'signed-documents';

-- 7. Verificar políticas
SELECT 
  'Políticas criadas:' as status,
  policyname
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%signed documents%';