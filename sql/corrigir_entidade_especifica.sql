-- ========================================
-- CORREÇÃO ESPECÍFICA: ENTIDADE NÃO APARECE
-- ========================================

-- Problema: Usuário tem entity_id preenchido mas ainda mostra "Usuário Individual"
-- Causa: Pode ser que a entidade não existe ou há problema no JOIN

-- 1. Verificar se a entidade existe
SELECT 
    'VERIFICAR ENTIDADE' as categoria,
    e.id,
    e.name,
    e.legal_name,
    e.created_at,
    'Entidade existe' as status
FROM entities e
WHERE e.id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52';

-- 2. Verificar dados do usuário específico
SELECT 
    'DADOS DO USUÁRIO' as categoria,
    p.id,
    p.full_name,
    p.email,
    p.entity_id,
    p.registration_type,
    p.role,
    p.entity_role,
    p.department_id
FROM profiles p
WHERE p.email = 'cleitoncr767@gmail.com';

-- 3. Simular a consulta que a página "Minha Conta" faz
SELECT 
    'CONSULTA PÁGINA MINHA CONTA' as categoria,
    p.id,
    p.full_name,
    p.email,
    p.entity_id,
    e.name as entity_name,
    e.legal_name as entity_legal_name,
    d.name as department_name,
    -- O que deveria aparecer na tela
    CASE 
        WHEN e.name IS NOT NULL THEN e.name
        ELSE 'Usuário Individual'
    END as tela_entidade,
    CASE 
        WHEN d.name IS NOT NULL THEN d.name
        ELSE 'N/A'
    END as tela_departamento
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
LEFT JOIN departments d ON p.department_id = d.id
WHERE p.email = 'cleitoncr767@gmail.com';

-- 4. Se a entidade não existe, criar uma entidade padrão
INSERT INTO entities (id, name, legal_name, created_at, updated_at)
SELECT 
    'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52',
    'Câmara',
    'Câmara Municipal',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM entities WHERE id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52'
);

-- 5. Verificar se o departamento existe
SELECT 
    'VERIFICAR DEPARTAMENTO' as categoria,
    d.id,
    d.name,
    d.entity_id,
    'Departamento existe' as status
FROM departments d
WHERE d.id = '20b158ec-cbda-411b-8c50-dae8e13465e6';

-- 6. Se o departamento não existe, criar um departamento padrão
INSERT INTO departments (id, name, entity_id, created_at, updated_at)
SELECT 
    '20b158ec-cbda-411b-8c50-dae8e13465e6',
    'Administração',
    'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM departments WHERE id = '20b158ec-cbda-411b-8c50-dae8e13465e6'
);

-- 7. Verificar resultado final após correção
SELECT 
    'RESULTADO FINAL' as categoria,
    p.full_name as usuario,
    p.email,
    p.registration_type,
    p.entity_id,
    e.name as entity_name,
    p.department_id,
    d.name as department_name,
    -- Simular o que aparecerá na tela
    CASE 
        WHEN e.name IS NOT NULL THEN e.name
        ELSE 'Usuário Individual'
    END as tela_entidade,
    CASE 
        WHEN d.name IS NOT NULL THEN d.name
        ELSE 'N/A'
    END as tela_departamento,
    CASE 
        WHEN e.name IS NOT NULL AND d.name IS NOT NULL THEN '✅ Correto'
        WHEN e.name IS NULL THEN '❌ Entidade não encontrada'
        WHEN d.name IS NULL THEN '❌ Departamento não encontrado'
        ELSE '⚠️ Verificar'
    END as status
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
LEFT JOIN departments d ON p.department_id = d.id
WHERE p.email = 'cleitoncr767@gmail.com';

-- 8. Verificar se há outros usuários com o mesmo problema
SELECT 
    'OUTROS USUÁRIOS COM PROBLEMA' as categoria,
    p.full_name,
    p.email,
    p.registration_type,
    p.entity_id,
    e.name as entity_name,
    CASE 
        WHEN p.registration_type IN ('entity_admin', 'entity_user') AND e.name IS NULL THEN '❌ Entidade não existe'
        WHEN p.registration_type IN ('entity_admin', 'entity_user') AND e.name IS NOT NULL THEN '✅ OK'
        ELSE '⚠️ Verificar'
    END as status
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
WHERE p.registration_type IN ('entity_admin', 'entity_user')
ORDER BY status DESC, p.full_name;

-- 9. Criar entidades que faltam baseado nos dados dos usuários
INSERT INTO entities (id, name, legal_name, created_at, updated_at)
SELECT DISTINCT
    p.entity_id,
    COALESCE(p.company, 'Entidade ' || SUBSTRING(p.entity_id::text, 1, 8)),
    COALESCE(p.company, 'Entidade ' || SUBSTRING(p.entity_id::text, 1, 8)),
    NOW(),
    NOW()
FROM profiles p
WHERE p.entity_id IS NOT NULL
  AND p.registration_type IN ('entity_admin', 'entity_user')
  AND NOT EXISTS (
    SELECT 1 FROM entities e WHERE e.id = p.entity_id
  );

-- 10. Verificação final de todos os usuários
SELECT 
    'VERIFICAÇÃO FINAL TODOS' as categoria,
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN p.registration_type = 'individual' THEN 1 END) as individuais,
    COUNT(CASE WHEN p.registration_type IN ('entity_admin', 'entity_user') AND e.name IS NOT NULL THEN 1 END) as entidade_ok,
    COUNT(CASE WHEN p.registration_type IN ('entity_admin', 'entity_user') AND e.name IS NULL THEN 1 END) as entidade_problema
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id;