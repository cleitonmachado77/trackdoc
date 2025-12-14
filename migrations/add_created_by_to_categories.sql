-- =====================================================
-- ADICIONAR CAMPO created_by NA TABELA categories
-- =====================================================
-- Permite identificar quem criou a categoria, especialmente
-- para usuários solo (sem entidade)
-- =====================================================

-- 1. Adicionar coluna created_by se não existir
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_categories_created_by ON categories(created_by);

-- 3. Fazer o mesmo para document_types
ALTER TABLE document_types 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_document_types_created_by ON document_types(created_by);

-- 4. Fazer o mesmo para departments
ALTER TABLE departments 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_departments_created_by ON departments(created_by);

-- 5. Verificar
DO $$
BEGIN
  RAISE NOTICE 'Campos created_by adicionados com sucesso!';
END;
$$;
