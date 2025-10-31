-- ========================================
-- VERIFICAÇÃO DA ESTRUTURA DE DEPARTAMENTOS
-- ========================================

-- 1. Verificar se a tabela user_departments existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_departments') 
        THEN '✅ Tabela user_departments existe'
        ELSE '❌ Tabela user_departments NÃO existe'
    END as status_tabela;

-- 2. Verificar se as funções existem
SELECT 
    routine_name,
    CASE 
        WHEN routine_name IS NOT NULL THEN '✅ Função existe'
        ELSE '❌ Função NÃO existe'
    END as status
FROM information_schema.routines 
WHERE routine_name IN ('add_user_to_department', 'remove_user_from_department', 'get_department_employees')
  AND routine_schema = 'public'
ORDER BY routine_name;

-- 3. Se a tabela existe, verificar sua estrutura
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_departments') THEN
        RAISE NOTICE '=== ESTRUTURA DA TABELA user_departments ===';
    END IF;
END
$$;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_departments'
ORDER BY ordinal_position;

-- 4. Verificar dados existentes
SELECT 
    'Total de relacionamentos user_departments' as descricao,
    COUNT(*) as quantidade
FROM user_departments
WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_departments');

-- 5. Verificar departamentos sem funcionários
SELECT 
    d.id,
    d.name,
    d.manager_name,
    COUNT(ud.user_id) as total_funcionarios
FROM departments d
LEFT JOIN user_departments ud ON d.id = ud.department_id
WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_departments')
GROUP BY d.id, d.name, d.manager_name
ORDER BY total_funcionarios DESC, d.name;

-- 6. Verificar se há funcionários sem departamento
SELECT 
    p.id,
    p.full_name,
    p.email,
    COUNT(ud.department_id) as total_departamentos
FROM profiles p
LEFT JOIN user_departments ud ON p.id = ud.user_id
WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_departments')
GROUP BY p.id, p.full_name, p.email
HAVING COUNT(ud.department_id) = 0
ORDER BY p.full_name;