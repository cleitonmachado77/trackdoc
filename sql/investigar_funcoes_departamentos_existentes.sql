-- ========================================
-- INVESTIGAÇÃO: FUNÇÕES DE DEPARTAMENTOS EXISTENTES
-- ========================================

-- 1. Verificar se as funções existem e seus detalhes
SELECT 
    'FUNÇÕES EXISTENTES' as categoria,
    routine_name,
    routine_type,
    data_type as return_type,
    routine_body,
    is_deterministic,
    security_type
FROM information_schema.routines 
WHERE routine_name IN ('add_user_to_department', 'remove_user_from_department', 'get_department_employees')
  AND routine_schema = 'public'
ORDER BY routine_name;

-- 2. Verificar parâmetros das funções
SELECT 
    'PARÂMETROS DAS FUNÇÕES' as categoria,
    routine_name,
    parameter_name,
    data_type,
    parameter_mode,
    ordinal_position,
    parameter_default
FROM information_schema.parameters 
WHERE specific_schema = 'public'
  AND routine_name IN ('add_user_to_department', 'remove_user_from_department', 'get_department_employees')
ORDER BY routine_name, ordinal_position;

-- 3. Verificar o código fonte das funções (se disponível)
SELECT 
    'CÓDIGO FONTE' as categoria,
    proname as function_name,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname IN ('add_user_to_department', 'remove_user_from_department', 'get_department_employees')
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 4. Verificar dependências das funções
SELECT 
    'DEPENDÊNCIAS' as categoria,
    d.objid,
    d.classid::regclass as object_type,
    d.objsubid,
    d.refclassid::regclass as referenced_type,
    d.refobjid,
    d.refobjsubid,
    d.deptype
FROM pg_depend d
JOIN pg_proc p ON d.objid = p.oid
WHERE p.proname IN ('add_user_to_department', 'remove_user_from_department', 'get_department_employees')
  AND p.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 5. Testar se as funções funcionam (teste básico)
DO $$
BEGIN
    -- Testar se a função add_user_to_department existe e pode ser chamada
    IF EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'add_user_to_department' 
        AND routine_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ Função add_user_to_department existe';
        
        -- Tentar obter a assinatura da função
        RAISE NOTICE 'Assinatura: %', (
            SELECT string_agg(
                parameter_name || ' ' || data_type || 
                CASE WHEN parameter_default IS NOT NULL THEN ' DEFAULT ' || parameter_default ELSE '' END,
                ', ' ORDER BY ordinal_position
            )
            FROM information_schema.parameters 
            WHERE routine_name = 'add_user_to_department' 
            AND specific_schema = 'public'
        );
    ELSE
        RAISE NOTICE '❌ Função add_user_to_department NÃO existe';
    END IF;

    -- Testar se a função remove_user_from_department existe
    IF EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'remove_user_from_department' 
        AND routine_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ Função remove_user_from_department existe';
        
        RAISE NOTICE 'Assinatura: %', (
            SELECT string_agg(
                parameter_name || ' ' || data_type || 
                CASE WHEN parameter_default IS NOT NULL THEN ' DEFAULT ' || parameter_default ELSE '' END,
                ', ' ORDER BY ordinal_position
            )
            FROM information_schema.parameters 
            WHERE routine_name = 'remove_user_from_department' 
            AND specific_schema = 'public'
        );
    ELSE
        RAISE NOTICE '❌ Função remove_user_from_department NÃO existe';
    END IF;
END
$$;

-- 6. Verificar se há outras funções relacionadas a departamentos
SELECT 
    'OUTRAS FUNÇÕES RELACIONADAS' as categoria,
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE (routine_name ILIKE '%department%' OR routine_name ILIKE '%user%')
  AND routine_schema = 'public'
  AND routine_name NOT IN ('add_user_to_department', 'remove_user_from_department', 'get_department_employees')
ORDER BY routine_name;

-- 7. Verificar estado atual da tabela user_departments
SELECT 
    'ESTADO DA TABELA user_departments' as categoria,
    COUNT(*) as total_registros,
    COUNT(DISTINCT user_id) as usuarios_unicos,
    COUNT(DISTINCT department_id) as departamentos_unicos
FROM user_departments;

-- 8. Verificar se há conflitos de tipos
SELECT 
    'ANÁLISE DE TIPOS' as categoria,
    routine_name,
    data_type as current_return_type,
    'JSON' as desired_return_type,
    CASE 
        WHEN data_type = 'json' THEN '✅ Tipo correto'
        ELSE '❌ Tipo precisa ser alterado de ' || data_type || ' para JSON'
    END as status
FROM information_schema.routines 
WHERE routine_name IN ('add_user_to_department', 'remove_user_from_department')
  AND routine_schema = 'public';