-- =====================================================
-- CORREÇÃO: Geração automática de document_number
-- =====================================================
-- Problema: O trigger trigger_generate_document_number existe mas a função
-- generate_document_number() não está gerando o número corretamente
-- =====================================================

-- 0. Dropar trigger primeiro, depois as funções
DROP TRIGGER IF EXISTS trigger_generate_document_number ON documents;
DROP FUNCTION IF EXISTS get_next_document_number(UUID);
DROP FUNCTION IF EXISTS generate_document_number();

-- 1. A tabela document_sequences já existe com estrutura:
-- id (PK), entity_id (UNIQUE), last_number, created_at, updated_at

-- 2. Criar a função que obtém o próximo número
CREATE OR REPLACE FUNCTION get_next_document_number(p_entity_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_next_number INTEGER;
  v_existing_id UUID;
BEGIN
  -- Verificar se já existe registro para esta entidade
  SELECT id, last_number + 1 INTO v_existing_id, v_next_number
  FROM document_sequences
  WHERE entity_id = p_entity_id
  FOR UPDATE;
  
  IF v_existing_id IS NOT NULL THEN
    -- Atualizar o registro existente
    UPDATE document_sequences
    SET last_number = v_next_number,
        updated_at = NOW()
    WHERE id = v_existing_id;
  ELSE
    -- Inserir novo registro
    v_next_number := 1;
    INSERT INTO document_sequences (entity_id, last_number)
    VALUES (p_entity_id, v_next_number);
  END IF;
  
  -- Retornar número formatado com 6 dígitos
  RETURN LPAD(v_next_number::TEXT, 6, '0');
END;
$$;

-- 3. Criar a função do trigger
CREATE OR REPLACE FUNCTION generate_document_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Só gerar se não tiver document_number e tiver entity_id
  IF (NEW.document_number IS NULL OR NEW.document_number = '') AND NEW.entity_id IS NOT NULL THEN
    NEW.document_number := get_next_document_number(NEW.entity_id);
  END IF;
  
  -- Se não tem entity_id, gerar um número único baseado em timestamp
  IF (NEW.document_number IS NULL OR NEW.document_number = '') AND NEW.entity_id IS NULL THEN
    NEW.document_number := 'TMP-' || LPAD(EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT, 12, '0');
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Criar o trigger
CREATE TRIGGER trigger_generate_document_number
  BEFORE INSERT ON documents
  FOR EACH ROW
  EXECUTE FUNCTION generate_document_number();

-- 5. Verificar se funcionou
DO $$
BEGIN
  RAISE NOTICE 'Trigger e função de geração de document_number criados com sucesso!';
END;
$$;
