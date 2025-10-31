-- Correção específica do JOIN da entidade na página Minha Conta
-- O problema: está aparecendo "Entidade ID: cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52" 
-- em vez do nome da entidade

-- PASSO 1: Verificar se a entidade existe para esse ID específico
SELECT 
    'VERIFICAÇÃO DA ENTIDADE' as teste,
    id,
    name,
    legal_name,
    status,
    created_at
FROM entities 
WHERE id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52';

-- PASSO 2: Verificar o perfil que está com problema
SELECT 
    'VERIFICAÇÃO DO PERFIL' as teste,
    p.id,
    p.full_name,
    p.email,
    p.entity_id,
    p.registration_type
FROM profiles p
WHERE p.entity_id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52';

-- PASSO 3: Testar o JOIN manualmente
SELECT 
    'TESTE DO JOIN' as teste,
    p.id as profile_id,
    p.full_name,
    p.email,
    p.entity_id,
    e.id as entity_id_encontrado,
    e.name as entity_name,
    e.legal_name as entity_legal_name,
    e.status as entity_status,
    CASE 
        WHEN e.name IS NOT NULL THEN e.name
        WHEN e.legal_name IS NOT NULL THEN e.legal_name
        ELSE 'ENTIDADE_NAO_ENCONTRADA'
    END as nome_que_deveria_aparecer
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
WHERE p.entity_id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52';

-- PASSO 4: Verificar se há problema de RLS (Row Level Security)
-- Testar se as políticas estão bloqueando o acesso
SELECT 
    'TESTE DE POLÍTICAS RLS' as teste,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'entities'
ORDER BY policyname;

-- PASSO 5: Verificar se a entidade está ativa
SELECT 
    'STATUS DA ENTIDADE' as teste,
    id,
    name,
    legal_name,
    status,
    CASE 
        WHEN status IS NULL OR status = 'active' THEN 'ATIVA'
        ELSE 'INATIVA - PODE SER O PROBLEMA'
    END as status_analise
FROM entities 
WHERE id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52';

-- PASSO 6: Correção - Ativar a entidade se estiver inativa
UPDATE entities 
SET status = 'active',
    updated_at = NOW()
WHERE id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52'
  AND (status IS NULL OR status != 'active');

-- PASSO 7: Teste final - Simular a consulta exata do Supabase
SELECT 
    'CONSULTA FINAL SIMULADA' as teste,
    p.*,
    json_build_object(
        'name', e.name,
        'legal_name', e.legal_name
    ) as entity_object,
    json_build_object(
        'name', d.name
    ) as department_object
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
LEFT JOIN departments d ON p.department_id = d.id
WHERE p.entity_id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52';

-- PASSO 8: Verificar todos os perfis com essa entidade
SELECT 
    'TODOS OS PERFIS DESSA ENTIDADE' as teste,
    p.id,
    p.full_name,
    p.email,
    p.entity_id,
    e.name as entity_name,
    e.status as entity_status
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
WHERE p.entity_id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52'
ORDER BY p.full_name;