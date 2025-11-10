-- Script para migrar números de documentos existentes para o formato sequencial
-- Execute este script APÓS aplicar a migration 20251110_add_sequential_document_numbers.sql

-- 1. Atualizar documentos existentes com números sequenciais
-- Agrupa por entity_id e atribui números sequenciais baseados na data de criação

DO $$
DECLARE
  v_entity RECORD;
  v_document RECORD;
  v_counter INTEGER;
BEGIN
  -- Para cada entidade
  FOR v_entity IN 
    SELECT DISTINCT entity_id 
    FROM documents 
    WHERE entity_id IS NOT NULL
    ORDER BY entity_id
  LOOP
    v_counter := 1;
    
    -- Para cada documento da entidade, ordenado por data de criação
    FOR v_document IN
      SELECT id
      FROM documents
      WHERE entity_id = v_entity.entity_id
      ORDER BY created_at ASC
    LOOP
      -- Atualizar o document_number com formato sequencial
      UPDATE documents
      SET document_number = LPAD(v_counter::TEXT, 6, '0')
      WHERE id = v_document.id;
      
      v_counter := v_counter + 1;
    END LOOP;
    
    -- Atualizar a tabela de sequências com o último número usado
    INSERT INTO document_sequences (entity_id, last_number)
    VALUES (v_entity.entity_id, v_counter - 1)
    ON CONFLICT (entity_id)
    DO UPDATE SET last_number = v_counter - 1;
    
    RAISE NOTICE 'Entidade % processada: % documentos', v_entity.entity_id, v_counter - 1;
  END LOOP;
  
  RAISE NOTICE 'Migração concluída com sucesso!';
END $$;

-- 2. Verificar resultados
SELECT 
  e.name as entidade,
  ds.last_number as ultimo_numero,
  COUNT(d.id) as total_documentos
FROM document_sequences ds
JOIN entities e ON e.id = ds.entity_id
LEFT JOIN documents d ON d.entity_id = ds.entity_id
GROUP BY e.name, ds.last_number
ORDER BY e.name;
