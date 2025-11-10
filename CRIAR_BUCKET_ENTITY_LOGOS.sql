-- Criar bucket para logos de entidades
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'entity-logos',
  'entity-logos',
  true,
  2097152, -- 2MB em bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir upload de logos (apenas usuários autenticados)
CREATE POLICY "Usuários autenticados podem fazer upload de logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'entity-logos');

-- Política para permitir leitura pública dos logos
CREATE POLICY "Logos são públicos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'entity-logos');

-- Política para permitir atualização de logos (apenas o admin da entidade)
CREATE POLICY "Admin pode atualizar logo da entidade"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'entity-logos' AND
  auth.uid() IN (
    SELECT admin_user_id 
    FROM entities 
    WHERE id::text = (string_to_array(name, '/'))[1]
  )
);

-- Política para permitir exclusão de logos (apenas o admin da entidade)
CREATE POLICY "Admin pode deletar logo da entidade"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'entity-logos' AND
  auth.uid() IN (
    SELECT admin_user_id 
    FROM entities 
    WHERE id::text = (string_to_array(name, '/'))[1]
  )
);
