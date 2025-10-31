-- ========================================
-- CORREÇÃO: INCONSISTÊNCIAS ENTRE PROFILES.DEPARTMENT_ID E USER_DEPARTMENTS
-- ========================================

-- PROBLEMA: Pode haver inconsistências entre o campo department_id na tabela profiles
-- e os relacionamentos na tabela user_departments

-- 1. Verificar estado atual das inconsistências
SELECT 
    'DIAGNÓSTICO INICIAL' as etapa,
    'Usuários com department_id no profile' as metrica,
    COUNT(*) as valor
FROM profiles 
WHERE department_id IS NOT NULL
UNION ALL
SELECT 
    'DIAGNÓSTICO INICIAL',
    'Usuários em user_departments',
    COUNT(DISTINCT user_id)
FROM user_departments
UNION ALL
SELECT 
    'DIAGNÓSTICO INICIAL',
    'Usuários com department_id MAS SEM user_departments',
    COUNT(*)
FROM profiles p
WHERE p.department_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_departments ud 
    WHERE ud.user_id = p.id AND ud.department_id = p.department_id
  )
UNION ALL
SELECT 
    'DIAGNÓSTICO INICIAL',
    'Usuários em user_departments MAS SEM department_id',
    COUNT(DISTINCT ud.user_id)
FROM user_departments ud
WHERE NOT EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = ud.user_id AND p.department_id = ud.department_id
  );

-- 2. Mostrar casos específicos de inconsistência
SELECT 
    'CASOS DE INCONSISTÊNCIA' as categoria,
    p.full_name,
    p.email,
    p.department_id as profile_department_id,
    d1.name as profile_department_name,
    ud.department_id as user_dept_department_id,
    d2.name as user_dept_department_name,
    CASE 
        WHEN p.department_id IS NOT NULL AND ud.department_id IS NULL THEN 'Profile tem dept, user_departments não'
        WHEN p.department_id IS NULL AND ud.department_id IS NOT NULL THEN 'User_departments tem dept, profile não'
        WHEN p.department_id != ud.department_id THEN 'Departamentos diferentes'
        ELSE 'Consistente'
    END as tipo_inconsistencia
FROM profiles p
FULL OUTER JOIN user_departments ud ON p.id = ud.user_id
LEFT JOIN departments d1 ON p.department_id = d1.id
LEFT JOIN departments d2 ON ud.department_id = d2.id
WHERE (
    (p.department_id IS NOT NULL AND ud.department_id IS NULL) OR
    (p.department_id IS NULL AND ud.department_id IS NOT NULL) OR
    (p.department_id != ud.department_id)
)
ORDER BY p.full_name;

-- 3. CORREÇÃO 1: Atualizar profiles.department_id baseado em user_departments
-- (Priorizar user_departments como fonte da verdade)
UPDATE profiles 
SET department_id = (
    SELECT ud.department_id 
    FROM user_departments ud 
    WHERE ud.user_id = profiles.id 
    AND ud.is_primary = true
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1 FROM user_departments ud 
    WHERE ud.user_id = profiles.id 
    AND ud.is_primary = true
);

-- 4. CORREÇÃO 2: Para usuários sem departamento primário, usar o primeiro departamento
UPDATE profiles 
SET department_id = (
    SELECT ud.department_id 
    FROM user_departments ud 
    WHERE ud.user_id = profiles.id 
    ORDER BY ud.assigned_at ASC
    LIMIT 1
)
WHERE department_id IS NULL
  AND EXISTS (
    SELECT 1 FROM user_departments ud 
    WHERE ud.user_id = profiles.id
  );

-- 5. CORREÇÃO 3: Adicionar usuários com department_id à tabela user_departments
INSERT INTO user_departments (user_id, department_id, role_in_department, is_primary, assigned_at, notes)
SELECT 
    p.id,
    p.department_id,
    'member',
    true,
    NOW(),
    'Adicionado automaticamente para corrigir inconsistência'
FROM profiles p
WHERE p.department_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_departments ud 
    WHERE ud.user_id = p.id AND ud.department_id = p.department_id
  );

-- 6. CORREÇÃO 4: Limpar department_id de usuários que não estão em user_departments
-- (Apenas se não houver relacionamento válido)
UPDATE profiles 
SET department_id = NULL
WHERE department_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_departments ud 
    WHERE ud.user_id = profiles.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM departments d 
    WHERE d.manager_id = profiles.id
  );

-- 7. Verificar resultado após correções
SELECT 
    'RESULTADO APÓS CORREÇÕES' as etapa,
    'Usuários com department_id no profile' as metrica,
    COUNT(*) as valor
FROM profiles 
WHERE department_id IS NOT NULL
UNION ALL
SELECT 
    'RESULTADO APÓS CORREÇÕES',
    'Usuários em user_departments',
    COUNT(DISTINCT user_id)
FROM user_departments
UNION ALL
SELECT 
    'RESULTADO APÓS CORREÇÕES',
    'Inconsistências restantes',
    COUNT(*)
FROM profiles p
FULL OUTER JOIN user_departments ud ON p.id = ud.user_id
WHERE (
    (p.department_id IS NOT NULL AND ud.department_id IS NULL) OR
    (p.department_id IS NULL AND ud.department_id IS NOT NULL) OR
    (p.department_id != ud.department_id)
);

-- 8. Verificar usuários e seus departamentos após correção
SELECT 
    'VERIFICAÇÃO FINAL' as categoria,
    p.full_name,
    p.email,
    p.department_id as profile_dept_id,
    d1.name as profile_dept_name,
    COUNT(ud.department_id) as total_departamentos_user_dept,
    STRING_AGG(d2.name, ', ' ORDER BY d2.name) as departamentos_user_dept,
    CASE 
        WHEN p.department_id IS NOT NULL AND COUNT(ud.department_id) > 0 THEN '✅ Consistente'
        WHEN p.department_id IS NULL AND COUNT(ud.department_id) = 0 THEN '✅ Sem departamento'
        WHEN p.department_id IS NULL AND COUNT(ud.department_id) > 0 THEN '⚠️ Profile sem dept mas tem user_departments'
        WHEN p.department_id IS NOT NULL AND COUNT(ud.department_id) = 0 THEN '⚠️ Profile com dept mas sem user_departments'
        ELSE '❓ Estado desconhecido'
    END as status
FROM profiles p
LEFT JOIN departments d1 ON p.department_id = d1.id
LEFT JOIN user_departments ud ON p.id = ud.user_id
LEFT JOIN departments d2 ON ud.department_id = d2.id
GROUP BY p.id, p.full_name, p.email, p.department_id, d1.name
ORDER BY p.full_name;

-- 9. Resumo final
SELECT 
    'RESUMO FINAL' as categoria,
    'Total de usuários' as metrica,
    COUNT(*) as valor
FROM profiles
UNION ALL
SELECT 
    'RESUMO FINAL',
    'Usuários com departamento (profile)',
    COUNT(*)
FROM profiles WHERE department_id IS NOT NULL
UNION ALL
SELECT 
    'RESUMO FINAL',
    'Usuários com departamento (user_departments)',
    COUNT(DISTINCT user_id)
FROM user_departments
UNION ALL
SELECT 
    'RESUMO FINAL',
    'Usuários consistentes',
    COUNT(*)
FROM profiles p
WHERE (
    (p.department_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM user_departments ud 
        WHERE ud.user_id = p.id AND ud.department_id = p.department_id
    )) OR
    (p.department_id IS NULL AND NOT EXISTS (
        SELECT 1 FROM user_departments ud 
        WHERE ud.user_id = p.id
    ))
);