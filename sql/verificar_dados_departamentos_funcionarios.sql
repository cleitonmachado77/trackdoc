-- ========================================
-- VERIFICAÇÃO: DADOS DE DEPARTAMENTOS E FUNCIONÁRIOS
-- ========================================

-- 1. Verificar dados básicos das tabelas
SELECT 
    'CONTAGEM GERAL' as categoria,
    'departments' as tabela,
    COUNT(*) as total
FROM departments
UNION ALL
SELECT 
    'CONTAGEM GERAL',
    'user_departments',
    COUNT(*)
FROM user_departments
UNION ALL
SELECT 
    'CONTAGEM GERAL',
    'profiles',
    COUNT(*)
FROM profiles;

-- 2. Verificar departamentos e seus dados
SELECT 
    'DEPARTAMENTOS' as categoria,
    d.id,
    d.name,
    d.manager_id,
    d.entity_id,
    d.status,
    p.full_name as manager_name
FROM departments d
LEFT JOIN profiles p ON d.manager_id = p.id
ORDER BY d.name;

-- 3. Verificar relacionamentos user_departments existentes
SELECT 
    'RELACIONAMENTOS EXISTENTES' as categoria,
    ud.id,
    ud.user_id,
    ud.department_id,
    ud.role_in_department,
    ud.is_primary,
    p.full_name as user_name,
    d.name as department_name
FROM user_departments ud
JOIN profiles p ON ud.user_id = p.id
JOIN departments d ON ud.department_id = d.id
ORDER BY d.name, p.full_name;

-- 4. Verificar departamentos SEM funcionários
SELECT 
    'DEPARTAMENTOS SEM FUNCIONÁRIOS' as categoria,
    d.id,
    d.name,
    d.manager_id,
    p.full_name as manager_name,
    'Departamento vazio' as problema
FROM departments d
LEFT JOIN profiles p ON d.manager_id = p.id
WHERE NOT EXISTS (
    SELECT 1 FROM user_departments ud 
    WHERE ud.department_id = d.id
)
ORDER BY d.name;

-- 5. Verificar se gerentes estão como funcionários
SELECT 
    'GERENTES COMO FUNCIONÁRIOS' as categoria,
    d.name as department_name,
    d.manager_id,
    p.full_name as manager_name,
    CASE 
        WHEN ud.user_id IS NOT NULL THEN '✅ Gerente está na tabela user_departments'
        ELSE '❌ Gerente NÃO está na tabela user_departments'
    END as status
FROM departments d
LEFT JOIN profiles p ON d.manager_id = p.id
LEFT JOIN user_departments ud ON d.manager_id = ud.user_id AND d.id = ud.department_id
WHERE d.manager_id IS NOT NULL
ORDER BY d.name;

-- 6. Verificar usuários disponíveis (sem departamento)
SELECT 
    'USUÁRIOS SEM DEPARTAMENTO' as categoria,
    p.id,
    p.full_name,
    p.email,
    p.entity_id,
    'Disponível para adicionar' as status
FROM profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM user_departments ud 
    WHERE ud.user_id = p.id
)
ORDER BY p.full_name;

-- 7. Verificar isolamento por entidade
SELECT 
    'ISOLAMENTO POR ENTIDADE' as categoria,
    p.entity_id as user_entity,
    d.entity_id as dept_entity,
    COUNT(*) as relacionamentos,
    CASE 
        WHEN p.entity_id = d.entity_id THEN '✅ Mesma entidade'
        ELSE '❌ Entidades diferentes'
    END as status
FROM user_departments ud
JOIN profiles p ON ud.user_id = p.id
JOIN departments d ON ud.department_id = d.id
GROUP BY p.entity_id, d.entity_id
ORDER BY status DESC;

-- 8. Resumo por departamento
SELECT 
    'RESUMO POR DEPARTAMENTO' as categoria,
    d.name as department_name,
    d.entity_id,
    COUNT(ud.user_id) as funcionarios_count,
    STRING_AGG(p.full_name, ', ' ORDER BY p.full_name) as funcionarios_nomes
FROM departments d
LEFT JOIN user_departments ud ON d.id = ud.department_id
LEFT JOIN profiles p ON ud.user_id = p.id
GROUP BY d.id, d.name, d.entity_id
ORDER BY d.name;