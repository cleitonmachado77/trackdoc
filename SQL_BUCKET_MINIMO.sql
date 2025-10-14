-- 📝 SQL Mínimo: Apenas criar bucket (sem políticas)
-- Execute no Supabase SQL Editor

-- Criar apenas o bucket (sem políticas RLS)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signed-documents',
  'signed-documents',
  true,
  52428800,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Verificar se foi criado
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'signed-documents';

-- IMPORTANTE: Após executar este SQL, configure as políticas pela interface:
-- 1. Vá para Storage → signed-documents → Policies
-- 2. Crie as políticas conforme instruções em CRIAR_BUCKET_INTERFACE.md