-- ========================================
-- INVESTIGAR: PROBLEMA DE ISOLAMENTO POR ENTIDADE
-- ========================================

-- PROBLEMA: O botão funcionários não mostra nada
-- SUSPEITA: Filtro de entity_id está bloqueando os resultados

-- 1. Verificar entity_ids dos departamentos
SELECT 
    'ENTITY_IDS DOS DEPARTAMENTOS' as categoria,
    d.name as department_name,
    d.entity_id as department_entity_id,
    COUNT(ud.user_id) as funcionarios_count
FROM departments d
LEFT JOIN user_departments ud ON d.id = ud.department_id
GROUP BY d.id, d.name, d.entity_id
ORDER BY d.name;

-- 2. Verificar entity_ids dos usuários nos departamentos
SELECT 
    'ENTITY_IDS DOS USUÁRIOS' as categoria,
    d.name as department_name,
    d.entity_id as department_entity_id,
    p.full_name as user_name,
    p.entity_id as user_entity_id,
    CASE 
        WHEN d.entity_id = p.entity_id THEN '✅ Mesma entidade'
        ELSE '❌ Entidades diferentes'
    END as status
FROM departments d
JOIN user_departments ud ON d.id = ud.department_id
JOIN profiles p ON ud.user_id = p.id
ORDER BY d.name, p.full_name;

-- 3. Verificar o entity_id hardcoded no código (fallback)
SELECT 
    'VERIFICAR FALLBACK' as categoria,
    'ebde2fef-30e2-458b-8721-d86df2f6865b' as fallback_entity_id,
    COUNT(*) as departamentos_com_este_entity_id
FROM departments 
WHERE entity_id = 'ebde2fef-30e2-458b-8721-d86df2f6865b';

-- 4. Simular a consulta que o frontend faz
-- Para o departamento LIC (que tem funcionário)
WITH departamento_lic AS (
    SELECT id, entity_id FROM departments WHERE name = 'LIC'
),
relacionamentos_user_departments AS (
    SELECT ud.user_id, ud.role_in_department, ud.is_primary, ud.assigned_at
    FROM user_departments ud, departamento_lic dl
    WHERE ud.department_id = dl.id
)
SELECT 
    'SIMULAÇÃO CONSULTA FRONTEND - LIC' as categoria,
    p.id,
    p.full_name,
    p.entity_id as user_entity_id,
    dl.entity_id as department_entity_id,
    rud.role_in_department,
    CASE 
        WHEN p.entity_id = dl.entity_id THEN '✅ Passaria no filtro'
        ELSE '❌ Seria filtrado'
    END as status_filtro
FROM relacionamentos_user_departments rud
JOIN profiles p ON rud.user_id = p.id
CROSS JOIN departamento_lic dl
ORDER BY p.full_name;

-- 5. Verificar se há usuários sem entity_id (usuários solo)
SELECT 
    'USUÁRIOS SEM ENTITY_ID' as categoria,
    p.id,
    p.full_name,
    p.entity_id,
    'Usuário solo' as tipo
FROM profiles p
WHERE p.entity_id IS NULL
ORDER BY p.full_name;

-- 6. Verificar todos os entity_ids únicos no sistema
SELECT 
    'ENTITY_IDS NO SISTEMA' as categoria,
    entity_id,
    COUNT(*) as total_usuarios
FROM profiles 
WHERE entity_id IS NOT NULL
GROUP BY entity_id
ORDER BY entity_id;

-- 7. Verificar se o problema é com o entity_id específico
-- Testar com um departamento específico
SELECT 
    'TESTE ESPECÍFICO - DEPARTAMENTO LIC' as categoria,
    'Departamento:' as info,
    d.name,
    d.entity_id as dept_entity_id
FROM departments d WHERE d.name = 'LIC'
UNION ALL
SELECT 
    'TESTE ESPECÍFICO - DEPARTAMENTO LIC',
    'Funcionários na tabela user_departments:',
    p.full_name,
    p.entity_id
FROM departments d
JOIN user_departments ud ON d.id = ud.department_id
JOIN profiles p ON ud.user_id = p.id
WHERE d.name = 'LIC';