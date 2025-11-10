-- Script para corrigir a constraint de document_number
-- O problema: constraint UNIQUE global no document_number
-- A solução: constraint UNIQUE por entidade (entity_id, document_number)

-- PASSO 1: Verificar constraint atual
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'documents'::regclass
  AND conname LIKE '%document_number%';

-- PASSO 2: Verificar se há conflitos (document_numbers duplicados entre entidades)
SELECT 
    document_number,
    COUNT(DISTINCT entity_id) as entidades_diferentes,
    array_agg(DISTINCT entity_id) as entity_ids
FROM documents
WHERE document_number IS NOT NULL
GROUP BY document_number
HAVING COUNT(DISTINCT entity_id) > 1
ORDER BY document_number;

-- PASSO 3: Remover a constraint UNIQUE global
ALTER TABLE documents 
DROP CONSTRAINT IF EXISTS documents_document_number_key;

-- PASSO 4: Criar nova constraint UNIQUE por entidade
ALTER TABLE documents 
ADD CONSTRAINT documents_entity_document_number_key 
UNIQUE (entity_id, document_number);

-- PASSO 5: Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_documents_entity_document_number 
ON documents (entity_id, document_number);

-- PASSO 6: Verificar resultado
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'documents'::regclass
  AND conname LIKE '%document_number%';

-- PASSO 7: Verificar formatos de document_number existentes
WITH formatos AS (
    SELECT 
        CASE 
            WHEN document_number ~ '^\d{6}$' THEN 'Formato novo (000001)'
            WHEN document_number ~ '^\d{4}-\d+$' THEN 'Formato antigo (2025-00012)'
            ELSE 'Formato desconhecido'
        END as formato,
        document_number,
        ROW_NUMBER() OVER (PARTITION BY 
            CASE 
                WHEN document_number ~ '^\d{6}$' THEN 'Formato novo (000001)'
                WHEN document_number ~ '^\d{4}-\d+$' THEN 'Formato antigo (2025-00012)'
                ELSE 'Formato desconhecido'
            END 
            ORDER BY document_number
        ) as rn
    FROM documents
    WHERE document_number IS NOT NULL
)
SELECT 
    formato,
    COUNT(*) as quantidade,
    array_agg(document_number ORDER BY document_number) FILTER (WHERE rn <= 5) as exemplos
FROM formatos
GROUP BY formato;

-- PASSO 8: Testar se ainda há duplicatas dentro da mesma entidade
SELECT 
    entity_id,
    document_number,
    COUNT(*) as duplicatas,
    array_agg(id) as document_ids
FROM documents
WHERE document_number IS NOT NULL
GROUP BY entity_id, document_number
HAVING COUNT(*) > 1;

-- PASSO 9: Se houver duplicatas dentro da mesma entidade, renumerar
-- ATENÇÃO: Execute apenas se o PASSO 8 retornar resultados!
DO $$
DECLARE
    v_entity_id UUID;
    v_document RECORD;
    v_counter INTEGER;
BEGIN
    -- Para cada entidade que tem duplicatas
    FOR v_entity_id IN 
        SELECT DISTINCT entity_id 
        FROM documents 
        WHERE document_number IS NOT NULL
        GROUP BY entity_id, document_number
        HAVING COUNT(*) > 1
    LOOP
        v_counter := 1;
        
        RAISE NOTICE 'Renumerando documentos da entidade: %', v_entity_id;
        
        -- Renumerar todos os documentos da entidade em ordem cronológica
        FOR v_document IN 
            SELECT id 
            FROM documents 
            WHERE entity_id = v_entity_id
            ORDER BY created_at ASC
        LOOP
            UPDATE documents
            SET document_number = LPAD(v_counter::TEXT, 6, '0')
            WHERE id = v_document.id;
            
            v_counter := v_counter + 1;
        END LOOP;
        
        -- Atualizar sequência
        INSERT INTO document_sequences (entity_id, last_number)
        VALUES (v_entity_id, v_counter - 1)
        ON CONFLICT (entity_id)
        DO UPDATE SET 
            last_number = v_counter - 1,
            updated_at = NOW();
        
        RAISE NOTICE 'Renumerados % documentos', v_counter - 1;
    END LOOP;
END $$;

-- PASSO 10: Verificação final - deve retornar 0 linhas
SELECT 
    entity_id,
    document_number,
    COUNT(*) as duplicatas
FROM documents
WHERE document_number IS NOT NULL
GROUP BY entity_id, document_number
HAVING COUNT(*) > 1;

-- PASSO 11: Verificar se as sequências estão corretas
-- Usa CASE para lidar com diferentes formatos de document_number
SELECT 
    ds.entity_id,
    e.name as entity_name,
    ds.last_number as sequencia_atual,
    COUNT(d.id) as total_documentos,
    MAX(
        CASE 
            WHEN d.document_number ~ '^\d{6}$' THEN d.document_number::INTEGER
            WHEN d.document_number ~ '^\d{4}-(\d+)$' THEN 
                (regexp_match(d.document_number, '^\d{4}-(\d+)$'))[1]::INTEGER
            ELSE 0
        END
    ) as maior_numero_usado,
    CASE 
        WHEN ds.last_number >= COALESCE(
            MAX(
                CASE 
                    WHEN d.document_number ~ '^\d{6}$' THEN d.document_number::INTEGER
                    WHEN d.document_number ~ '^\d{4}-(\d+)$' THEN 
                        (regexp_match(d.document_number, '^\d{4}-(\d+)$'))[1]::INTEGER
                    ELSE 0
                END
            ), 0
        ) 
        THEN '✅ OK' 
        ELSE '⚠️ DESSINCRONIZADO' 
    END as status
FROM document_sequences ds
LEFT JOIN entities e ON e.id = ds.entity_id
LEFT JOIN documents d ON d.entity_id = ds.entity_id
GROUP BY ds.entity_id, e.name, ds.last_number
ORDER BY ds.entity_id;

-- COMENTÁRIOS
COMMENT ON CONSTRAINT documents_entity_document_number_key ON documents IS 
'Garante que o document_number seja único dentro de cada entidade, permitindo que diferentes entidades tenham números iguais';
