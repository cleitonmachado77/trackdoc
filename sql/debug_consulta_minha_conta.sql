-- ========================================
-- DEBUG: CONSULTA DA PÁGINA MINHA CONTA
-- ========================================

-- O problema pode estar na sintaxe do Supabase para relacionamentos
-- Vamos testar se os dados existem e se o JOIN funciona

-- 1. Dados básicos do usuário
SELECT 
    'DADOS BÁSICOS' as categoria,
    id,
    full_name,
    email,
    entity_id,
    department_id,
    registration_type,
    role,
    entity_role,
    last_login
FROM profiles 
WHERE id = 'e35098e0-b687-41fa-95cb-830c6bb4b86d';

-- 2. Verificar se a entidade existe
SELECT 
    'ENTIDADE EXISTE' as categoria,
    id,
    name,
    legal_name
FROM entities 
WHERE id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52';

-- 3. Verificar se o departamento existe
SELECT 
    'DEPARTAMENTO EXISTE' as categoria,
    id,
    name,
    entity_id
FROM departments 
WHERE id = '20b158ec-cbda-411b-8c50-dae8e13465e6';

-- 4. JOIN manual para verificar se funciona
SELECT 
    'JOIN MANUAL' as categoria,
    p.full_name,
    p.entity_id,
    e.name as entity_name,
    p.department_id,
    d.name as department_name,
    p.last_login
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
LEFT JOIN departments d ON p.department_id = d.id
WHERE p.id = 'e35098e0-b687-41fa-95cb-830c6bb4b86d';

-- 5. Verificar se há problema de foreign key constraints
SELECT 
    'FOREIGN KEY CHECK' as categoria,
    p.entity_id as profile_entity_id,
    e.id as entity_table_id,
    CASE 
        WHEN e.id IS NOT NULL THEN '✅ Foreign key válida'
        ELSE '❌ Foreign key inválida - entidade não existe'
    END as status_entity,
    p.department_id as profile_department_id,
    d.id as department_table_id,
    CASE 
        WHEN d.id IS NOT NULL THEN '✅ Foreign key válida'
        ELSE '❌ Foreign key inválida - departamento não existe'
    END as status_department
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
LEFT JOIN departments d ON p.department_id = d.id
WHERE p.id = 'e35098e0-b687-41fa-95cb-830c6bb4b86d';

-- 6. Listar todas as entidades para verificar se o ID está correto
SELECT 
    'TODAS AS ENTIDADES' as categoria,
    id,
    name,
    legal_name,
    created_at
FROM entities
ORDER BY created_at;

-- 7. Verificar se há outros usuários com a mesma entidade
SELECT 
    'USUÁRIOS DA MESMA ENTIDADE' as categoria,
    p.full_name,
    p.email,
    p.registration_type,
    e.name as entity_name
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
WHERE p.entity_id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52'
ORDER BY p.full_name;