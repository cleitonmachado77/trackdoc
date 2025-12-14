-- =====================================================
-- VERIFICAR CONSTRAINTS DA TABELA DEPARTMENTS
-- =====================================================
-- Execute este SQL no Supabase Dashboard para verificar
-- se a constraint foi alterada corretamente
-- =====================================================

-- 1. Listar todas as constraints da tabela departments
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    string_agg(kcu.column_name, ', ') as columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_name = 'departments'
    AND tc.table_schema = 'public'
GROUP BY tc.constraint_name, tc.constraint_type
ORDER BY tc.constraint_type, tc.constraint_name;

-- 2. Verificar se a constraint antiga ainda existe
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'departments_name_key'
    AND table_name = 'departments'
) as constraint_antiga_existe;

-- 3. Verificar se a nova constraint existe
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'departments_entity_name_unique'
    AND table_name = 'departments'
) as constraint_nova_existe;