-- ========================================
-- TESTAR: CORREÇÃO DO HOOK DE FUNCIONÁRIOS
-- ========================================

-- Simular o que o hook corrigido fará agora

-- 1. Verificar entity_ids dos usuários no sistema
SELECT 
    'ENTITY_IDS DOS USUÁRIOS' as categoria,
    COALESCE(entity_id::text, 'NULL (usuário solo)') as entity_id,
    COUNT(*) as total_usuarios,
    STRING_AGG(full_name, ', ' ORDER BY full_name) as usuarios
FROM profiles
GROUP BY entity_id
ORDER BY entity_id;

-- 2. Para cada departamento, simular a consulta corrigida
-- Departamento LIC (entity_id: cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52)
WITH departamento_lic AS (
    SELECT id, entity_id FROM departments WHERE name = 'LIC'
),
user_dept_data AS (
    SELECT ud.user_id, ud.role_in_department, ud.is_primary, ud.assigned_at
    FROM user_departments ud, departamento_lic dl
    WHERE ud.department_id = dl.id
)
SELECT 
    'TESTE LIC - COM FILTRO CORRETO' as categoria,
    p.full_name,
    p.entity_id,
    udd.role_in_department,
    '✅ Seria retornado pelo hook corrigido' as status
FROM profiles p
JOIN user_dept_data udd ON p.id = udd.user_id
CROSS JOIN departamento_lic dl
WHERE (
    -- Se departamento tem entity_id, filtrar por ele
    (dl.entity_id IS NOT NULL AND p.entity_id = dl.entity_id)
    OR
    -- Se departamento não tem entity_id, filtrar por usuários sem entity_id
    (dl.entity_id IS NULL AND p.entity_id IS NULL)
);

-- 3. Testar com todos os departamentos
SELECT 
    'TESTE TODOS OS DEPARTAMENTOS' as categoria,
    d.name as department_name,
    d.entity_id as dept_entity_id,
    COUNT(ud.user_id) as total_funcionarios_tabela,
    COUNT(CASE 
        WHEN (d.entity_id IS NOT NULL AND p.entity_id = d.entity_id) 
          OR (d.entity_id IS NULL AND p.entity_id IS NULL) 
        THEN 1 
    END) as funcionarios_que_passariam_filtro,
    STRING_AGG(
        CASE 
            WHEN (d.entity_id IS NOT NULL AND p.entity_id = d.entity_id) 
              OR (d.entity_id IS NULL AND p.entity_id IS NULL) 
            THEN p.full_name 
        END, 
        ', ' 
        ORDER BY p.full_name
    ) as funcionarios_visiveis
FROM departments d
LEFT JOIN user_departments ud ON d.id = ud.department_id
LEFT JOIN profiles p ON ud.user_id = p.id
GROUP BY d.id, d.name, d.entity_id
ORDER BY d.name;

-- 4. Verificar funcionários disponíveis por entidade
SELECT 
    'FUNCIONÁRIOS DISPONÍVEIS POR ENTIDADE' as categoria,
    COALESCE(p.entity_id::text, 'NULL (usuários solo)') as entity_id,
    COUNT(*) as total_usuarios,
    COUNT(ud.user_id) as usuarios_com_departamento,
    COUNT(*) - COUNT(ud.user_id) as usuarios_disponiveis,
    STRING_AGG(
        CASE WHEN ud.user_id IS NULL THEN p.full_name END, 
        ', ' 
        ORDER BY p.full_name
    ) as usuarios_disponiveis_nomes
FROM profiles p
LEFT JOIN user_departments ud ON p.id = ud.user_id
GROUP BY p.entity_id
ORDER BY p.entity_id;

-- 5. Verificar se há problemas de isolamento
SELECT 
    'PROBLEMAS DE ISOLAMENTO' as categoria,
    d.name as department_name,
    d.entity_id as dept_entity_id,
    p.full_name as user_name,
    p.entity_id as user_entity_id,
    CASE 
        WHEN d.entity_id = p.entity_id THEN '✅ Mesma entidade'
        WHEN d.entity_id IS NULL AND p.entity_id IS NULL THEN '✅ Ambos sem entidade'
        ELSE '❌ Entidades diferentes - PROBLEMA!'
    END as status
FROM departments d
JOIN user_departments ud ON d.id = ud.department_id
JOIN profiles p ON ud.user_id = p.id
ORDER BY status DESC, d.name;