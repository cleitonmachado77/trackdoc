-- Script para corrigir a sequência de numeração de documentos
-- Execute este script se houver erro 409 ao criar documentos

-- 1. Verificar estado atual das sequências
SELECT 
    ds.entity_id,
    e.name as entity_name,
    ds.last_number as sequencia_atual,
    COUNT(d.id) as total_documentos,
    MAX(d.document_number::INTEGER) as maior_numero_usado
FROM document_sequences ds
LEFT JOIN entities e ON e.id = ds.entity_id
LEFT JOIN documents d ON d.entity_id = ds.entity_id
GROUP BY ds.entity_id, e.name, ds.last_number
ORDER BY ds.entity_id;

-- 2. Corrigir sequências dessincronizadas
-- Esta query atualiza a sequência para ser maior que o último número usado
UPDATE document_sequences ds
SET 
    last_number = COALESCE(
        (SELECT MAX(document_number::INTEGER) 
         FROM documents 
         WHERE entity_id = ds.entity_id), 
        0
    ),
    updated_at = NOW()
WHERE EXISTS (
    SELECT 1 
    FROM documents d 
    WHERE d.entity_id = ds.entity_id 
    AND d.document_number::INTEGER >= ds.last_number
);

-- 3. Verificar se há document_numbers duplicados
SELECT 
    entity_id,
    document_number,
    COUNT(*) as duplicatas
FROM documents
WHERE document_number IS NOT NULL
GROUP BY entity_id, document_number
HAVING COUNT(*) > 1;

-- 4. Se houver duplicatas, renumerar documentos
-- ATENÇÃO: Execute apenas se necessário e após backup!
DO $$
DECLARE
    v_entity_id UUID;
    v_document RECORD;
    v_counter INTEGER;
BEGIN
    -- Para cada entidade com duplicatas
    FOR v_entity_id IN 
        SELECT DISTINCT entity_id 
        FROM documents 
        WHERE document_number IS NOT NULL
        GROUP BY entity_id, document_number
        HAVING COUNT(*) > 1
    LOOP
        v_counter := 1;
        
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
        UPDATE document_sequences
        SET last_number = v_counter - 1,
            updated_at = NOW()
        WHERE entity_id = v_entity_id;
        
        RAISE NOTICE 'Renumerados % documentos para entidade %', v_counter - 1, v_entity_id;
    END LOOP;
END $$;

-- 5. Verificar resultado final
SELECT 
    ds.entity_id,
    e.name as entity_name,
    ds.last_number as sequencia_atual,
    COUNT(d.id) as total_documentos,
    MAX(d.document_number::INTEGER) as maior_numero_usado,
    CASE 
        WHEN ds.last_number >= COALESCE(MAX(d.document_number::INTEGER), 0) 
        THEN '✅ OK' 
        ELSE '❌ DESSINCRONIZADO' 
    END as status
FROM document_sequences ds
LEFT JOIN entities e ON e.id = ds.entity_id
LEFT JOIN documents d ON d.entity_id = ds.entity_id
GROUP BY ds.entity_id, e.name, ds.last_number
ORDER BY ds.entity_id;
