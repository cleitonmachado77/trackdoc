-- Correção específica para exibição da entidade na página Minha Conta
-- Foca apenas em garantir que a consulta retorne os dados corretos

-- PASSO 1: Identificar o problema específico
-- Verificar se a consulta do React está funcionando corretamente
WITH consulta_react AS (
    SELECT 
        p.id,
        p.full_name,
        p.email,
        p.entity_id,
        p.department_id,
        p.registration_type,
        -- Simular o resultado da consulta do React
        row_to_json(e.*) as entity_data,
        row_to_json(d.*) as department_data
    FROM profiles p
    LEFT JOIN entities e ON p.entity_id = e.id
    LEFT JOIN departments d ON p.department_id = d.id
    WHERE p.entity_id IS NOT NULL
)
SELECT 
    id,
    full_name,
    email,
    entity_id,
    CASE 
        WHEN entity_data IS NOT NULL THEN (entity_data->>'name')
        ELSE 'ENTIDADE_NAO_ENCONTRADA'
    END as entity_name_resultado,
    CASE 
        WHEN department_data IS NOT NULL THEN (department_data->>'name')
        ELSE 'DEPARTAMENTO_NAO_ENCONTRADO'
    END as department_name_resultado
FROM consulta_react
ORDER BY full_name;

-- PASSO 2: Verificar se há inconsistências nos dados
-- Perfis com entity_id mas sem entidade correspondente
SELECT 
    'PERFIS_COM_ENTITY_ID_ORFAO' as problema,
    p.id,
    p.full_name,
    p.email,
    p.entity_id,
    'Entity ID existe mas entidade não foi encontrada' as descricao
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
WHERE p.entity_id IS NOT NULL 
  AND e.id IS NULL;

-- PASSO 3: Verificar se há perfis que deveriam ter entidade
-- Baseado no registration_type e company
SELECT 
    'PERFIS_QUE_DEVERIAM_TER_ENTIDADE' as problema,
    p.id,
    p.full_name,
    p.email,
    p.company,
    p.registration_type,
    p.entity_id,
    'Perfil indica ser de entidade mas não tem entity_id' as descricao
FROM profiles p
WHERE (p.registration_type IN ('entity_admin', 'entity_user') OR p.company IS NOT NULL)
  AND p.entity_id IS NULL;

-- PASSO 4: Verificar se há entidades que poderiam ser vinculadas
-- Buscar entidades com nomes similares ao campo company dos perfis
SELECT 
    'POSSIVEIS_VINCULOS' as problema,
    p.id as profile_id,
    p.full_name,
    p.company as company_no_perfil,
    e.id as entity_id,
    e.name as entity_name,
    e.legal_name as entity_legal_name,
    'Possível vinculação baseada em similaridade de nome' as descricao
FROM profiles p
CROSS JOIN entities e
WHERE p.entity_id IS NULL
  AND p.company IS NOT NULL
  AND (
    LOWER(p.company) = LOWER(e.name) OR
    LOWER(p.company) = LOWER(e.legal_name) OR
    LOWER(e.name) LIKE '%' || LOWER(p.company) || '%' OR
    LOWER(e.legal_name) LIKE '%' || LOWER(p.company) || '%'
  );

-- PASSO 5: Teste da consulta exata do React
-- Esta é a consulta que o código React está executando
SELECT 
    p.*,
    json_build_object('name', e.name, 'legal_name', e.legal_name) as entity,
    json_build_object('name', d.name) as department
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
LEFT JOIN departments d ON p.department_id = d.id
WHERE p.id = 'SUBSTITUIR_PELO_ID_DO_USUARIO_ESPECIFICO';

-- PASSO 6: Verificar se o problema é de permissão ou RLS
-- Testar se as políticas RLS estão bloqueando a consulta
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('profiles', 'entities', 'departments')
ORDER BY tablename, policyname;