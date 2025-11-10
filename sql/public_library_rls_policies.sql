-- Políticas de Segurança (RLS) para a tabela public_library
-- Este arquivo deve ser executado APÓS a criação da tabela

-- Habilitar RLS na tabela
ALTER TABLE public.public_library ENABLE ROW LEVEL SECURITY;

-- Política 1: Usuários autenticados podem ver documentos de sua entidade
CREATE POLICY "Users can view their entity's library items"
  ON public.public_library
  FOR SELECT
  TO authenticated
  USING (
    entity_id IN (
      SELECT entity_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Política 2: Usuários autenticados podem inserir documentos em sua entidade
CREATE POLICY "Users can insert library items for their entity"
  ON public.public_library
  FOR INSERT
  TO authenticated
  WITH CHECK (
    entity_id IN (
      SELECT entity_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Política 3: Usuários autenticados podem atualizar documentos de sua entidade
CREATE POLICY "Users can update their entity's library items"
  ON public.public_library
  FOR UPDATE
  TO authenticated
  USING (
    entity_id IN (
      SELECT entity_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    entity_id IN (
      SELECT entity_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Política 4: Usuários autenticados podem deletar documentos de sua entidade
CREATE POLICY "Users can delete their entity's library items"
  ON public.public_library
  FOR DELETE
  TO authenticated
  USING (
    entity_id IN (
      SELECT entity_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Política 5: Acesso público para visualização de documentos ativos
-- Esta política permite que qualquer pessoa (mesmo não autenticada) veja documentos ativos
CREATE POLICY "Public can view active library items"
  ON public.public_library
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Comentários sobre as políticas
COMMENT ON POLICY "Users can view their entity's library items" ON public.public_library 
  IS 'Permite que usuários autenticados vejam apenas documentos de sua própria entidade';

COMMENT ON POLICY "Users can insert library items for their entity" ON public.public_library 
  IS 'Permite que usuários autenticados adicionem documentos apenas para sua própria entidade';

COMMENT ON POLICY "Users can update their entity's library items" ON public.public_library 
  IS 'Permite que usuários autenticados atualizem apenas documentos de sua própria entidade';

COMMENT ON POLICY "Users can delete their entity's library items" ON public.public_library 
  IS 'Permite que usuários autenticados deletem apenas documentos de sua própria entidade';

COMMENT ON POLICY "Public can view active library items" ON public.public_library 
  IS 'Permite acesso público (sem autenticação) para visualizar documentos ativos';

-- Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'public_library'
ORDER BY policyname;
