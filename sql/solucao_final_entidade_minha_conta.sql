-- SOLUÇÃO FINAL: Corrigir exibição da entidade na página Minha Conta
-- Execute os passos em ordem para identificar e resolver o problema

-- PASSO 1: DIAGNÓSTICO COMPLETO
-- Esta consulta mostra exatamente o que está acontecendo
SELECT 
    'DIAGNÓSTICO GERAL' as etapa,
    p.id,
    p.full_name,
    p.email,
    p.entity_id,
    p.registration_type,
    e.id as entity_found,
    e.name as entity_name,
    e.legal_name as entity_legal_name,
    e.status as entity_status,
    CASE 
        WHEN p.entity_id IS NULL THEN 'SEM_ENTITY_ID'
        WHEN p.entity_id IS NOT NULL AND e.id IS NULL THEN 'ENTITY_ID_ORFAO'
        WHEN p.entity_id IS NOT NULL AND e.id IS NOT NULL AND e.status != 'active' THEN 'ENTIDADE_INATIVA'
        WHEN p.entity_id IS NOT NULL AND e.id IS NOT NULL AND e.status = 'active' THEN 'OK_DEVE_APARECER'
        ELSE 'SITUACAO_INDEFINIDA'
    END as status_diagnostico
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
ORDER BY 
    CASE 
        WHEN p.entity_id IS NOT NULL AND e.id IS NULL THEN 1  -- Problemas primeiro
        WHEN p.entity_id IS NOT NULL AND e.id IS NOT NULL THEN 2  -- OK em segundo
        ELSE 3  -- Sem entity_id por último
    END,
    p.full_name;

-- PASSO 2: CORREÇÃO DE ENTITY_IDs ÓRFÃOS
-- Execute apenas se o diagnóstico mostrar ENTITY_ID_ORFAO
UPDATE profiles 
SET entity_id = NULL,
    updated_at = NOW()
WHERE entity_id IS NOT NULL 
  AND entity_id NOT IN (SELECT id FROM entities)
  AND entity_id != '';

-- PASSO 3: ATIVAR ENTIDADES INATIVAS (se necessário)
-- Execute apenas se houver entidades inativas que deveriam estar ativas
UPDATE entities 
SET status = 'active',
    updated_at = NOW()
WHERE status != 'active' 
  AND id IN (
    SELECT DISTINCT entity_id 
    FROM profiles 
    WHERE entity_id IS NOT NULL
  );

-- PASSO 4: VERIFICAR POSSÍVEIS VINCULAÇÕES
-- Esta consulta mostra perfis que poderiam ter uma entidade vinculada
SELECT 
    'POSSÍVEIS_VINCULAÇÕES' as etapa,
    p.id as profile_id,
    p.full_name,
    p.email,
    p.company,
    p.registration_type,
    e.id as entity_id,
    e.name as entity_name,
    e.legal_name as entity_legal_name,
    -- SQL para fazer a vinculação (execute manualmente se apropriado)
    CONCAT('UPDATE profiles SET entity_id = ''', e.id, ''' WHERE id = ''', p.id, ''';') as sql_vinculacao
FROM profiles p
CROSS JOIN entities e
WHERE p.entity_id IS NULL
  AND p.company IS NOT NULL
  AND e.status = 'active'
  AND (
    LOWER(TRIM(p.company)) = LOWER(TRIM(e.name)) OR
    LOWER(TRIM(p.company)) = LOWER(TRIM(e.legal_name)) OR
    LOWER(TRIM(e.name)) LIKE '%' || LOWER(TRIM(p.company)) || '%' OR
    LOWER(TRIM(e.legal_name)) LIKE '%' || LOWER(TRIM(p.company)) || '%'
  )
ORDER BY p.full_name, e.name;

-- PASSO 5: TESTE FINAL DA CONSULTA
-- Esta consulta simula exatamente o que o React está fazendo
SELECT 
    'TESTE_FINAL' as etapa,
    p.id,
    p.full_name,
    p.email,
    p.entity_id,
    -- Simular o objeto entity que o Supabase retorna
    CASE 
        WHEN e.name IS NOT NULL THEN 
            json_build_object('name', e.name, 'legal_name', e.legal_name)
        ELSE NULL
    END as entity_object,
    -- O que aparecerá na tela
    CASE 
        WHEN e.name IS NOT NULL THEN e.name
        WHEN e.legal_name IS NOT NULL THEN e.legal_name
        WHEN p.entity_id IS NOT NULL THEN CONCAT('Entidade ID: ', p.entity_id)
        ELSE 'Usuário Individual'
    END as texto_na_tela
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
ORDER BY p.full_name;

-- PASSO 6: VERIFICAÇÃO ESPECÍFICA PARA UM USUÁRIO
-- Substitua o email pelo usuário que está com problema
SELECT 
    'VERIFICAÇÃO_ESPECÍFICA' as etapa,
    p.id,
    p.full_name,
    p.email,
    p.entity_id,
    p.registration_type,
    p.company,
    e.name as entity_name,
    e.legal_name as entity_legal_name,
    e.status as entity_status,
    -- Resultado esperado na interface
    CASE 
        WHEN e.name IS NOT NULL THEN CONCAT('✓ Deve aparecer: "', e.name, '"')
        WHEN e.legal_name IS NOT NULL THEN CONCAT('✓ Deve aparecer: "', e.legal_name, '"')
        WHEN p.entity_id IS NOT NULL THEN CONCAT('⚠ Deve aparecer: "Entidade ID: ', p.entity_id, '"')
        ELSE '✓ Deve aparecer: "Usuário Individual"'
    END as resultado_esperado
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
WHERE p.email = 'SUBSTITUIR_PELO_EMAIL_DO_USUARIO';

-- PASSO 7: RESUMO FINAL
SELECT 
    'RESUMO_FINAL' as etapa,
    COUNT(CASE WHEN p.entity_id IS NOT NULL AND e.name IS NOT NULL THEN 1 END) as perfis_com_entidade_ok,
    COUNT(CASE WHEN p.entity_id IS NOT NULL AND e.name IS NULL THEN 1 END) as perfis_com_problema,
    COUNT(CASE WHEN p.entity_id IS NULL THEN 1 END) as usuarios_individuais,
    COUNT(*) as total_perfis
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id;