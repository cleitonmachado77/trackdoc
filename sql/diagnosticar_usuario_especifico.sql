-- ========================================
-- DIAGNÓSTICO: USUÁRIO ESPECÍFICO COM PROBLEMAS
-- ========================================

-- Este script vai diagnosticar os problemas específicos do usuário atual
-- que está vendo dados incorretos na página "Minha Conta"

-- 1. Identificar o usuário atual (substitua pelo seu email se necessário)
-- Vamos buscar usuários que podem ser admin de entidade
SELECT 
    'USUÁRIOS ADMIN DE ENTIDADE' as categoria,
    p.id,
    p.full_name,
    p.email,
    p.role,
    p.entity_id,
    p.department_id,
    p.registration_type,
    p.entity_role,
    p.last_login,
    e.name as entity_name,
    d.name as department_name
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
LEFT JOIN departments d ON p.department_id = d.id
WHERE p.role IN ('admin', 'super_admin') 
   OR p.registration_type = 'entity_admin'
   OR p.entity_role = 'admin'
ORDER BY p.created_at DESC;

-- 2. Verificar se há entidades sem usuários admin
SELECT 
    'ENTIDADES SEM ADMIN' as categoria,
    e.id,
    e.name,
    e.legal_name,
    'Entidade sem admin definido' as problema
FROM entities e
WHERE NOT EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.entity_id = e.id 
    AND (p.role = 'admin' OR p.entity_role = 'admin' OR p.registration_type = 'entity_admin')
)
ORDER BY e.name;

-- 3. Verificar usuários com entity_id NULL que deveriam ter
SELECT 
    'USUÁRIOS SEM ENTITY_ID' as categoria,
    p.id,
    p.full_name,
    p.email,
    p.role,
    p.registration_type,
    p.entity_role,
    'Deveria ter entity_id mas está NULL' as problema
FROM profiles p
WHERE p.entity_id IS NULL
  AND (p.registration_type IN ('entity_admin', 'entity_user') 
       OR p.entity_role IS NOT NULL)
ORDER BY p.full_name;

-- 4. Verificar usuários sem departamento que deveriam ter
SELECT 
    'USUÁRIOS SEM DEPARTAMENTO' as categoria,
    p.id,
    p.full_name,
    p.email,
    p.entity_id,
    e.name as entity_name,
    p.department_id,
    'Tem entidade mas não tem departamento' as problema
FROM profiles p
JOIN entities e ON p.entity_id = e.id
WHERE p.department_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_departments ud 
    WHERE ud.user_id = p.id
  )
ORDER BY p.full_name;

-- 5. Verificar usuários sem last_login
SELECT 
    'USUÁRIOS SEM LAST_LOGIN' as categoria,
    p.id,
    p.full_name,
    p.email,
    p.entity_id,
    p.last_login,
    p.created_at,
    'Last login está NULL' as problema
FROM profiles p
WHERE p.last_login IS NULL
ORDER BY p.created_at DESC;

-- 6. Simular a consulta que a página "Minha Conta" faz
-- (Para todos os usuários admin)
SELECT 
    'SIMULAÇÃO CONSULTA MINHA CONTA' as categoria,
    p.id,
    p.full_name,
    p.email,
    p.role,
    p.entity_id,
    p.department_id,
    p.last_login,
    p.registration_type,
    p.entity_role,
    e.name as entity_name,
    e.legal_name as entity_legal_name,
    d.name as department_name,
    -- Simular o que aparece na tela
    CASE 
        WHEN e.name IS NOT NULL THEN e.name
        ELSE 'Usuário Individual'
    END as tela_entidade,
    CASE 
        WHEN d.name IS NOT NULL THEN d.name
        ELSE 'N/A'
    END as tela_departamento,
    CASE 
        WHEN p.last_login IS NOT NULL THEN TO_CHAR(p.last_login, 'DD/MM/YYYY HH24:MI')
        ELSE 'N/A'
    END as tela_ultimo_login
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
LEFT JOIN departments d ON p.department_id = d.id
WHERE p.role IN ('admin', 'super_admin') 
   OR p.registration_type = 'entity_admin'
   OR p.entity_role = 'admin'
ORDER BY p.full_name;

-- 7. Verificar relacionamentos user_departments para admins
SELECT 
    'ADMINS EM USER_DEPARTMENTS' as categoria,
    p.full_name,
    p.email,
    p.role,
    d.name as department_name,
    ud.role_in_department,
    ud.is_primary,
    ud.assigned_at
FROM profiles p
JOIN user_departments ud ON p.id = ud.user_id
JOIN departments d ON ud.department_id = d.id
WHERE p.role IN ('admin', 'super_admin') 
   OR p.registration_type = 'entity_admin'
   OR p.entity_role = 'admin'
ORDER BY p.full_name;

-- 8. Verificar se há departamentos sem entidade (problema de isolamento)
SELECT 
    'DEPARTAMENTOS SEM ENTIDADE' as categoria,
    d.id,
    d.name,
    d.entity_id,
    'Departamento sem entity_id' as problema
FROM departments d
WHERE d.entity_id IS NULL
ORDER BY d.name;