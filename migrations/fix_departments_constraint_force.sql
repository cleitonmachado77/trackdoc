-- =====================================================
-- MIGRAÇÃO FORÇADA: Corrigir constraint de departamentos
-- =====================================================
-- Execute este SQL no Supabase Dashboard
-- =====================================================

-- 1. Remover TODAS as constraints únicas relacionadas ao nome
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Buscar e remover constraints únicas que envolvem a coluna 'name'
    FOR r IN (
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'departments'
            AND tc.table_schema = 'public'
            AND tc.constraint_type = 'UNIQUE'
            AND kcu.column_name = 'name'
    ) LOOP
        EXECUTE 'ALTER TABLE public.departments DROP CONSTRAINT IF EXISTS ' || r.constraint_name;
        RAISE NOTICE 'Removida constraint: %', r.constraint_name;
    END LOOP;
END $$;

-- 2. Remover índices únicos que possam existir
DROP INDEX IF EXISTS departments_name_key;
DROP INDEX IF EXISTS idx_departments_name;
DROP INDEX IF EXISTS departments_name_idx;

-- 3. Criar a nova constraint correta (entity_id + name)
ALTER TABLE public.departments 
ADD CONSTRAINT departments_entity_name_unique UNIQUE (entity_id, name);

-- 4. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_departments_entity_name 
ON public.departments (entity_id, name);

-- 5. Verificar resultado
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    string_agg(kcu.column_name, ', ') as columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'departments'
    AND tc.table_schema = 'public'
    AND tc.constraint_type = 'UNIQUE'
GROUP BY tc.constraint_name, tc.constraint_type;