-- Investigar problema com tipos de documento
-- 1. Verificar tipos existentes na tabela
SELECT 
    id,
    name,
    entity_id,
    status,
    created_at
FROM document_types 
ORDER BY created_at DESC;

-- 2. Verificar se há tipos "fantasma" (criados mas não visíveis)
SELECT 
    dt.id,
    dt.name,
    dt.entity_id,
    dt.status,
    e.name as entity_name,
    dt.created_at
FROM document_types dt
LEFT JOIN entities e ON dt.entity_id = e.id
WHERE dt.status = 'active'
ORDER BY dt.created_at DESC;

-- 3. Verificar entidade do usuário atual
SELECT 
    p.id as profile_id,
    p.full_name,
    p.entity_id,
    e.name as entity_name
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
WHERE p.id = 'e35098e0-b687-41fa-95cb-830c6bb4b86d';

-- 4. Verificar tipos de documento para a entidade específica
SELECT 
    dt.id,
    dt.name,
    dt.entity_id,
    dt.status,
    dt.created_at
FROM document_types dt
WHERE dt.entity_id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52'
   OR dt.entity_id IS NULL
ORDER BY dt.created_at DESC;