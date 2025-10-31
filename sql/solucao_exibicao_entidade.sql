-- Solução para exibição da entidade na página Minha Conta
-- Este script identifica e corrige problemas de exibição

-- DIAGNÓSTICO RÁPIDO
-- Execute esta consulta primeiro para identificar o problema
WITH diagnostico AS (
    SELECT 
        p.id,
        p.full_name,
        p.email,
        p.entity_id,
        p.registration_type,
        e.id as entity_exists,
        e.name as entity_name,
        e.legal_name as entity_legal_name,
        CASE 
            WHEN p.entity_id IS NOT NULL AND e.id IS NOT NULL THEN 'OK - Entidade vinculada'
            WHEN p.entity_id IS NOT NULL AND e.id IS NULL THEN 'PROBLEMA - Entity ID órfão'
            WHEN p.entity_id IS NULL AND p.registration_type IN ('entity_admin', 'entity_user') THEN 'PROBLEMA - Deveria ter entidade'
            WHEN p.entity_id IS NULL AND p.registration_type = 'individual' THEN 'OK - Usuário individual'
            ELSE 'VERIFICAR - Situação indefinida'
        END as status_diagnostico
    FROM profiles p
    LEFT JOIN entities e ON p.entity_id = e.id
)
SELECT * FROM diagnostico
ORDER BY 
    CASE 
        WHEN status_diagnostico LIKE 'PROBLEMA%' THEN 1
        WHEN status_diagnostico LIKE 'VERIFICAR%' THEN 2
        ELSE 3
    END,
    full_name;

-- CORREÇÃO 1: Limpar entity_id órfãos (se existirem)
-- Apenas execute se o diagnóstico mostrar "Entity ID órfão"
UPDATE profiles 
SET entity_id = NULL,
    updated_at = NOW()
WHERE entity_id IS NOT NULL 
  AND entity_id NOT IN (SELECT id FROM entities);

-- CORREÇÃO 2: Verificar se há entidades que podem ser vinculadas
-- Esta consulta mostra possíveis vinculações baseadas no campo company
SELECT 
    'POSSÍVEL VINCULAÇÃO' as acao,
    p.id as profile_id,
    p.full_name,
    p.email,
    p.company,
    e.id as entity_id,
    e.name as entity_name,
    CONCAT('UPDATE profiles SET entity_id = ''', e.id, ''' WHERE id = ''', p.id, ''';') as sql_para_vincular
FROM profiles p
CROSS JOIN entities e
WHERE p.entity_id IS NULL
  AND p.company IS NOT NULL
  AND (
    LOWER(TRIM(p.company)) = LOWER(TRIM(e.name)) OR
    LOWER(TRIM(p.company)) = LOWER(TRIM(e.legal_name))
  );

-- TESTE FINAL: Simular a consulta do React após as correções
-- Execute esta consulta para verificar se o problema foi resolvido
SELECT 
    'RESULTADO FINAL' as teste,
    p.id,
    p.full_name,
    p.email,
    p.entity_id,
    CASE 
        WHEN e.name IS NOT NULL THEN e.name
        ELSE 'Usuário Individual'
    END as nome_que_aparecera_na_tela
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
ORDER BY p.full_name;

-- VERIFICAÇÃO ESPECÍFICA PARA UM USUÁRIO
-- Substitua o email pelo usuário que está com problema
SELECT 
    'VERIFICAÇÃO ESPECÍFICA' as teste,
    p.id,
    p.full_name,
    p.email,
    p.entity_id,
    p.registration_type,
    e.name as entity_name,
    CASE 
        WHEN e.name IS NOT NULL THEN CONCAT('✓ Deve aparecer: ', e.name)
        ELSE '✗ Aparecerá: Usuário Individual'
    END as resultado_esperado
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
WHERE p.email = 'SUBSTITUIR_PELO_EMAIL_DO_USUARIO';