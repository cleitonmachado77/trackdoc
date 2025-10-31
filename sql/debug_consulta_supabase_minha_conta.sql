-- Debug específico da consulta Supabase na página Minha Conta
-- A consulta do React usa a sintaxe: entity:entities(name, legal_name)

-- TESTE 1: Verificar se a sintaxe do Supabase está correta
-- Simular o resultado que o Supabase deveria retornar
SELECT 
    p.*,
    json_build_object(
        'name', e.name,
        'legal_name', e.legal_name
    ) as entity,
    json_build_object(
        'name', d.name
    ) as department
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
LEFT JOIN departments d ON p.department_id = d.id
WHERE p.entity_id IS NOT NULL
ORDER BY p.full_name;

-- TESTE 2: Verificar se há dados para testar
SELECT 
    'DADOS DISPONÍVEIS PARA TESTE' as info,
    COUNT(p.id) as perfis_com_entity_id,
    COUNT(e.id) as entidades_vinculadas
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
WHERE p.entity_id IS NOT NULL;

-- TESTE 3: Verificar um usuário específico (substitua o ID)
SELECT 
    'TESTE USUÁRIO ESPECÍFICO' as teste,
    p.id,
    p.full_name,
    p.email,
    p.entity_id,
    e.name as entity_name,
    e.legal_name as entity_legal_name,
    -- Simular o objeto que o Supabase retorna
    json_build_object(
        'name', e.name,
        'legal_name', e.legal_name
    ) as entity_object,
    -- Verificar se o objeto está nulo
    CASE 
        WHEN e.name IS NOT NULL THEN 'OBJETO ENTITY VÁLIDO'
        ELSE 'OBJETO ENTITY SERÁ NULL'
    END as status_objeto
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
WHERE p.id = 'SUBSTITUIR_PELO_ID_DO_USUARIO';

-- TESTE 4: Verificar se há problema de permissão/RLS
-- Testar se as políticas estão bloqueando a consulta
SELECT 
    'TESTE DE PERMISSÕES' as teste,
    p.id,
    p.email,
    p.entity_id,
    e.id as entity_id_encontrado,
    e.name as entity_name,
    CASE 
        WHEN p.entity_id IS NOT NULL AND e.id IS NULL THEN 'POSSÍVEL PROBLEMA DE RLS'
        WHEN p.entity_id IS NOT NULL AND e.id IS NOT NULL THEN 'PERMISSÕES OK'
        ELSE 'SEM ENTITY_ID'
    END as status_permissao
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
ORDER BY p.full_name;

-- TESTE 5: Consulta simplificada para identificar o problema
-- Se esta consulta funcionar, o problema pode estar na interface
SELECT 
    p.full_name,
    p.email,
    COALESCE(e.name, 'Usuário Individual') as nome_entidade_esperado
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
ORDER BY p.full_name;

-- TESTE 6: Verificar se há entidades ativas
SELECT 
    'ENTIDADES DISPONÍVEIS' as info,
    id,
    name,
    legal_name,
    status,
    created_at
FROM entities
WHERE status = 'active' OR status IS NULL
ORDER BY name;

-- TESTE 7: Verificar perfis que deveriam mostrar entidade
SELECT 
    'PERFIS QUE DEVERIAM MOSTRAR ENTIDADE' as info,
    p.full_name,
    p.email,
    p.registration_type,
    p.entity_id,
    e.name as entity_name,
    CASE 
        WHEN p.entity_id IS NOT NULL AND e.name IS NOT NULL THEN 'DEVE APARECER NA TELA'
        WHEN p.entity_id IS NOT NULL AND e.name IS NULL THEN 'PROBLEMA: ENTITY_ID EXISTE MAS ENTIDADE NÃO'
        WHEN p.registration_type IN ('entity_admin', 'entity_user') AND p.entity_id IS NULL THEN 'PROBLEMA: DEVERIA TER ENTITY_ID'
        ELSE 'USUÁRIO INDIVIDUAL (OK)'
    END as status_esperado
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
ORDER BY 
    CASE 
        WHEN status_esperado LIKE 'PROBLEMA%' THEN 1
        WHEN status_esperado LIKE 'DEVE APARECER%' THEN 2
        ELSE 3
    END,
    p.full_name;