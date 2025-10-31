-- Solução para problemas com tipos de documento

-- 1. PROBLEMA: Constraint de nome único global
-- A constraint "document_types_name_key" impede nomes duplicados mesmo entre entidades diferentes
-- Vamos remover a constraint global e criar uma constraint por entidade

-- Remover constraint global de nome único
ALTER TABLE document_types DROP CONSTRAINT IF EXISTS document_types_name_key;

-- Criar constraint única por entidade (permite mesmo nome em entidades diferentes)
-- Mas primeiro, vamos verificar se já existe
DO $$
BEGIN
    -- Tentar criar a constraint única composta
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'document_types_name_entity_unique'
    ) THEN
        ALTER TABLE document_types 
        ADD CONSTRAINT document_types_name_entity_unique 
        UNIQUE (name, entity_id);
    END IF;
END $$;

-- 2. PROBLEMA: Tipos não aparecem após recarregar
-- Verificar se há tipos "órfãos" ou com problemas de entidade

-- Listar todos os tipos de documento para debug
SELECT 
    dt.id,
    dt.name,
    dt.entity_id,
    dt.status,
    e.name as entity_name,
    dt.created_at
FROM document_types dt
LEFT JOIN entities e ON dt.entity_id = e.id
ORDER BY dt.created_at DESC;

-- 3. Verificar se há tipos duplicados que precisam ser limpos
SELECT 
    name,
    entity_id,
    COUNT(*) as count
FROM document_types 
GROUP BY name, entity_id
HAVING COUNT(*) > 1;

-- 4. Se houver duplicatas, manter apenas a mais recente
WITH duplicates AS (
    SELECT 
        id,
        name,
        entity_id,
        ROW_NUMBER() OVER (PARTITION BY name, entity_id ORDER BY created_at DESC) as rn
    FROM document_types
)
DELETE FROM document_types 
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- 5. Verificar resultado final
SELECT 
    'Tipos de documento após limpeza:' as info,
    COUNT(*) as total_tipos
FROM document_types 
WHERE status = 'active';

-- 6. Mostrar tipos por entidade
SELECT 
    COALESCE(e.name, 'Sem entidade') as entidade,
    COUNT(dt.id) as total_tipos,
    STRING_AGG(dt.name, ', ') as tipos
FROM document_types dt
LEFT JOIN entities e ON dt.entity_id = e.id
WHERE dt.status = 'active'
GROUP BY e.name, dt.entity_id
ORDER BY e.name;