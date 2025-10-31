-- ========================================
-- CORREÇÃO DA FUNÇÃO DO TRIGGER
-- ========================================

-- PROBLEMA IDENTIFICADO:
-- A função update_documents_on_type_change está atualizando TODOS os documentos
-- quando approval_required muda, causando operação pesada e redirecionamento

-- FUNÇÃO ATUAL (PROBLEMÁTICA):
/*
UPDATE public.documents 
SET 
  retention_period = NEW.retention_period,
  approval_required = NEW.approval_required,  -- Esta linha causa problema
  retention_end_date = CASE 
    WHEN NEW.retention_period > 0 THEN 
      created_at + (NEW.retention_period || ' months')::INTERVAL
    ELSE NULL 
  END,
  updated_at = NOW()
WHERE document_type_id = NEW.id;
*/

-- ========================================
-- SOLUÇÃO 1: FUNÇÃO OTIMIZADA
-- ========================================

CREATE OR REPLACE FUNCTION update_documents_on_type_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Só atualizar documentos se retention_period mudou (que funciona bem)
  IF OLD.retention_period IS DISTINCT FROM NEW.retention_period THEN
    
    UPDATE public.documents 
    SET 
      retention_period = NEW.retention_period,
      -- Recalcular retention_end_date baseado no novo período
      retention_end_date = CASE 
        WHEN NEW.retention_period > 0 THEN 
          created_at + (NEW.retention_period || ' months')::INTERVAL
        ELSE 
          NULL 
      END,
      updated_at = NOW()
    WHERE document_type_id = NEW.id;
    
    RAISE NOTICE 'Atualizados documentos do tipo: % (ID: %) - retention_period', NEW.name, NEW.id;
  END IF;
  
  -- Para approval_required, NÃO atualizar documentos existentes
  -- (deixar que a aplicação gerencie isso conforme necessário)
  IF OLD.approval_required IS DISTINCT FROM NEW.approval_required THEN
    RAISE NOTICE 'Tipo % (ID: %) - approval_required alterado para: %', NEW.name, NEW.id, NEW.approval_required;
    -- Não fazer UPDATE em massa nos documentos
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- SOLUÇÃO 2: FUNÇÃO AINDA MAIS CONSERVADORA
-- ========================================

-- Se a solução 1 ainda causar problemas, use esta versão mais conservadora:
/*
CREATE OR REPLACE FUNCTION update_documents_on_type_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Só atualizar retention_period (que sabemos que funciona)
  IF OLD.retention_period IS DISTINCT FROM NEW.retention_period THEN
    
    UPDATE public.documents 
    SET 
      retention_period = NEW.retention_period,
      retention_end_date = CASE 
        WHEN NEW.retention_period > 0 THEN 
          created_at + (NEW.retention_period || ' months')::INTERVAL
        ELSE 
          NULL 
      END,
      updated_at = NOW()
    WHERE document_type_id = NEW.id;
    
  END IF;
  
  -- Para approval_required, apenas log (sem operações pesadas)
  IF OLD.approval_required IS DISTINCT FROM NEW.approval_required THEN
    -- Apenas registrar a mudança, sem atualizar documentos
    NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
*/

-- ========================================
-- VERIFICAÇÃO
-- ========================================

-- Verificar se a função foi atualizada
SELECT 
    routine_name,
    'Função atualizada com sucesso!' as status
FROM information_schema.routines 
WHERE routine_name = 'update_documents_on_type_change';

-- ========================================
-- TESTE
-- ========================================

-- Agora você pode testar:
-- 1. Alterar retention_period (deve funcionar como antes)
-- 2. Alterar approval_required (não deve mais causar redirecionamento)

SELECT 'Função otimizada! Teste agora alterar approval_required na interface.' as resultado;