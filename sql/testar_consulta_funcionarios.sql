-- ========================================
-- TESTE: CONSULTA DE FUNCIONÁRIOS POR DEPARTAMENTO
-- ========================================

-- Simular a consulta que o frontend faz
-- Substitua 'DEPARTMENT_ID_AQUI' pelo ID real de um departamento

-- 1. Buscar relacionamentos user_departments para um departamento específico
SELECT 
    'PASSO 1: Relacionamentos user_departments' as etapa,
    ud.*
FROM user_departments ud
WHERE ud.department_id = (SELECT id FROM departments LIMIT 1); -- Pega o primeiro departamento

-- 2. Buscar perfis dos usuários (com filtro de entidade)
WITH department_users AS (
    SELECT ud.user_id, ud.role_in_department, ud.is_primary, ud.assigned_at
    FROM user_departments ud
    WHERE ud.department_id = (SELECT id FROM departments LIMIT 1)
)
SELECT 
    'PASSO 2: Perfis dos usuários' as etapa,
    p.*,
    du.role_in_department,
    du.is_primary,
    du.assigned_at
FROM profiles p
JOIN department_users du ON p.id = du.user_id
WHERE p.entity_id = (
    SELECT entity_id FROM departments WHERE id = (SELECT id FROM departments LIMIT 1)
);

-- 3. Buscar gerente do departamento
SELECT 
    'PASSO 3: Gerente do departamento' as etapa,
    d.id as department_id,
    d.name as department_name,
    d.manager_id,
    d.manager_name,
    p.full_name as manager_full_name
FROM departments d
LEFT JOIN profiles p ON d.manager_id = p.id
WHERE d.id = (SELECT id FROM departments LIMIT 1);

-- 4. Consulta completa simulando o que o frontend faz
WITH target_department AS (
    SELECT id, entity_id, manager_id FROM departments LIMIT 1
),
department_users AS (
    SELECT ud.user_id, ud.role_in_department, ud.is_primary, ud.assigned_at
    FROM user_departments ud, target_department td
    WHERE ud.department_id = td.id
)
SELECT 
    'RESULTADO FINAL' as etapa,
    p.id,
    p.full_name,
    p.email,
    p.role,
    p.entity_id,
    du.role_in_department,
    du.is_primary,
    du.assigned_at,
    (p.id = td.manager_id) as is_manager
FROM profiles p
JOIN department_users du ON p.id = du.user_id
JOIN target_department td ON p.entity_id = td.entity_id
ORDER BY p.full_name;

-- 5. Verificar funcionários disponíveis (sem departamento)
SELECT 
    'FUNCIONÁRIOS DISPONÍVEIS' as etapa,
    p.id,
    p.full_name,
    p.email,
    p.entity_id
FROM profiles p
WHERE p.entity_id = (SELECT entity_id FROM departments LIMIT 1)
  AND p.id NOT IN (
    SELECT DISTINCT user_id 
    FROM user_departments ud
    JOIN departments d ON ud.department_id = d.id
    WHERE d.entity_id = p.entity_id
  )
ORDER BY p.full_name;

-- 6. Resumo por departamento
SELECT 
    d.name as department_name,
    d.entity_id,
    d.manager_name,
    COUNT(ud.user_id) as funcionarios_na_tabela,
    d.user_count as contador_cache,
    CASE 
        WHEN COUNT(ud.user_id) = 0 THEN '❌ Sem funcionários'
        WHEN COUNT(ud.user_id) != d.user_count THEN '⚠️ Contador divergente'
        ELSE '✅ OK'
    END as status
FROM departments d
LEFT JOIN user_departments ud ON d.id = ud.department_id
GROUP BY d.id, d.name, d.entity_id, d.manager_name, d.user_count
ORDER BY d.name;