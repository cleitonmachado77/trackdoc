-- ========================================
-- INVESTIGAÇÃO SIMPLES: FUNÇÕES DE DEPARTAMENTOS
-- ========================================

-- 1. Verificar se as funções existem
SELECT 
    'FUNÇÕES EXISTENTES' as categoria,
    routine_name,
    data_type as return_type,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN ('add_user_to_department', 'remove_user_from_department')
  AND routine_schema = 'public'
ORDER BY routine_name;

-- 2. Verificar parâmetros das funções
SELECT 
    'PARÂMETROS' as categoria,
    routine_name,
    parameter_name,
    data_type,
    ordinal_position
FROM information_schema.parameters 
WHERE specific_schema = 'public'
  AND routine_name IN ('add_user_to_department', 'remove_user_from_department')
ORDER BY routine_name, ordinal_position;

-- 3. Verificar o código fonte das funções
SELECT 
    'CÓDIGO FONTE' as categoria,
    proname as function_name,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname IN ('add_user_to_department', 'remove_user_from_department')
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 4. Verificar estado da tabela user_departments
SELECT 
    'TABELA user_departments' as categoria,
    COUNT(*) as total_registros
FROM user_departments;

-- 5. Verificar departamentos e funcionários
SELECT 
    'DEPARTAMENTOS E FUNCIONÁRIOS' as categoria,
    d.name as department_name,
    COUNT(ud.user_id) as funcionarios_count,
    d.user_count as cached_count
FROM departments d
LEFT JOIN user_departments ud ON d.id = ud.department_id
GROUP BY d.id, d.name, d.user_count
ORDER BY d.name;