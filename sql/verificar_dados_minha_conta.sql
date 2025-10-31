-- ========================================
-- VERIFICAÇÃO: DADOS DA PÁGINA MINHA CONTA
-- ========================================

-- 1. Verificar estrutura da tabela profiles
SELECT 
    'ESTRUTURA DA TABELA PROFILES' as categoria,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Verificar dados dos usuários com informações completas
SELECT 
    'DADOS COMPLETOS DOS USUÁRIOS' as categoria,
    p.id,
    p.full_name,
    p.email,
    p.phone,
    p.company,
    p.role,
    p.status,
    p.entity_id,
    p.department_id,
    p.position,
    p.last_login,
    p.registration_type,
    p.entity_role,
    p.created_at,
    p.updated_at,
    e.name as entity_name,
    e.legal_name as entity_legal_name,
    d.name as department_name
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
LEFT JOIN departments d ON p.department_id = d.id
ORDER BY p.full_name;

-- 3. Verificar usuários sem departamento
SELECT 
    'USUÁRIOS SEM DEPARTAMENTO' as categoria,
    p.full_name,
    p.email,
    p.entity_id,
    e.name as entity_name,
    'Sem departamento atribuído' as problema
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
WHERE p.department_id IS NULL
ORDER BY p.full_name;

-- 4. Verificar usuários sem entidade (usuários solo)
SELECT 
    'USUÁRIOS SOLO (SEM ENTIDADE)' as categoria,
    p.full_name,
    p.email,
    p.role,
    p.status,
    p.registration_type,
    p.last_login,
    'Usuário individual' as tipo_usuario
FROM profiles p
WHERE p.entity_id IS NULL
ORDER BY p.full_name;

-- 5. Verificar se há problemas com last_login
SELECT 
    'VERIFICAÇÃO LAST_LOGIN' as categoria,
    p.full_name,
    p.email,
    p.last_login,
    CASE 
        WHEN p.last_login IS NULL THEN '❌ Sem registro de último login'
        WHEN p.last_login < NOW() - INTERVAL '30 days' THEN '⚠️ Login antigo (mais de 30 dias)'
        ELSE '✅ Login recente'
    END as status_login
FROM profiles p
ORDER BY p.last_login DESC NULLS LAST;

-- 6. Verificar tipos de usuário e roles
SELECT 
    'TIPOS DE USUÁRIO E ROLES' as categoria,
    p.role,
    p.registration_type,
    p.entity_role,
    COUNT(*) as quantidade,
    STRING_AGG(p.full_name, ', ' ORDER BY p.full_name) as usuarios
FROM profiles p
GROUP BY p.role, p.registration_type, p.entity_role
ORDER BY p.role, p.registration_type;

-- 7. Verificar departamentos dos usuários (relacionamento user_departments)
SELECT 
    'DEPARTAMENTOS VIA USER_DEPARTMENTS' as categoria,
    p.full_name,
    p.email,
    d.name as department_name,
    ud.role_in_department,
    ud.is_primary,
    ud.assigned_at,
    CASE 
        WHEN p.department_id = d.id THEN '✅ Consistente'
        WHEN p.department_id IS NULL THEN '⚠️ department_id NULL no profile'
        ELSE '❌ Inconsistente'
    END as consistencia
FROM profiles p
JOIN user_departments ud ON p.id = ud.user_id
JOIN departments d ON ud.department_id = d.id
ORDER BY p.full_name;

-- 8. Verificar se há usuários com department_id mas sem relacionamento user_departments
SELECT 
    'USUÁRIOS COM DEPARTMENT_ID MAS SEM USER_DEPARTMENTS' as categoria,
    p.full_name,
    p.email,
    p.department_id,
    d.name as department_name,
    'Inconsistência: tem department_id mas não está em user_departments' as problema
FROM profiles p
JOIN departments d ON p.department_id = d.id
WHERE NOT EXISTS (
    SELECT 1 FROM user_departments ud 
    WHERE ud.user_id = p.id AND ud.department_id = p.department_id
)
ORDER BY p.full_name;

-- 9. Verificar campos obrigatórios para exibição na página Minha Conta
SELECT 
    'CAMPOS OBRIGATÓRIOS PARA MINHA CONTA' as categoria,
    p.full_name,
    p.email,
    CASE WHEN p.full_name IS NULL THEN '❌' ELSE '✅' END as tem_nome,
    CASE WHEN p.email IS NULL THEN '❌' ELSE '✅' END as tem_email,
    CASE WHEN p.role IS NULL THEN '❌' ELSE '✅' END as tem_role,
    CASE WHEN p.status IS NULL THEN '❌' ELSE '✅' END as tem_status,
    CASE WHEN p.last_login IS NULL THEN '❌' ELSE '✅' END as tem_last_login,
    CASE WHEN p.entity_id IS NULL AND p.department_id IS NULL THEN '⚠️ Usuário solo' 
         WHEN p.entity_id IS NOT NULL AND p.department_id IS NULL THEN '⚠️ Sem departamento'
         ELSE '✅' END as tem_organizacao
FROM profiles p
ORDER BY p.full_name;

-- 10. Resumo para diagnóstico
SELECT 
    'RESUMO DIAGNÓSTICO' as categoria,
    'Total de usuários' as metrica,
    COUNT(*) as valor
FROM profiles
UNION ALL
SELECT 
    'RESUMO DIAGNÓSTICO',
    'Usuários com entidade',
    COUNT(*)
FROM profiles WHERE entity_id IS NOT NULL
UNION ALL
SELECT 
    'RESUMO DIAGNÓSTICO',
    'Usuários com departamento (profile)',
    COUNT(*)
FROM profiles WHERE department_id IS NOT NULL
UNION ALL
SELECT 
    'RESUMO DIAGNÓSTICO',
    'Usuários com departamento (user_departments)',
    COUNT(DISTINCT user_id)
FROM user_departments
UNION ALL
SELECT 
    'RESUMO DIAGNÓSTICO',
    'Usuários sem last_login',
    COUNT(*)
FROM profiles WHERE last_login IS NULL;