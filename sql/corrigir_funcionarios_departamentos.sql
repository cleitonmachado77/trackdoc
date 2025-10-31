-- ========================================
-- CORREÇÃO: FUNCIONÁRIOS DOS DEPARTAMENTOS
-- ========================================

-- 1. Primeiro, vamos verificar o estado atual
SELECT 
    'DIAGNÓSTICO INICIAL' as etapa,
    COUNT(*) as total_user_departments
FROM user_departments;

-- 2. Adicionar gerentes à tabela user_departments se não estiverem
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

-- 3. Verificar quantos gerentes foram adicionados
SELECT 
    'Gerentes adicionados à tabela user_departments' as resultado,
    COUNT(*) as quantidade
FROM departments d
JOIN user_departments ud ON d.manager_id = ud.user_id AND d.id = ud.department_id
WHERE d.manager_id IS NOT NULL;

-- 4. Corrigir contadores de funcionários nos departamentos
UPDATE departments 
SET user_count = (
    SELECT COUNT(*) 
    FROM user_departments ud 
    WHERE ud.department_id = departments.id
);

-- 5. Verificar se há problemas de isolamento por entidade
SELECT 
    'PROBLEMAS DE ISOLAMENTO' as etapa,
    COUNT(*) as total_problemas
FROM user_departments ud
JOIN profiles p ON ud.user_id = p.id
JOIN departments d ON ud.department_id = d.id
WHERE p.entity_id != d.entity_id;

-- 6. Remover relacionamentos com entidades diferentes (se houver)
DELETE FROM user_departments 
WHERE id IN (
    SELECT ud.id
    FROM user_departments ud
    JOIN profiles p ON ud.user_id = p.id
    JOIN departments d ON ud.department_id = d.id
    WHERE p.entity_id != d.entity_id
);

-- 7. Verificar resultado final
SELECT 
    d.name as department_name,
    d.entity_id as department_entity,
    COUNT(ud.user_id) as total_funcionarios,
    STRING_AGG(p.full_name, ', ' ORDER BY p.full_name) as funcionarios
FROM departments d
LEFT JOIN user_departments ud ON d.id = ud.department_id
LEFT JOIN profiles p ON ud.user_id = p.id
GROUP BY d.id, d.name, d.entity_id
ORDER BY d.name;

-- 8. Verificar funcionários disponíveis por entidade
SELECT 
    p.entity_id,
    COUNT(*) as total_funcionarios,
    COUNT(ud.user_id) as funcionarios_com_departamento,
    COUNT(*) - COUNT(ud.user_id) as funcionarios_disponiveis
FROM profiles p
LEFT JOIN user_departments ud ON p.id = ud.user_id
GROUP BY p.entity_id
ORDER BY p.entity_id;

-- 9. Resultado final
SELECT 
    'CORREÇÃO CONCLUÍDA' as status,
    (SELECT COUNT(*) FROM user_departments) as total_relacionamentos,
    (SELECT COUNT(*) FROM departments WHERE user_count > 0) as departamentos_com_funcionarios,
    (SELECT COUNT(*) FROM profiles WHERE id NOT IN (SELECT user_id FROM user_departments)) as funcionarios_sem_departamento;