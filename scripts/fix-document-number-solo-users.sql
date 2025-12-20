-- Script para corrigir numeração de documentos para usuários solo
-- Data: 2024-12-20
-- Descrição: Atualiza a função generate_document_number para suportar usuários sem entity_id

-- 1. Atualizar a tabela document_sequences para permitir user_id como alternativa a entity_id
ALTER TABLE document_sequences 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Criar índice para user_id
CREATE INDEX IF NOT EXISTS idx_document_sequences_user_id 
ON document_sequences(user_id) WHERE user_id IS NOT NULL;

-- Adicionar constraint única para user_id (quando entity_id é null)
-- Primeiro remover se existir
ALTER TABLE document_sequences DROP CONSTRAINT IF EXISTS document_sequences_user_id_key;
ALTER TABLE document_sequences ADD CONSTRAINT document_sequences_user_id_key UNIQUE (user_id);

-- 2. Atualizar função get_next_document_number para aceitar user_id
CREATE OR REPLACE FUNCTION get_next_document_number(p_entity_id UUID, p_user_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_number INTEGER;
BEGIN
  -- Se tem entity_id, usar entity_id
  IF p_entity_id IS NOT NULL THEN
    INSERT INTO document_sequences (entity_id, last_number)
    VALUES (p_entity_id, 1)
    ON CONFLICT (entity_id)
    DO UPDATE SET 
      last_number = document_sequences.last_number + 1,
      updated_at = now()
    RETURNING last_number INTO v_next_number;
  -- Se não tem entity_id mas tem user_id, usar user_id
  ELSIF p_user_id IS NOT NULL THEN
    INSERT INTO document_sequences (user_id, last_number)
    VALUES (p_user_id, 1)
    ON CONFLICT (user_id)
    DO UPDATE SET 
      last_number = document_sequences.last_number + 1,
      updated_at = now()
    RETURNING last_number INTO v_next_number;
  ELSE
    -- Fallback: retornar número baseado em timestamp
    v_next_number := EXTRACT(EPOCH FROM now())::INTEGER % 1000000;
  END IF;
  
  -- Retornar número formatado com 6 dígitos
  RETURN LPAD(v_next_number::TEXT, 6, '0');
END;
$$;

-- 3. Atualizar função generate_document_number para suportar usuários solo
CREATE OR REPLACE FUNCTION generate_document_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Só gerar número se document_number não foi fornecido ou está vazio
  IF NEW.document_number IS NULL OR NEW.document_number = '' THEN
    -- Usar entity_id se disponível, senão usar created_by ou author_id
    IF NEW.entity_id IS NOT NULL THEN
      NEW.document_number := get_next_document_number(NEW.entity_id, NULL);
    ELSIF NEW.created_by IS NOT NULL THEN
      NEW.document_number := get_next_document_number(NULL, NEW.created_by);
    ELSIF NEW.author_id IS NOT NULL THEN
      NEW.document_number := get_next_document_number(NULL, NEW.author_id);
    ELSE
      -- Fallback: gerar número baseado em timestamp
      NEW.document_number := LPAD((EXTRACT(EPOCH FROM now())::INTEGER % 1000000)::TEXT, 6, '0');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Recriar trigger
DROP TRIGGER IF EXISTS trigger_generate_document_number ON documents;

CREATE TRIGGER trigger_generate_document_number
  BEFORE INSERT ON documents
  FOR EACH ROW
  EXECUTE FUNCTION generate_document_number();

-- 5. Corrigir documentos existentes sem document_number válido
-- (documentos com números aleatórios ou vazios)
DO $$
DECLARE
  v_user RECORD;
  v_document RECORD;
  v_counter INTEGER;
BEGIN
  -- Para cada usuário que tem documentos sem entity_id
  FOR v_user IN 
    SELECT DISTINCT COALESCE(created_by, author_id) as user_id
    FROM documents 
    WHERE entity_id IS NULL 
    AND COALESCE(created_by, author_id) IS NOT NULL
    AND (
      document_number IS NULL 
      OR document_number = '' 
      OR LENGTH(document_number) > 6  -- Números muito longos (provavelmente aleatórios)
      OR document_number !~ '^\d{6}$'  -- Não segue o padrão 000001
    )
    ORDER BY user_id
  LOOP
    -- Inicializar contador para este usuário
    -- Buscar o maior número existente para este usuário
    SELECT COALESCE(MAX(
      CASE 
        WHEN document_number ~ '^\d{6}$' THEN document_number::INTEGER 
        ELSE 0 
      END
    ), 0) INTO v_counter
    FROM documents
    WHERE COALESCE(created_by, author_id) = v_user.user_id
    AND entity_id IS NULL;
    
    -- Para cada documento do usuário sem número válido
    FOR v_document IN
      SELECT id
      FROM documents
      WHERE COALESCE(created_by, author_id) = v_user.user_id
      AND entity_id IS NULL
      AND (
        document_number IS NULL 
        OR document_number = '' 
        OR LENGTH(document_number) > 6
        OR document_number !~ '^\d{6}$'
      )
      ORDER BY created_at ASC
    LOOP
      v_counter := v_counter + 1;
      
      -- Atualizar o document_number
      UPDATE documents
      SET document_number = LPAD(v_counter::TEXT, 6, '0')
      WHERE id = v_document.id;
    END LOOP;
    
    -- Atualizar a tabela de sequências para este usuário
    IF v_counter > 0 THEN
      INSERT INTO document_sequences (user_id, last_number)
      VALUES (v_user.user_id, v_counter)
      ON CONFLICT (user_id)
      DO UPDATE SET last_number = GREATEST(document_sequences.last_number, v_counter);
      
      RAISE NOTICE 'Usuário % processado: % documentos numerados', v_user.user_id, v_counter;
    END IF;
  END LOOP;
END $$;

-- 6. Verificar resultados
SELECT 
  'Documentos com entity_id' as tipo,
  COUNT(*) as total,
  COUNT(CASE WHEN document_number ~ '^\d{6}$' THEN 1 END) as com_numero_valido
FROM documents WHERE entity_id IS NOT NULL
UNION ALL
SELECT 
  'Documentos sem entity_id (usuários solo)' as tipo,
  COUNT(*) as total,
  COUNT(CASE WHEN document_number ~ '^\d{6}$' THEN 1 END) as com_numero_valido
FROM documents WHERE entity_id IS NULL;

-- 7. Comentários
COMMENT ON FUNCTION get_next_document_number(UUID, UUID) IS 'Retorna o próximo número sequencial para uma entidade ou usuário (thread-safe)';
COMMENT ON FUNCTION generate_document_number() IS 'Trigger function que gera automaticamente o document_number ao inserir um documento, suportando entidades e usuários solo';
