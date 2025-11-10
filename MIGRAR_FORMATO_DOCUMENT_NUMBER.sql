-- Script para migrar document_numbers do formato antigo (2025-00012) para o novo (000012)
-- Execute este script ANTES de aplicar a correção de constraint

-- PASSO 1: Verificar formatos existentes
SELECT 
    CASE 
        WHEN document_number ~ '^\d{6}$' THEN 'Novo (000001)'
        WHEN document_number ~ '^\d{4}-\d+$' THEN 'Antigo (2025-00012)'
        ELSE 'Desconhecido'
    END as formato,
    COUNT(*) as quantidade,
    MIN(document_number) as primeiro,
    MAX(document_number) as ultimo
FROM documents
WHERE document_number IS NOT NULL
GROUP BY 1
ORDER BY 1;

-- PASSO 2: Verificar se há conflitos potenciais
-- (documentos com formato antigo que teriam o mesmo número no formato novo)
WITH numeros_extraidos AS (
    SELECT 
        id,
        entity_id,
        document_number,
        CASE 
            WHEN document_number ~ '^\d{6}$' THEN document_number
            WHEN document_number ~ '^\d{4}-(\d+)$' THEN 
                LPAD((regexp_match(document_number, '^\d{4}-(\d+)$'))[1], 6, '0')
            ELSE document_number
        END as numero_normalizado
    FROM documents
    WHERE document_number IS NOT NULL
)
SELECT 
    entity_id,
    numero_normalizado,
    COUNT(*) as conflitos,
    array_agg(document_number) as numeros_originais
FROM numeros_extraidos
GROUP BY entity_id, numero_normalizado
HAVING COUNT(*) > 1;

-- PASSO 3: Migrar formato antigo para novo
-- Converte "2025-00012" para "000012"
UPDATE documents
SET document_number = LPAD(
    (regexp_match(document_number, '^\d{4}-(\d+)$'))[1], 
    6, 
    '0'
)
WHERE document_number ~ '^\d{4}-\d+$';

-- PASSO 4: Verificar resultado da migração
SELECT 
    CASE 
        WHEN document_number ~ '^\d{6}$' THEN 'Novo (000001)'
        WHEN document_number ~ '^\d{4}-\d+$' THEN 'Antigo (2025-00012)'
        ELSE 'Desconhecido'
    END as formato,
    COUNT(*) as quantidade
FROM documents
WHERE document_number IS NOT NULL
GROUP BY 1
ORDER BY 1;

-- PASSO 5: Atualizar sequências para refletir os números migrados
DO $$
DECLARE
    v_entity RECORD;
    v_max_number INTEGER;
BEGIN
    FOR v_entity IN 
        SELECT DISTINCT entity_id 
        FROM documents 
        WHERE entity_id IS NOT NULL
    LOOP
        -- Encontrar o maior número usado
        SELECT COALESCE(MAX(document_number::INTEGER), 0)
        INTO v_max_number
        FROM documents
        WHERE entity_id = v_entity.entity_id
          AND document_number ~ '^\d{6}$';
        
        -- Atualizar ou criar sequência
        INSERT INTO document_sequences (entity_id, last_number)
        VALUES (v_entity.entity_id, v_max_number)
        ON CONFLICT (entity_id)
        DO UPDATE SET 
            last_number = GREATEST(document_sequences.last_number, v_max_number),
            updated_at = NOW();
        
        RAISE NOTICE 'Entidade %: último número = %', v_entity.entity_id, v_max_number;
    END LOOP;
END $$;

-- PASSO 6: Verificar estado final das sequências
SELECT 
    ds.entity_id,
    e.name as entity_name,
    ds.last_number as sequencia_atual,
    COUNT(d.id) as total_documentos,
    MAX(d.document_number::INTEGER) as maior_numero_usado,
    CASE 
        WHEN ds.last_number >= COALESCE(MAX(d.document_number::INTEGER), 0) 
        THEN '✅ OK' 
        ELSE '⚠️ DESSINCRONIZADO' 
    END as status
FROM document_sequences ds
LEFT JOIN entities e ON e.id = ds.entity_id
LEFT JOIN documents d ON d.entity_id = ds.entity_id
WHERE d.document_number ~ '^\d{6}$' OR d.document_number IS NULL
GROUP BY ds.entity_id, e.name, ds.last_number
ORDER BY ds.entity_id;

-- PASSO 7: Verificar se ainda há números no formato antigo
SELECT COUNT(*) as documentos_formato_antigo
FROM documents
WHERE document_number ~ '^\d{4}-\d+$';

-- Se retornar 0, a migração foi bem-sucedida!
