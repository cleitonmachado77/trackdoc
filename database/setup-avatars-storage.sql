-- Script para configurar o storage de avatars no Supabase

-- 1. Criar bucket para avatars (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB em bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Criar política para permitir que usuários vejam todos os avatars
CREATE POLICY IF NOT EXISTS "Avatars são publicamente visíveis"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 3. Criar política para permitir que usuários façam upload de seus próprios avatars
CREATE POLICY IF NOT EXISTS "Usuários podem fazer upload de seus próprios avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Criar política para permitir que usuários atualizem seus próprios avatars
CREATE POLICY IF NOT EXISTS "Usuários podem atualizar seus próprios avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Criar política para permitir que usuários deletem seus próprios avatars
CREATE POLICY IF NOT EXISTS "Usuários podem deletar seus próprios avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. Habilitar RLS no bucket de storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 7. Criar função para limpar avatars antigos quando um novo é enviado
CREATE OR REPLACE FUNCTION cleanup_old_avatars()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o avatar_url mudou e não é nulo, tentar limpar o avatar antigo
  IF OLD.avatar_url IS NOT NULL AND OLD.avatar_url != NEW.avatar_url THEN
    -- Extrair o nome do arquivo da URL antiga
    DECLARE
      old_file_name TEXT;
    BEGIN
      old_file_name := substring(OLD.avatar_url from '[^/]+$');
      
      -- Tentar deletar o arquivo antigo (não é crítico se falhar)
      DELETE FROM storage.objects 
      WHERE bucket_id = 'avatars' 
      AND name LIKE '%' || old_file_name;
      
    EXCEPTION WHEN OTHERS THEN
      -- Ignorar erros de limpeza
      NULL;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Criar trigger para limpeza automática
DROP TRIGGER IF EXISTS cleanup_old_avatars_trigger ON profiles;
CREATE TRIGGER cleanup_old_avatars_trigger
  AFTER UPDATE OF avatar_url ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_avatars();

-- 9. Comentários para documentação
COMMENT ON POLICY "Avatars são publicamente visíveis" ON storage.objects IS 
'Permite que qualquer pessoa veja os avatars dos usuários';

COMMENT ON POLICY "Usuários podem fazer upload de seus próprios avatars" ON storage.objects IS 
'Permite que usuários façam upload apenas de seus próprios avatars';

COMMENT ON FUNCTION cleanup_old_avatars() IS 
'Limpa automaticamente avatars antigos quando um novo é enviado';

-- Finalizar
SELECT 'Storage de avatars configurado com sucesso!' as status;