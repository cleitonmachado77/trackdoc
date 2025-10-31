-- ========================================
-- DIAGNÓSTICO: FUNCIONÁRIOS DOS DEPARTAMENTOS
-- ========================================

-- 1. Verificar se a tabela user_departments tem dados
SELECT 
    'Total de relacionamentos user_departments' as descricao,
    COUNT(*) as quantidade
FROM user_departments;

-- 2. Verificar departamentos e seus funcionários
SELECT 
    d.id as department_id,
    d.name as department_name,
    d.entity_id as department_entity_id,
    d.manager_id,
    d.manager_name,
    COUNT(ud.user_id) as total_funcionarios_tabela,
    d.user_count as contador_cache
FROM departments d
LEFT JOIN user_departments ud ON d.id = ud.department_id
GROUP BY d.id, d.name, d.entity_id, d.manager_id, d.manager_name, d.user_count
ORDER BY d.name;

-- 3. Verificar funcionários e seus departamentos
SELECT 
    p.id as user_id,
    p.full_name,
    p.email,
    p.entity_id as user_entity_id,
    COUNT(ud.department_id) as total_departamentos
FROM profiles p
LEFT JOIN user_departments ud ON p.id = ud.user_id
GROUP BY p.id, p.full_name, p.email, p.entity_id
ORDER BY p.full_name;

-- 4. Verificar se há problemas de isolamento por entidade
SELECT 
    'Relacionamentos com entidades diferentes' as problema,
    ud.id as user_department_id,
    p.full_name as user_name,
    p.entity_id as user_entity_id,
    d.name as department_name,
    d.entity_id as department_entity_id
FROM user_departments ud
JOIN profiles p ON ud.user_id = p.id
JOIN departments d ON ud.department_id = d.id
WHERE p.entity_id != d.entity_id;

-- 5. Verificar funcionários disponíveis (sem departamento)
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.entity_id,
    'Funcionário sem departamento' as status
FROM profiles p
LEFT JOIN user_departments ud ON p.id = ud.user_id
WHERE ud.user_id IS NULL
ORDER BY p.full_name;

-- 6. Verificar se os gerentes estão na tabela user_departments
SELECT 
    d.id as department_id,
    d.name as department_name,
    d.manager_id,
    d.manager_name,
    CASE 
        WHEN ud.user_id IS NOT NULL THEN '✅ Gerente está na tabela user_departments'
        ELSE '❌ Gerente NÃO está na tabela user_departments'
    END as status_gerente
FROM departments d
LEFT JOIN user_departments ud ON d.manager_id = ud.user_id AND d.id = ud.department_id
WHERE d.manager_id IS NOT NULL
ORDER BY d.name;

-- 7. Verificar contadores de funcionários nos departamentos
SELECT 
    d.name as department_name,
    d.user_count as contador_cache,
    COUNT(ud.user_id) as contador_real,
    CASE 
        WHEN d.user_count = COUNT(ud.user_id) THEN '✅ Contadores corretos'
        ELSE '❌ Contadores divergentes'
    END as status_contador
FROM departments d
LEFT JOIN user_departments ud ON d.id = ud.department_id
GROUP BY d.id, d.name, d.user_count
ORDER BY d.name;