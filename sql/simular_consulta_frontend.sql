-- ========================================
-- SIMULAR: CONSULTA DO FRONTEND PASSO A PASSO
-- ========================================

-- Simular exatamente o que o hook use-department-employees faz
-- Usando o departamento LIC como exemplo

-- PASSO 1: Buscar relacionamentos user_departments (primeira consulta do hook)
SELECT 
    'PASSO 1: user_departments' as etapa,
    ud.*
FROM user_departments ud
WHERE ud.department_id = (SELECT id FROM departments WHERE name = 'LIC');

-- PASSO 2: Buscar perfis dos usuários COM filtro de entity_id
-- (Esta é a consulta que pode estar falhando)
WITH department_lic AS (
    SELECT id, entity_id FROM departments WHERE name = 'LIC'
),
user_dept_data AS (
    SELECT ud.user_id, ud.role_in_department, ud.is_primary, ud.assigned_at
    FROM user_departments ud, department_lic dl
    WHERE ud.department_id = dl.id
)
SELECT 
    'PASSO 2: profiles COM filtro entity_id' as etapa,
    p.*,
    udd.role_in_department,
    udd.is_primary,
    udd.assigned_at
FROM profiles p
JOIN user_dept_data udd ON p.id = udd.user_id
CROSS JOIN department_lic dl
WHERE p.entity_id = dl.entity_id;  -- Este é o filtro que pode estar causando problema

-- PASSO 3: Buscar perfis dos usuários SEM filtro de entity_id (para comparar)
WITH department_lic AS (
    SELECT id, entity_id FROM departments WHERE name = 'LIC'
),
user_dept_data AS (
    SELECT ud.user_id, ud.role_in_department, ud.is_primary, ud.assigned_at
    FROM user_departments ud, department_lic dl
    WHERE ud.department_id = dl.id
)
SELECT 
    'PASSO 3: profiles SEM filtro entity_id' as etapa,
    p.*,
    udd.role_in_department,
    udd.is_primary,
    udd.assigned_at
FROM profiles p
JOIN user_dept_data udd ON p.id = udd.user_id;

-- PASSO 4: Verificar se o entity_id do departamento bate com o entity_id dos usuários
SELECT 
    'PASSO 4: Verificação de entity_ids' as etapa,
    d.name as department_name,
    d.entity_id as dept_entity_id,
    p.full_name as user_name,
    p.entity_id as user_entity_id,
    CASE 
        WHEN d.entity_id = p.entity_id THEN '✅ Match - usuário seria retornado'
        WHEN d.entity_id IS NULL THEN '⚠️ Departamento sem entity_id'
        WHEN p.entity_id IS NULL THEN '⚠️ Usuário sem entity_id'
        ELSE '❌ No match - usuário seria filtrado'
    END as resultado
FROM departments d
JOIN user_departments ud ON d.id = ud.department_id
JOIN profiles p ON ud.user_id = p.id
WHERE d.name = 'LIC';

-- PASSO 5: Testar com o entity_id hardcoded do código
-- O código usa 'ebde2fef-30e2-458b-8721-d86df2f6865b' como fallback
WITH department_lic AS (
    SELECT id FROM departments WHERE name = 'LIC'
),
user_dept_data AS (
    SELECT ud.user_id, ud.role_in_department, ud.is_primary, ud.assigned_at
    FROM user_departments ud, department_lic dl
    WHERE ud.department_id = dl.id
)
SELECT 
    'PASSO 5: Com entity_id hardcoded' as etapa,
    p.full_name,
    p.entity_id,
    CASE 
        WHEN p.entity_id = 'ebde2fef-30e2-458b-8721-d86df2f6865b' THEN '✅ Seria retornado'
        ELSE '❌ Seria filtrado'
    END as resultado
FROM profiles p
JOIN user_dept_data udd ON p.id = udd.user_id
WHERE p.entity_id = 'ebde2fef-30e2-458b-8721-d86df2f6865b';

-- PASSO 6: Verificar todos os departamentos com o mesmo teste
SELECT 
    'PASSO 6: Todos os departamentos' as etapa,
    d.name as department_name,
    d.entity_id as dept_entity_id,
    COUNT(ud.user_id) as total_funcionarios_tabela,
    COUNT(CASE WHEN p.entity_id = d.entity_id THEN 1 END) as funcionarios_mesma_entidade,
    COUNT(CASE WHEN p.entity_id = 'ebde2fef-30e2-458b-8721-d86df2f6865b' THEN 1 END) as funcionarios_entity_hardcoded
FROM departments d
LEFT JOIN user_departments ud ON d.id = ud.department_id
LEFT JOIN profiles p ON ud.user_id = p.id
GROUP BY d.id, d.name, d.entity_id
ORDER BY d.name;