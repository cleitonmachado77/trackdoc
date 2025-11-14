-- ============================================================================
-- DIAGNÓSTICO E CORREÇÃO - DEPARTAMENTOS E GERENTES
-- Data: 14/11/2025
-- ============================================================================

-- ============================================================================
-- PARTE 1: DIAGNÓSTICO
-- ============================================================================

-- 1.1 Verificar estrutura da tabela departments
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'departments'
ORDER BY ordinal_position;

-- 1.2 Verificar foreign keys
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'departments'
    AND tc.constraint_type = 'FOREIGN KEY';

-- 1.3 Verificar todos os departamentos e seus gerentes
SELECT 
    d.id,
    d.name AS departamento,
    d.manager_id,
    p.full_name AS gerente_nome,
    p.email AS gerente_email,
    d.status,
    d.entity_id,
    d.created_at,
    d.updated_at,
    CASE 
        WHEN d.manager_id IS NULL THEN '❌ SEM GERENTE'
        WHEN p.id IS NULL THEN '⚠️ GERENTE NÃO ENCONTRADO (ID INVÁLIDO)'
        WHEN p.full_name IS NULL OR p.full_name = '' THEN '⚠️ GERENTE SEM NOME'
        ELSE '✅ OK'
    END AS status_gerente
FROM departments d
LEFT JOIN profiles p ON d.manager_id = p.id
ORDER BY d.name;

-- 1.4 Departamentos com problemas críticos
SELECT 
    d.id,
    d.name AS departamento,
    d.manager_id,
    '⚠️ PROBLEMA CRÍTICO: manager_id existe mas usuário não encontrado na tabela profiles' AS problema,
    'Este departamento mostrará o alerta laranja' AS impacto
FROM departments d
LEFT JOIN profiles p ON d.manager_id = p.id
WHERE d.manager_id IS NOT NULL 
    AND p.id IS NULL;

-- 1.5 Verificar se os gerentes têm nomes preenchidos
SELECT 
    d.id,
    d.name AS departamento,
    d.manager_id,
    p.full_name,
    CASE 
        WHEN p.full_name IS NULL THEN '⚠️ PROBLEMA: full_name é NULL'
        WHEN p.full_name = '' THEN '⚠️ PROBLEMA: full_name está vazio'
        ELSE '✅ OK'
    END AS status_nome
FROM departments d
INNER JOIN profiles p ON d.manager_id = p.id
WHERE d.manager_id IS NOT NULL;

-- 1.6 Verificar relação com user_departments
SELECT 
    d.id,
    d.name AS departamento,
    d.manager_id,
    p.full_name AS gerente_nome,
    ud.id AS user_department_id,
    ud.role_in_department,
    CASE 
        WHEN d.manager_id IS NOT NULL AND ud.id IS NULL THEN '⚠️ GERENTE NÃO ESTÁ EM user_departments'
        WHEN d.manager_id IS NOT NULL AND ud.role_in_department != 'manager' THEN '⚠️ GERENTE COM ROLE INCORRETA'
        WHEN d.manager_id IS NOT NULL AND ud.id IS NOT NULL THEN '✅ OK'
        ELSE '➖ SEM GERENTE'
    END AS status_vinculo
FROM departments d
LEFT JOIN profiles p ON d.manager_id = p.id
LEFT JOIN user_departments ud ON ud.user_id = d.manager_id AND ud.department_id = d.id
ORDER BY d.name;

-- 1.7 Estatísticas gerais
SELECT 
    COUNT(*) AS total_departamentos,
    COUNT(d.manager_id) AS com_manager_id,
    COUNT(p.id) AS com_gerente_valido,
    COUNT(*) - COUNT(d.manager_id) AS sem_manager_id,
    COUNT(d.manager_id) - COUNT(p.id) AS manager_id_invalido
FROM departments d
LEFT JOIN profiles p ON d.manager_id = p.id;

-- ============================================================================
-- PARTE 2: CORREÇÕES
-- ============================================================================

-- 2.1 Limpar manager_id inválidos (que apontam para usuários inexistentes)
-- ATENÇÃO: Execute apenas se a query 1.4 mostrou problemas
/*
UPDATE departments d
SET manager_id = NULL,
    updated_at = NOW()
WHERE manager_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM profiles p WHERE p.id = d.manager_id
    );
*/

-- 2.2 Adicionar gerentes à tabela user_departments (se não estiverem)
-- ATENÇÃO: Execute apenas se a query 1.6 mostrou problemas
/*
INSERT INTO user_departments (user_id, department_id, role_in_department, is_primary, assigned_at)
SELECT 
    d.manager_id,
    d.id,
    'manager',
    true,
    NOW()
FROM departments d
WHERE d.manager_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 
        FROM user_departments ud 
        WHERE ud.user_id = d.manager_id 
            AND ud.department_id = d.id
    );
*/

-- 2.3 Corrigir role_in_department para gerentes
-- ATENÇÃO: Execute apenas se a query 1.6 mostrou problemas
/*
UPDATE user_departments ud
SET role_in_department = 'manager',
    is_primary = true
FROM departments d
WHERE ud.user_id = d.manager_id
    AND ud.department_id = d.id
    AND ud.role_in_department != 'manager';
*/

-- ============================================================================
-- PARTE 3: VERIFICAÇÃO DE POLÍTICAS RLS
-- ============================================================================

-- 3.1 Verificar políticas RLS da tabela departments
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'departments'
ORDER BY policyname;

-- 3.2 Verificar políticas RLS da tabela profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 3.3 Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('departments', 'profiles', 'user_departments')
ORDER BY tablename;

-- ============================================================================
-- PARTE 4: TESTES
-- ============================================================================

-- 4.1 Simular a query que o frontend faz
SELECT 
    d.*,
    p.full_name AS manager_full_name
FROM departments d
LEFT JOIN profiles p ON d.manager_id = p.id
WHERE d.entity_id = 'ebde2fef-30e2-458b-8721-d86df2f6865b' -- Substitua pelo entity_id correto
ORDER BY d.name;

-- 4.2 Verificar um departamento específico (substitua o ID)
/*
SELECT 
    d.id,
    d.name,
    d.manager_id,
    p.full_name AS manager_name,
    p.email AS manager_email,
    d.status,
    d.entity_id
FROM departments d
LEFT JOIN profiles p ON d.manager_id = p.id
WHERE d.id = 'SEU_DEPARTMENT_ID_AQUI';
*/

-- ============================================================================
-- PARTE 5: QUERIES ÚTEIS PARA DEBUG
-- ============================================================================

-- 5.1 Listar todos os usuários que são gerentes
SELECT 
    p.id,
    p.full_name,
    p.email,
    COUNT(d.id) AS departamentos_gerenciados,
    STRING_AGG(d.name, ', ') AS departamentos
FROM profiles p
INNER JOIN departments d ON p.id = d.manager_id
GROUP BY p.id, p.full_name, p.email
ORDER BY departamentos_gerenciados DESC;

-- 5.2 Verificar departamentos sem gerente
SELECT 
    d.id,
    d.name,
    d.status,
    d.entity_id,
    d.created_at
FROM departments d
WHERE d.manager_id IS NULL
ORDER BY d.created_at DESC;

-- 5.3 Verificar histórico de atualizações recentes
SELECT 
    d.id,
    d.name,
    d.manager_id,
    p.full_name AS manager_name,
    d.updated_at,
    d.created_at
FROM departments d
LEFT JOIN profiles p ON d.manager_id = p.id
ORDER BY d.updated_at DESC
LIMIT 20;

-- ============================================================================
-- INSTRUÇÕES DE USO
-- ============================================================================

/*
1. Execute as queries da PARTE 1 (DIAGNÓSTICO) para identificar problemas
2. Analise os resultados e identifique quais correções são necessárias
3. Se necessário, descomente e execute as queries da PARTE 2 (CORREÇÕES)
4. Execute as queries da PARTE 3 para verificar políticas RLS
5. Execute as queries da PARTE 4 para testar se tudo está funcionando
6. Use as queries da PARTE 5 para debug adicional se necessário

IMPORTANTE: 
- As queries de correção (PARTE 2) estão comentadas por segurança
- Analise os resultados antes de executar qualquer UPDATE ou INSERT
- Faça backup antes de executar correções
- Teste em ambiente de desenvolvimento primeiro
*/
