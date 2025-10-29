-- Migração para corrigir a lógica de retenção de documentos
-- Data: 2024-10-29

-- 1. Função para atualizar documentos quando um tipo de documento é alterado
CREATE OR REPLACE FUNCTION update_documents_on_type_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar documentos existentes deste tipo quando retention_period ou approval_required mudarem
  IF OLD.retention_period IS DISTINCT FROM NEW.retention_period OR 
     OLD.approval_required IS DISTINCT FROM NEW.approval_required THEN
    
    UPDATE public.documents 
    SET 
      retention_period = NEW.retention_period,
      approval_required = NEW.approval_required,
      -- Recalcular retention_end_date baseado no novo período
      retention_end_date = CASE 
        WHEN NEW.retention_period > 0 THEN 
          created_at + (NEW.retention_period || ' months')::INTERVAL
        ELSE 
          NULL 
      END,
      updated_at = NOW()
    WHERE document_type_id = NEW.id;
    
    RAISE NOTICE 'Atualizados documentos do tipo: % (ID: %)', NEW.name, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Criar trigger para atualizar documentos quando tipo é alterado
DROP TRIGGER IF EXISTS trigger_update_documents_on_type_change ON document_types;
CREATE TRIGGER trigger_update_documents_on_type_change
  AFTER UPDATE ON document_types
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_on_type_change();

-- 3. Função para liberar documentos sem tipo de documento (podem ser excluídos)
CREATE OR REPLACE FUNCTION fix_documents_without_type()
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  -- Atualizar documentos que não têm tipo de documento associado
  -- Estes documentos devem poder ser excluídos (retention_period = 0)
  UPDATE public.documents 
  SET 
    retention_period = 0,
    retention_end_date = NULL,
    updated_at = NOW()
  WHERE document_type_id IS NULL 
    AND (retention_period IS NULL OR retention_period > 0);
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  
  RAISE NOTICE 'Liberados % documentos sem tipo para exclusão', affected_count;
  
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- 4. Executar a correção para documentos sem tipo
SELECT fix_documents_without_type();

-- 5. Atualizar documentos existentes baseado nos tipos atuais
-- (para casos onde a migração anterior não foi executada corretamente)
UPDATE public.documents 
SET 
  retention_period = COALESCE(
    (SELECT dt.retention_period 
     FROM document_types dt 
     WHERE dt.id = documents.document_type_id), 
    CASE 
      WHEN document_type_id IS NULL THEN 0  -- Sem tipo = sem retenção
      ELSE 24  -- Padrão para tipos existentes
    END
  ),
  approval_required = COALESCE(
    (SELECT dt.approval_required 
     FROM document_types dt 
     WHERE dt.id = documents.document_type_id), 
    false
  ),
  -- Recalcular retention_end_date
  retention_end_date = CASE 
    WHEN document_type_id IS NULL THEN NULL  -- Sem tipo = sem data de retenção
    WHEN COALESCE(
      (SELECT dt.retention_period 
       FROM document_types dt 
       WHERE dt.id = documents.document_type_id), 
      24
    ) > 0 THEN 
      created_at + (COALESCE(
        (SELECT dt.retention_period 
         FROM document_types dt 
         WHERE dt.id = documents.document_type_id), 
        24
      ) || ' months')::INTERVAL
    ELSE 
      NULL 
  END
WHERE retention_period IS NULL 
   OR approval_required IS NULL 
   OR retention_end_date IS NULL;

-- 6. Comentários nas funções
COMMENT ON FUNCTION update_documents_on_type_change() 
IS 'Atualiza automaticamente os documentos quando um tipo de documento é alterado';

COMMENT ON FUNCTION fix_documents_without_type() 
IS 'Libera documentos sem tipo de documento para exclusão (retention_period = 0)';

-- 7. Criar índice para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_documents_document_type_id_null 
ON public.documents (document_type_id) 
WHERE document_type_id IS NULL;

-- 8. Verificação final - mostrar estatísticas
DO $$
DECLARE
  total_docs INTEGER;
  docs_with_type INTEGER;
  docs_without_type INTEGER;
  docs_with_retention INTEGER;
  docs_without_retention INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_docs FROM documents;
  SELECT COUNT(*) INTO docs_with_type FROM documents WHERE document_type_id IS NOT NULL;
  SELECT COUNT(*) INTO docs_without_type FROM documents WHERE document_type_id IS NULL;
  SELECT COUNT(*) INTO docs_with_retention FROM documents WHERE retention_period > 0;
  SELECT COUNT(*) INTO docs_without_retention FROM documents WHERE retention_period = 0 OR retention_period IS NULL;
  
  RAISE NOTICE '=== ESTATÍSTICAS DE DOCUMENTOS ===';
  RAISE NOTICE 'Total de documentos: %', total_docs;
  RAISE NOTICE 'Documentos com tipo: %', docs_with_type;
  RAISE NOTICE 'Documentos sem tipo: %', docs_without_type;
  RAISE NOTICE 'Documentos com retenção: %', docs_with_retention;
  RAISE NOTICE 'Documentos sem retenção: %', docs_without_retention;
END $$;