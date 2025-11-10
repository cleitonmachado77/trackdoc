-- ========================================
-- CORREÇÃO: Constraint de Unicidade de Categorias
-- ========================================
-- Execute este script no Supabase SQL Editor
-- Dashboard > SQL Editor > New Query > Cole e Execute
-- ========================================

-- Passo 1: Remover constraint global antiga
ALTER TABLE public.categories 
DROP CONSTRAINT IF EXISTS categories_name_key;

-- Passo 2: Adicionar constraint única por entidade
-- Agora cada entidade pode ter suas próprias categorias
ALTER TABLE public.categories 
ADD CONSTRAINT categories_name_entity_unique 
UNIQUE (name, entity_id);

-- Passo 3: Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_categories_name_entity 
ON public.categories (name, entity_id);

-- Passo 4: Verificar se funcionou
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.categories'::regclass
  AND conname LIKE '%name%';

-- ========================================
-- Resultado esperado:
-- categories_name_entity_unique | u | UNIQUE (name, entity_id)
-- ========================================
