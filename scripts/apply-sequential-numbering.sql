-- Script para aplicar numeração sequencial de documentos
-- Execute este script no SQL Editor do Supabase Dashboard

-- Migration: Adicionar numeração sequencial de documentos
-- Data: 2024-12-19
-- Descrição: Implementa sistema de numeração sequencial automática para documentos

-- 1. Criar tabela de sequências (se não existir)
CREATE TABLE IF NOT EXISTS public.document_sequences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  entity_id uuid NULL,
  last_number integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT document_sequences_pkey PRIMARY KEY (id),
  CONSTRAINT document_sequences_entity_id_key UNIQUE (entity_id),
  CONSTRAINT document_sequences_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES entities (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- 2. Criar índice (se não existir)
CREATE INDEX IF NOT EXISTS idx_document_sequences_entity_id 
ON public.document_sequences USING btree (entity_id) TABLESPACE pg_default;

-- 3. Função para obter próximo número sequencial
CREATE OR REPLACE FUNCTION get_next_document_number(p_entity_id UUID)
RETURNS TEXT
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
    updated_at = now()
  RETURNING last_number INTO v_next_number;
  
  -- Retornar número formatado com 6 dígitos
  RETURN LPAD(v_next_number::TEXT, 6, '0');
END;
$$;

-- 4. Função do trigger para gerar número automaticamente
CREATE OR REPLACE FUNCTION generate_document_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Só gerar número se:
  -- 1. Documento tem entity_id
  -- 2. document_number não foi fornecido ou está vazio
  IF NEW.entity_id IS NOT NULL AND (NEW.document_number IS NULL OR NEW.document_number = '') THEN
    NEW.document_number := get_next_document_number(NEW.entity_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- 5. Criar trigger (remover se existir e recriar)
DROP TRIGGER IF EXISTS trigger_generate_document_number ON documents;

CREATE TRIGGER trigger_generate_document_number
  BEFORE INSERT ON documents
  FOR EACH ROW
  EXECUTE FUNCTION generate_document_number();

-- 6. Comentários para documentação
COMMENT ON TABLE document_sequences IS 'Controla a numeração sequencial de documentos por entidade';
COMMENT ON FUNCTION get_next_document_number(UUID) IS 'Retorna o próximo número sequencial para uma entidade (thread-safe)';
COMMENT ON FUNCTION generate_document_number() IS 'Trigger function que gera automaticamente o document_number ao inserir um documento';

-- 7. Verificar se a coluna document_number existe na tabela documents
DO $$
BEGIN
  -- Adicionar coluna document_number se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' 
    AND column_name = 'document_number'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE documents ADD COLUMN document_number TEXT;
    
    -- Criar índice para performance
    CREATE INDEX IF NOT EXISTS idx_documents_document_number 
    ON documents (document_number);
    
    -- Adicionar comentário
    COMMENT ON COLUMN documents.document_number IS 'Número sequencial do documento (formato: 000001, 000002, etc.)';
  END IF;
END $$;

-- 8. Atualizar documentos existentes que não têm document_number
-- (Apenas para documentos com entity_id)
DO $$
DECLARE
  v_entity RECORD;
  v_document RECORD;
  v_counter INTEGER;
BEGIN
  -- Para cada entidade que tem documentos sem document_number
  FOR v_entity IN 
    SELECT DISTINCT entity_id 
    FROM documents 
    WHERE entity_id IS NOT NULL 
    AND (document_number IS NULL OR document_number = '')
    ORDER BY entity_id
  LOOP
    -- Inicializar contador para esta entidade
    v_counter := 1;
    
    -- Para cada documento da entidade sem número, ordenado por data de criação
    FOR v_document IN
      SELECT id
      FROM documents
      WHERE entity_id = v_entity.entity_id
      AND (document_number IS NULL OR document_number = '')
      ORDER BY created_at ASC
    LOOP
      -- Atualizar o document_number com formato sequencial
      UPDATE documents
      SET document_number = LPAD(v_counter::TEXT, 6, '0')
      WHERE id = v_document.id;
      
      v_counter := v_counter + 1;
    END LOOP;
    
    -- Se processamos documentos, atualizar a tabela de sequências
    IF v_counter > 1 THEN
      INSERT INTO document_sequences (entity_id, last_number)
      VALUES (v_entity.entity_id, v_counter - 1)
      ON CONFLICT (entity_id)
      DO UPDATE SET last_number = GREATEST(document_sequences.last_number, v_counter - 1);
      
      RAISE NOTICE 'Entidade % processada: % documentos numerados', v_entity.entity_id, v_counter - 1;
    END IF;
  END LOOP;
END $$;

-- 9. Verificar se tudo foi aplicado corretamente
SELECT 
  'Tabela document_sequences criada' as status,
  COUNT(*) as registros
FROM document_sequences
UNION ALL
SELECT 
  'Documentos com números sequenciais' as status,
  COUNT(*) as registros
FROM documents 
WHERE document_number IS NOT NULL AND document_number != ''
UNION ALL
SELECT 
  'Documentos sem números (entity_id nulo)' as status,
  COUNT(*) as registros
FROM documents 
WHERE entity_id IS NULL AND (document_number IS NULL OR document_number = '')
UNION ALL
SELECT 
  'Trigger ativo' as status,
  COUNT(*) as registros
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_generate_document_number';