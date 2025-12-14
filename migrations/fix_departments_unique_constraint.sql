-- =====================================================
-- MIGRAÇÃO: Corrigir constraint única de departamentos
-- =====================================================
-- Problema: A constraint departments_name_key exige nome único
-- em todo o sistema, mas deveria ser único apenas por entidade.
-- 
-- Solução: Remover a constraint antiga e criar uma nova que
-- considera entity_id + name como chave única.
-- =====================================================

-- 1. Remover a constraint única antiga (apenas no nome)
ALTER TABLE public.departments 
DROP CONSTRAINT IF EXISTS departments_name_key;

-- 2. Criar nova constraint única composta (entity_id + name)
-- Isso permite que diferentes entidades tenham departamentos com o mesmo nome
ALTER TABLE public.departments 
ADD CONSTRAINT departments_entity_name_unique UNIQUE (entity_id, name);

-- 3. Criar índice para melhorar performance de buscas por nome dentro da entidade
CREATE INDEX IF NOT EXISTS idx_departments_entity_name 
ON public.departments (entity_id, name);

-- =====================================================
-- VERIFICAÇÃO (opcional - execute para confirmar)
-- =====================================================
-- SELECT 
--   tc.constraint_name,
--   tc.constraint_type,
--   kcu.column_name
-- FROM information_schema.table_constraints tc
-- JOIN information_schema.key_column_usage kcu
--   ON tc.constraint_name = kcu.constraint_name
-- WHERE tc.table_name = 'departments'
--   AND tc.table_schema = 'public'
-- ORDER BY tc.constraint_type, kcu.column_name;