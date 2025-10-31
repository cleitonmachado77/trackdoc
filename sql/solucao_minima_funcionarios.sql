-- ========================================
-- SOLUÇÃO MÍNIMA: FUNCIONÁRIOS DOS DEPARTAMENTOS
-- ========================================

-- Verificar se há dados na tabela user_departments
SELECT COUNT(*) as total_user_departments FROM user_departments;

-- Se a tabela estiver vazia ou quase vazia, adicionar pelo menos os gerentes
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

-- Verificar resultado
SELECT 
    d.name as department_name,
    COUNT(ud.user_id) as funcionarios_count,
    STRING_AGG(p.full_name, ', ') as funcionarios_nomes
FROM departments d
LEFT JOIN user_departments ud ON d.id = ud.department_id
LEFT JOIN profiles p ON ud.user_id = p.id
GROUP BY d.id, d.name
ORDER BY d.name;