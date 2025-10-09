-- SQL para corrigir a tabela documents e adicionar campos que estão faltando
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar campos que estão faltando na tabela documents
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS author_id UUID,
ADD COLUMN IF NOT EXISTS entity_id UUID,
ADD COLUMN IF NOT EXISTS category_id UUID,
ADD COLUMN IF NOT EXISTS department_id UUID,
ADD COLUMN IF NOT EXISTS file_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS file_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- 2. Copiar dados de created_by para author_id se existir
UPDATE public.documents 
SET author_id = created_by 
WHERE author_id IS NULL AND created_by IS NOT NULL;

-- 3. Criar índices para os novos campos
CREATE INDEX IF NOT EXISTS idx_documents_author_id ON public.documents(author_id);
CREATE INDEX IF NOT EXISTS idx_documents_entity_id ON public.documents(entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_category_id ON public.documents(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_department_id ON public.documents(department_id);

-- 4. Adicionar foreign keys se as tabelas existirem
DO $$
BEGIN
  -- Verificar se a tabela entities existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entities' AND table_schema = 'public') THEN
    ALTER TABLE public.documents 
    ADD CONSTRAINT documents_entity_id_fkey 
    FOREIGN KEY (entity_id) REFERENCES entities(id);
  END IF;
  
  -- Verificar se a tabela categories existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories' AND table_schema = 'public') THEN
    ALTER TABLE public.documents 
    ADD CONSTRAINT documents_category_id_fkey 
    FOREIGN KEY (category_id) REFERENCES categories(id);
  END IF;
  
  -- Verificar se a tabela departments existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'departments' AND table_schema = 'public') THEN
    ALTER TABLE public.documents 
    ADD CONSTRAINT documents_department_id_fkey 
    FOREIGN KEY (department_id) REFERENCES departments(id);
  END IF;
  
  -- Adicionar foreign key para author_id
  ALTER TABLE public.documents 
  ADD CONSTRAINT documents_author_id_fkey 
  FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  
EXCEPTION
  WHEN duplicate_object THEN
    -- Ignorar se as constraints já existirem
    NULL;
END $$;

-- 5. Atualizar as políticas RLS para usar author_id
DROP POLICY IF EXISTS "Users can view documents they created or are approving" ON public.documents;
CREATE POLICY "Users can view documents they created or are approving" ON public.documents
  FOR SELECT USING (
    author_id = auth.uid() OR 
    created_by = auth.uid() OR
    id IN (SELECT document_id FROM approval_requests WHERE approver_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert their own documents" ON public.documents;
CREATE POLICY "Users can insert their own documents" ON public.documents
  FOR INSERT WITH CHECK (author_id = auth.uid() OR created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
CREATE POLICY "Users can update their own documents" ON public.documents
  FOR UPDATE USING (author_id = auth.uid() OR created_by = auth.uid());

-- 6. Verificar se tudo foi criado corretamente
DO $$
BEGIN
  RAISE NOTICE '=== VERIFICAÇÃO DOS CAMPOS ===';
  
  -- Verificar se os campos foram adicionados
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'author_id' AND table_schema = 'public') THEN
    RAISE NOTICE '✅ Campo author_id: OK';
  ELSE
    RAISE NOTICE '❌ Campo author_id: ERRO';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'entity_id' AND table_schema = 'public') THEN
    RAISE NOTICE '✅ Campo entity_id: OK';
  ELSE
    RAISE NOTICE '❌ Campo entity_id: ERRO';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'file_name' AND table_schema = 'public') THEN
    RAISE NOTICE '✅ Campo file_name: OK';
  ELSE
    RAISE NOTICE '❌ Campo file_name: ERRO';
  END IF;
  
  RAISE NOTICE '=== CONFIGURAÇÃO CONCLUÍDA! 🎉 ===';
END $$;