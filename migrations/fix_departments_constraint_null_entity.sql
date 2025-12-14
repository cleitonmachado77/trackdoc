-- =====================================================
-- MIGRAÇÃO: Suportar departamentos para usuários solo
-- =====================================================
-- Problema: A constraint UNIQUE (entity_id, name) não funciona
-- bem com NULL porque NULL != NULL em SQL.
-- 
-- Solução: Criar um índice único parcial que trata NULLs
-- =====================================================

-- 1. Remover a constraint única existente
ALTER TABLE public.departments 
DROP CONSTRAINT IF EXISTS departments_entity_name_unique;

-- 2. Criar índice único para departamentos COM entity_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_departments_entity_name_unique 
ON public.departments (entity_id, name) 
WHERE entity_id IS NOT NULL;

-- 3. Criar índice único para departamentos SEM entity_id (usuários solo)
-- Isso garante que não haja nomes duplicados entre departamentos sem entidade
CREATE UNIQUE INDEX IF NOT EXISTS idx_departments_name_null_entity 
ON public.departments (name) 
WHERE entity_id IS NULL;

-- 4. Verificar resultado
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'departments' 
AND schemaname = 'public'
ORDER BY indexname;