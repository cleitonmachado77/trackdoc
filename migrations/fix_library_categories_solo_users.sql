-- =====================================================
-- PERMITIR USUÁRIOS SOLO NA BIBLIOTECA PÚBLICA
-- =====================================================
-- Problema: Usuários solo (sem entidade) não conseguem criar categorias
-- Solução: Permitir entity_id NULL e usar created_by como identificador
-- =====================================================

-- 1. Verificar estrutura atual
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'library_categories'
ORDER BY ordinal_position;

-- =====================================================
-- 2. ALTERAR TABELA library_categories
-- =====================================================

-- Permitir entity_id NULL para usuários solo
ALTER TABLE library_categories 
ALTER COLUMN entity_id DROP NOT NULL;

-- Adicionar constraint: deve ter entity_id OU created_by
ALTER TABLE library_categories
DROP CONSTRAINT IF EXISTS library_categories_owner_check;

ALTER TABLE library_categories
ADD CONSTRAINT library_categories_owner_check 
CHECK (entity_id IS NOT NULL OR created_by IS NOT NULL);

-- =====================================================
-- 3. ALTERAR TABELA public_library (se necessário)
-- =====================================================

-- Verificar se entity_id já permite NULL
DO $$
BEGIN
  -- Tentar alterar, ignorar se já permite NULL
  BEGIN
    ALTER TABLE public_library 
    ALTER COLUMN entity_id DROP NOT NULL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'entity_id já permite NULL ou erro: %', SQLERRM;
  END;
END $$;

-- Adicionar constraint: deve ter entity_id OU created_by
ALTER TABLE public_library
DROP CONSTRAINT IF EXISTS public_library_owner_check;

ALTER TABLE public_library
ADD CONSTRAINT public_library_owner_check 
CHECK (entity_id IS NOT NULL OR created_by IS NOT NULL);

-- =====================================================
-- 4. CRIAR ÍNDICES PARA CONSULTAS POR created_by
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_library_categories_created_by 
ON library_categories(created_by) 
WHERE created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_public_library_created_by 
ON public_library(created_by) 
WHERE created_by IS NOT NULL;

-- =====================================================
-- 5. CONFIGURAR RLS PARA public_library
-- =====================================================

-- Habilitar RLS
ALTER TABLE public_library ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "public_library_select" ON public_library;
DROP POLICY IF EXISTS "public_library_insert" ON public_library;
DROP POLICY IF EXISTS "public_library_update" ON public_library;
DROP POLICY IF EXISTS "public_library_delete" ON public_library;
DROP POLICY IF EXISTS "Users can view public library items" ON public_library;
DROP POLICY IF EXISTS "Users can insert public library items" ON public_library;
DROP POLICY IF EXISTS "Users can update public library items" ON public_library;
DROP POLICY IF EXISTS "Users can delete public library items" ON public_library;

-- Política SELECT: Usuários podem ver itens da sua entidade OU seus próprios itens (solo)
CREATE POLICY "public_library_select"
  ON public_library
  FOR SELECT
  USING (
    -- Usuário com entidade: ver itens da entidade
    entity_id IN (SELECT entity_id FROM profiles WHERE id = auth.uid())
    OR
    -- Usuário solo: ver seus próprios itens
    created_by = auth.uid()
    OR
    -- Itens públicos ativos (para página pública)
    is_active = true
  );

-- Política INSERT: Usuários podem inserir itens para sua entidade OU como usuário solo
CREATE POLICY "public_library_insert"
  ON public_library
  FOR INSERT
  WITH CHECK (
    -- Usuário com entidade: inserir para sua entidade
    (entity_id IS NOT NULL AND entity_id IN (SELECT entity_id FROM profiles WHERE id = auth.uid()))
    OR
    -- Usuário solo: inserir com created_by = seu id
    (entity_id IS NULL AND created_by = auth.uid())
  );

-- Política UPDATE: Usuários podem atualizar itens da sua entidade OU seus próprios itens
CREATE POLICY "public_library_update"
  ON public_library
  FOR UPDATE
  USING (
    entity_id IN (SELECT entity_id FROM profiles WHERE id = auth.uid())
    OR
    created_by = auth.uid()
  );

-- Política DELETE: Usuários podem excluir itens da sua entidade OU seus próprios itens
CREATE POLICY "public_library_delete"
  ON public_library
  FOR DELETE
  USING (
    entity_id IN (SELECT entity_id FROM profiles WHERE id = auth.uid())
    OR
    created_by = auth.uid()
  );

-- =====================================================
-- 6. CONFIGURAR RLS PARA library_categories
-- =====================================================

-- Habilitar RLS
ALTER TABLE library_categories ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "library_categories_select" ON library_categories;
DROP POLICY IF EXISTS "library_categories_insert" ON library_categories;
DROP POLICY IF EXISTS "library_categories_update" ON library_categories;
DROP POLICY IF EXISTS "library_categories_delete" ON library_categories;

-- Política SELECT
CREATE POLICY "library_categories_select"
  ON library_categories
  FOR SELECT
  USING (
    entity_id IN (SELECT entity_id FROM profiles WHERE id = auth.uid())
    OR
    created_by = auth.uid()
  );

-- Política INSERT
CREATE POLICY "library_categories_insert"
  ON library_categories
  FOR INSERT
  WITH CHECK (
    (entity_id IS NOT NULL AND entity_id IN (SELECT entity_id FROM profiles WHERE id = auth.uid()))
    OR
    (entity_id IS NULL AND created_by = auth.uid())
  );

-- Política UPDATE
CREATE POLICY "library_categories_update"
  ON library_categories
  FOR UPDATE
  USING (
    entity_id IN (SELECT entity_id FROM profiles WHERE id = auth.uid())
    OR
    created_by = auth.uid()
  );

-- Política DELETE
CREATE POLICY "library_categories_delete"
  ON library_categories
  FOR DELETE
  USING (
    entity_id IN (SELECT entity_id FROM profiles WHERE id = auth.uid())
    OR
    created_by = auth.uid()
  );

-- =====================================================
-- 7. VERIFICAR POLÍTICAS CRIADAS
-- =====================================================

SELECT 
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename IN ('public_library', 'library_categories')
ORDER BY tablename, cmd;

-- =====================================================
-- RESULTADO ESPERADO:
-- - 4 políticas para public_library (SELECT, INSERT, UPDATE, DELETE)
-- - 4 políticas para library_categories (SELECT, INSERT, UPDATE, DELETE)
-- =====================================================
