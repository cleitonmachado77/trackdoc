-- ========================================
-- POPULAR DADOS DE TESTE PARA DEPARTAMENTOS
-- ========================================

-- 1. Verificar estado atual
SELECT 
    'ESTADO ATUAL' as info,
    (SELECT COUNT(*) FROM departments) as total_departamentos,
    (SELECT COUNT(*) FROM profiles) as total_usuarios,
    (SELECT COUNT(*) FROM user_departments) as total_relacionamentos;

-- 2. Adicionar todos os gerentes à tabela user_departments
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
    SELECT 1 FROM user_departments ud 
    WHERE ud.user_id = d.manager_id 
    AND ud.department_id = d.id
  );

-- 3. Adicionar alguns funcionários aleatórios aos departamentos (se houver usuários disponíveis)
WITH available_users AS (
    SELECT 
        p.id as user_id,
        p.entity_id,
        ROW_NUMBER() OVER (PARTITION BY p.entity_id ORDER BY p.full_name) as rn
    FROM profiles p
    WHERE p.id NOT IN (SELECT user_id FROM user_departments)
),
departments_needing_users AS (
    SELECT 
        d.id as department_id,
        d.entity_id,
        ROW_NUMBER() OVER (PARTITION BY d.entity_id ORDER BY d.name) as dept_rn
    FROM departments d
    WHERE (SELECT COUNT(*) FROM user_departments WHERE department_id = d.id) <= 1
)
INSERT INTO user_departments (user_id, department_id, role_in_department, is_primary, assigned_at)
SELECT 
    au.user_id,
    dnu.department_id,
    'member',
    false,
    NOW()
FROM available_users au
JOIN departments_needing_users dnu ON au.entity_id = dnu.entity_id
WHERE au.rn <= 3 AND dnu.dept_rn <= 5; -- Máximo 3 usuários por entidade, máximo 5 departamentos

-- 4. Atualizar contadores nos departamentos
UPDATE departments 
SET user_count = (
    SELECT COUNT(*) 
    FROM user_departments ud 
    WHERE ud.department_id = departments.id
);

-- 5. Verificar resultado
SELECT 
    'RESULTADO FINAL' as info,
    d.name as department_name,
    d.entity_id,
    d.manager_name,
    COUNT(ud.user_id) as total_funcionarios,
    STRING_AGG(p.full_name, ', ' ORDER BY p.full_name) as funcionarios
FROM departments d
LEFT JOIN user_departments ud ON d.id = ud.department_id
LEFT JOIN profiles p ON ud.user_id = p.id
GROUP BY d.id, d.name, d.entity_id, d.manager_name
ORDER BY d.name;

-- 6. Verificar funcionários disponíveis por entidade
SELECT 
    'FUNCIONÁRIOS DISPONÍVEIS POR ENTIDADE' as info,
    p.entity_id,
    COUNT(*) as total_sem_departamento,
    STRING_AGG(p.full_name, ', ' ORDER BY p.full_name) as nomes
FROM profiles p
WHERE p.id NOT IN (SELECT user_id FROM user_departments)
GROUP BY p.entity_id
ORDER BY p.entity_id;