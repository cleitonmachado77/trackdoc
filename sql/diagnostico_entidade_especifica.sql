-- Diagnóstico específico para a entidade cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52
-- que está aparecendo como ID em vez do nome

-- 1. Verificar se a entidade existe
SELECT 
    'ENTIDADE EXISTE?' as pergunta,
    COUNT(*) as existe,
    MAX(name) as nome,
    MAX(legal_name) as nome_legal,
    MAX(status) as status
FROM entities 
WHERE id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52';

-- 2. Verificar o perfil específico
SELECT 
    'PERFIL COM PROBLEMA' as info,
    id,
    full_name,
    email,
    entity_id,
    registration_type
FROM profiles 
WHERE entity_id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52';

-- 3. Testar o JOIN específico
SELECT 
    'RESULTADO DO JOIN' as teste,
    p.full_name,
    p.entity_id,
    e.id as entity_encontrada,
    e.name as nome_entidade,
    e.legal_name as nome_legal_entidade,
    e.status as status_entidade,
    CASE 
        WHEN e.id IS NULL THEN 'ENTIDADE NÃO ENCONTRADA NO JOIN'
        WHEN e.name IS NULL THEN 'ENTIDADE ENCONTRADA MAS SEM NOME'
        ELSE CONCAT('OK - Nome: ', e.name)
    END as diagnostico
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
WHERE p.entity_id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52';

-- 4. Verificar se há problema de tipo de dados
SELECT 
    'VERIFICAÇÃO DE TIPOS' as teste,
    p.entity_id,
    pg_typeof(p.entity_id) as tipo_entity_id_profile,
    e.id,
    pg_typeof(e.id) as tipo_id_entity,
    p.entity_id = e.id as ids_sao_iguais
FROM profiles p
CROSS JOIN entities e
WHERE p.entity_id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52'
  AND e.id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52';

-- 5. Verificar se há espaços ou caracteres especiais
SELECT 
    'VERIFICAÇÃO DE CARACTERES' as teste,
    LENGTH(entity_id) as tamanho_entity_id,
    entity_id,
    TRIM(entity_id) as entity_id_limpo,
    entity_id = TRIM(entity_id) as sem_espacos
FROM profiles 
WHERE entity_id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52';

-- 6. Correção: Limpar possíveis espaços
UPDATE profiles 
SET entity_id = TRIM(entity_id),
    updated_at = NOW()
WHERE entity_id LIKE '% %' OR entity_id LIKE ' %' OR entity_id LIKE '% ';

-- 7. Verificar se a entidade precisa ser ativada
UPDATE entities 
SET status = 'active',
    updated_at = NOW()
WHERE id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52'
  AND (status IS NULL OR status != 'active');

-- 8. Teste final após correções
SELECT 
    'TESTE APÓS CORREÇÕES' as resultado,
    p.full_name,
    p.entity_id,
    e.name as nome_entidade,
    e.legal_name as nome_legal,
    COALESCE(e.name, e.legal_name, 'AINDA COM PROBLEMA') as nome_final
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
WHERE p.entity_id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52';

-- 9. Consulta para copiar e colar no Supabase SQL Editor
-- Esta é exatamente a consulta que o React está fazendo
SELECT 
    p.*,
    e.name as entity_name,
    e.legal_name as entity_legal_name
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
WHERE p.entity_id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52';