-- Teste da nova abordagem para carregar dados na página Minha Conta
-- Simula as consultas separadas como na página de administração

-- PASSO 1: Buscar perfil (primeira consulta)
SELECT 
    'PRIMEIRA CONSULTA - PERFIL' as etapa,
    id,
    full_name,
    email,
    entity_id,
    department_id,
    registration_type,
    phone,
    company,
    position,
    role,
    status,
    last_login,
    created_at
FROM profiles 
WHERE entity_id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52';

-- PASSO 2: Buscar entidade (segunda consulta - usando entity_id do perfil)
SELECT 
    'SEGUNDA CONSULTA - ENTIDADE' as etapa,
    id,
    name,
    legal_name,
    status
FROM entities 
WHERE id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52';

-- PASSO 3: Simular o resultado final combinado
WITH perfil AS (
    SELECT * FROM profiles 
    WHERE entity_id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52'
    LIMIT 1
),
entidade AS (
    SELECT name, legal_name 
    FROM entities 
    WHERE id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52'
),
departamento AS (
    SELECT d.name as dept_name
    FROM profiles p
    LEFT JOIN departments d ON p.department_id = d.id
    WHERE p.entity_id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52'
    LIMIT 1
)
SELECT 
    'RESULTADO FINAL COMBINADO' as etapa,
    p.id,
    p.full_name,
    p.email,
    p.entity_id,
    -- Objeto entity que será criado no JavaScript
    json_build_object(
        'name', e.name,
        'legal_name', e.legal_name
    ) as entity_object,
    -- Objeto department que será criado no JavaScript
    json_build_object(
        'name', d.dept_name
    ) as department_object,
    -- O que aparecerá na tela
    COALESCE(e.name, e.legal_name, 'Usuário Individual') as nome_na_tela
FROM perfil p
LEFT JOIN entidade e ON true
LEFT JOIN departamento d ON true;

-- PASSO 4: Verificar se todas as entidades estão ativas
SELECT 
    'VERIFICAÇÃO DE STATUS' as etapa,
    id,
    name,
    legal_name,
    status,
    CASE 
        WHEN status IS NULL OR status = 'active' THEN 'OK'
        ELSE 'PRECISA ATIVAR'
    END as acao_necessaria
FROM entities 
WHERE id IN (
    SELECT DISTINCT entity_id 
    FROM profiles 
    WHERE entity_id IS NOT NULL
);

-- PASSO 5: Ativar entidades se necessário
UPDATE entities 
SET status = 'active',
    updated_at = NOW()
WHERE id IN (
    SELECT DISTINCT entity_id 
    FROM profiles 
    WHERE entity_id IS NOT NULL
)
AND (status IS NULL OR status != 'active');

-- PASSO 6: Teste final - verificar se agora funciona
SELECT 
    'TESTE FINAL' as etapa,
    p.full_name,
    p.email,
    p.entity_id,
    e.name as entity_name,
    e.legal_name as entity_legal_name,
    CASE 
        WHEN e.name IS NOT NULL THEN CONCAT('✓ Deve aparecer: ', e.name)
        WHEN e.legal_name IS NOT NULL THEN CONCAT('✓ Deve aparecer: ', e.legal_name)
        ELSE '✗ Ainda com problema'
    END as resultado_esperado
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
WHERE p.entity_id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52';