-- ========================================
-- TESTE: CONSULTA SUPABASE PARA PÁGINA MINHA CONTA
-- ========================================

-- A página "Minha Conta" usa esta consulta Supabase:
-- .select(`*, entity:entities(name, legal_name), department:departments(name)`)

-- Vamos testar se os dados estão corretos para essa consulta

-- 1. Verificar se a entidade existe
SELECT 
    'ENTIDADE' as tipo,
    id,
    name,
    legal_name,
    created_at
FROM entities 
WHERE id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52';

-- 2. Verificar se o departamento existe
SELECT 
    'DEPARTAMENTO' as tipo,
    id,
    name,
    entity_id,
    created_at
FROM departments 
WHERE id = '20b158ec-cbda-411b-8c50-dae8e13465e6';

-- 3. Verificar o perfil do usuário
SELECT 
    'PERFIL' as tipo,
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

-- 4. Simular a consulta do Supabase com JOIN manual
SELECT 
    'SIMULAÇÃO CONSULTA SUPABASE' as resultado,
    -- Dados do perfil
    p.id,
    p.full_name,
    p.email,
    p.entity_id,
    p.department_id,
    p.registration_type,
    p.role,
    p.entity_role,
    p.last_login,
    -- Dados da entidade (como o Supabase retornaria)
    json_build_object(
        'name', e.name,
        'legal_name', e.legal_name
    ) as entity_object,
    -- Dados do departamento (como o Supabase retornaria)
    json_build_object(
        'name', d.name
    ) as department_object,
    -- O que deveria aparecer na tela
    COALESCE(e.name, 'Usuário Individual') as tela_entidade,
    COALESCE(d.name, 'N/A') as tela_departamento,
    CASE 
        WHEN p.last_login IS NOT NULL THEN TO_CHAR(p.last_login, 'DD/MM/YYYY HH24:MI')
        ELSE 'N/A'
    END as tela_ultimo_login
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
LEFT JOIN departments d ON p.department_id = d.id
WHERE p.id = 'e35098e0-b687-41fa-95cb-830c6bb4b86d';

-- 5. Verificar se há problema de foreign key
SELECT 
    'VERIFICAR FOREIGN KEYS' as teste,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'profiles'
    AND kcu.column_name IN ('entity_id', 'department_id');

-- 6. Teste final: verificar se o problema é no frontend
-- Esta consulta simula exatamente o que o Supabase deveria retornar
WITH profile_data AS (
    SELECT 
        p.*,
        e.name as entity_name,
        e.legal_name as entity_legal_name,
        d.name as department_name
    FROM profiles p
    LEFT JOIN entities e ON p.entity_id = e.id
    LEFT JOIN departments d ON p.department_id = d.id
    WHERE p.id = 'e35098e0-b687-41fa-95cb-830c6bb4b86d'
)
SELECT 
    'RESULTADO ESPERADO NA TELA' as categoria,
    pd.full_name as usuario,
    -- Função
    CASE 
        WHEN pd.role = 'super_admin' THEN 'Super Admin'
        WHEN pd.role = 'admin' THEN 'Administrador'
        WHEN pd.role = 'manager' THEN 'Gerente'
        WHEN pd.role = 'user' THEN 'Usuário'
        WHEN pd.role = 'viewer' THEN 'Visualizador'
        ELSE 'N/A'
    END as tela_funcao,
    -- Entidade (ESTE É O PROBLEMA)
    COALESCE(pd.entity_name, 'Usuário Individual') as tela_entidade,
    -- Departamento
    COALESCE(pd.department_name, 'N/A') as tela_departamento,
    -- Tipo de Registro
    CASE 
        WHEN pd.registration_type = 'individual' THEN 'Individual'
        WHEN pd.registration_type = 'entity_admin' THEN 'Admin da Entidade'
        WHEN pd.registration_type = 'entity_user' THEN 'Usuário da Entidade'
        ELSE 'N/A'
    END as tela_tipo_registro,
    -- Último Login
    CASE 
        WHEN pd.last_login IS NOT NULL THEN TO_CHAR(pd.last_login, 'DD/MM/YYYY HH24:MI')
        ELSE 'N/A'
    END as tela_ultimo_login
FROM profile_data pd;