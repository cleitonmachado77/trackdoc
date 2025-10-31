-- Teste específico da consulta da página Minha Conta
-- Esta consulta replica exatamente o que o código React está fazendo

-- TESTE 1: Consulta exata do React (substitua o ID do usuário)
SELECT 
    p.*,
    e.name as entity_name,
    e.legal_name as entity_legal_name,
    d.name as department_name
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
LEFT JOIN departments d ON p.department_id = d.id
WHERE p.id = 'SUBSTITUIR_PELO_ID_DO_USUARIO'
LIMIT 1;

-- TESTE 2: Verificar todos os perfis que têm entity_id
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.entity_id,
    e.name as entity_name,
    CASE 
        WHEN p.entity_id IS NOT NULL AND e.name IS NOT NULL THEN 'DEVERIA_APARECER'
        WHEN p.entity_id IS NOT NULL AND e.name IS NULL THEN 'ENTITY_ID_EXISTE_MAS_ENTIDADE_NAO_ENCONTRADA'
        WHEN p.entity_id IS NULL THEN 'SEM_ENTITY_ID'
    END as status
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
WHERE p.entity_id IS NOT NULL
ORDER BY p.full_name;

-- TESTE 3: Verificar se a estrutura JSON está correta (como o Supabase retorna)
SELECT 
    p.id,
    p.full_name,
    p.entity_id,
    json_build_object(
        'name', e.name,
        'legal_name', e.legal_name
    ) as entity_object
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
WHERE p.entity_id IS NOT NULL
ORDER BY p.full_name;

-- TESTE 4: Consulta simplificada para debug
-- Se esta consulta retornar dados, o problema pode estar na interface
SELECT 
    'Perfis com entidade:' as info,
    COUNT(*) as total
FROM profiles p
INNER JOIN entities e ON p.entity_id = e.id;

SELECT 
    'Entidades disponíveis:' as info,
    COUNT(*) as total
FROM entities;

SELECT 
    'Perfis com entity_id:' as info,
    COUNT(*) as total
FROM profiles 
WHERE entity_id IS NOT NULL;

-- TESTE 5: Verificar um usuário específico (substitua pelo email do usuário)
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.entity_id,
    p.registration_type,
    e.name as entity_name,
    e.legal_name as entity_legal_name,
    CASE 
        WHEN e.name IS NOT NULL THEN CONCAT('ENTIDADE: ', e.name)
        ELSE 'USUÁRIO INDIVIDUAL'
    END as resultado_esperado
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
WHERE p.email = 'SUBSTITUIR_PELO_EMAIL_DO_USUARIO';