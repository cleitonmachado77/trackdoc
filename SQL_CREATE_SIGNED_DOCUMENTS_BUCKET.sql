-- 📝 SQL para criar bucket de documentos assinados múltiplos
-- Execute este script no Supabase Dashboard

-- 1. Criar bucket para documentos assinados (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signed-documents',
  'signed-documents',
  true,
  52428800, -- 50MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Criar política para permitir leitura pública
CREATE POLICY IF NOT EXISTS "Permitir leitura pública de documentos assinados"
ON storage.objects FOR SELECT
USING (bucket_id = 'signed-documents');

-- 3. Criar política para permitir upload por usuários autenticados
CREATE POLICY IF NOT EXISTS "Permitir upload de documentos assinados por usuários autenticados"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'signed-documents' 
  AND auth.role() = 'authenticated'
);

-- 4. Criar política para permitir atualização por usuários autenticados
CREATE POLICY IF NOT EXISTS "Permitir atualização de documentos assinados por usuários autenticados"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'signed-documents' 
  AND auth.role() = 'authenticated'
);

-- 5. Verificar se o bucket foi criado
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'signed-documents';

-- 6. Verificar políticas criadas
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%documentos assinados%';

-- 7. Comentários para documentação
COMMENT ON POLICY "Permitir leitura pública de documentos assinados" ON storage.objects IS 
'Permite que qualquer pessoa visualize documentos assinados através de URLs públicas';

COMMENT ON POLICY "Permitir upload de documentos assinados por usuários autenticados" ON storage.objects IS 
'Permite que usuários autenticados façam upload de documentos assinados';

COMMENT ON POLICY "Permitir atualização de documentos assinados por usuários autenticados" ON storage.objects IS 
'Permite que usuários autenticados atualizem documentos assinados existentes';