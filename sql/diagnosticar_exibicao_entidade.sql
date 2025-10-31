-- Diagnóstico específico para exibição da entidade na página Minha Conta
-- Este script verifica se a consulta está retornando os dados corretos

-- 1. Verificar a consulta exata que está sendo usada no código
SELECT 
    p.*,
    e.name as entity_name,
    e.legal_name as entity_legal_name,
    d.name as department_name
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
LEFT JOIN departments d ON p.department_id = d.id
WHERE p.id = 'SUBSTITUIR_PELO_ID_DO_USUARIO'
ORDER BY p.created_at DESC;

-- 2. Verificar se existem perfis com entity_id preenchido
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.entity_id,
    p.department_id,
    e.name as entity_name,
    e.legal_name as entity_legal_name,
    CASE 
        WHEN p.entity_id IS NOT NULL AND e.id IS NULL THEN 'ENTITY_ID_EXISTE_MAS_ENTIDADE_NAO_ENCONTRADA'
        WHEN p.entity_id IS NOT NULL AND e.id IS NOT NULL THEN 'VINCULO_OK'
        WHEN p.entity_id IS NULL THEN 'SEM_ENTITY_ID'
        ELSE 'SITUACAO_DESCONHECIDA'
    END as status_vinculo
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
WHERE p.entity_id IS NOT NULL
ORDER BY p.created_at DESC;

-- 3. Verificar se há entidades disponíveis
SELECT 
    id,
    name,
    legal_name,
    status,
    created_at
FROM entities
ORDER BY created_at DESC;

-- 4. Verificar perfis que deveriam ter entidade mas não têm
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.registration_type,
    p.entity_id,
    p.company,
    CASE 
        WHEN p.registration_type IN ('entity_admin', 'entity_user') AND p.entity_id IS NULL THEN 'DEVERIA_TER_ENTIDADE'
        WHEN p.registration_type = 'individual' AND p.entity_id IS NOT NULL THEN 'NAO_DEVERIA_TER_ENTIDADE'
        ELSE 'OK'
    END as status_esperado
FROM profiles p
WHERE p.registration_type IN ('entity_admin', 'entity_user', 'individual')
ORDER BY p.created_at DESC;

-- 5. Verificar se o problema é na consulta ou nos dados
-- Esta consulta simula exatamente o que o código React está fazendo
SELECT 
    json_build_object(
        'id', p.id,
        'full_name', p.full_name,
        'email', p.email,
        'entity_id', p.entity_id,
        'entity', CASE 
            WHEN e.id IS NOT NULL THEN json_build_object('name', e.name, 'legal_name', e.legal_name)
            ELSE NULL
        END,
        'department', CASE 
            WHEN d.id IS NOT NULL THEN json_build_object('name', d.name)
            ELSE NULL
        END
    ) as resultado_consulta
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
LEFT JOIN departments d ON p.department_id = d.id
WHERE p.entity_id IS NOT NULL
ORDER BY p.created_at DESC;