-- Migration: Adicionar numeração sequencial para documentos
-- Data: 2025-11-10

-- PASSO 1: Limpar funções e triggers antigos
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Remover trigger se existir
    DROP TRIGGER IF EXISTS trigger_generate_document_number ON documents;
    
    -- Remover todas as versões da função generate_document_number
    FOR func_record IN 
        SELECT p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'generate_document_number'
        AND n.nspname = 'public'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %s CASCADE', func_record.func_signature);
    END LOOP;
END $$;

-- PASSO 2: Criar tabela para controlar sequências de documentos por entidade
CREATE TABLE IF NOT EXISTS document_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  last_number INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(entity_id)
);

-- PASSO 3: Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_document_sequences_entity_id ON document_sequences(entity_id);

-- PASSO 4: Criar função para obter o próximo número sequencial
CREATE OR REPLACE FUNCTION get_next_document_number(p_entity_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_number INTEGER;
BEGIN
  -- Inserir ou atualizar a sequência para a entidade
  INSERT INTO document_sequences (entity_id, last_number)
  VALUES (p_entity_id, 1)
  ON CONFLICT (entity_id)
  DO UPDATE SET 
    last_number = document_sequences.last_number + 1,
    updated_at = NOW()
  RETURNING last_number INTO v_next_number;
  
  RETURN v_next_number;
END;
$$;

-- PASSO 5: Criar função trigger para gerar document_number automaticamente
CREATE FUNCTION generate_document_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_number INTEGER;
BEGIN
  -- Se document_number já foi fornecido, não gerar
  IF NEW.document_number IS NOT NULL AND NEW.document_number != '' THEN
    RETURN NEW;
  END IF;
  
  -- Se não há entity_id, não gerar número
  IF NEW.entity_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Obter próximo número sequencial
  v_next_number := get_next_document_number(NEW.entity_id);
  
  -- Formatar número com zeros à esquerda (ex: 000001, 000002, etc)
  NEW.document_number := LPAD(v_next_number::TEXT, 6, '0');
  
  RETURN NEW;
END;
$$;

-- PASSO 6: Criar trigger na tabela documents
CREATE TRIGGER trigger_generate_document_number
  BEFORE INSERT ON documents
  FOR EACH ROW
  EXECUTE FUNCTION generate_document_number();

-- PASSO 7: Comentários para documentação
COMMENT ON TABLE document_sequences IS 'Controla a sequência de numeração de documentos por entidade';
COMMENT ON FUNCTION get_next_document_number(UUID) IS 'Retorna o próximo número sequencial para documentos de uma entidade';
COMMENT ON FUNCTION generate_document_number() IS 'Trigger function que gera automaticamente o document_number ao inserir um documento';
