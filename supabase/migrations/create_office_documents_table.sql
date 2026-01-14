-- Criar tabela para documentos do Office (se não existir)
-- Esta tabela armazena metadados dos documentos Word editados na plataforma

CREATE TABLE IF NOT EXISTS office_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índices para performance
  CONSTRAINT office_documents_title_check CHECK (char_length(title) > 0)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_office_documents_user_id ON office_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_office_documents_entity_id ON office_documents(entity_id);
CREATE INDEX IF NOT EXISTS idx_office_documents_created_at ON office_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_office_documents_updated_at ON office_documents(updated_at DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE office_documents ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seus próprios documentos
CREATE POLICY "Users can view their own office documents"
  ON office_documents
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuários podem inserir seus próprios documentos
CREATE POLICY "Users can insert their own office documents"
  ON office_documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar seus próprios documentos
CREATE POLICY "Users can update their own office documents"
  ON office_documents
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem deletar seus próprios documentos
CREATE POLICY "Users can delete their own office documents"
  ON office_documents
  FOR DELETE
  USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_office_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_office_documents_updated_at_trigger ON office_documents;
CREATE TRIGGER update_office_documents_updated_at_trigger
  BEFORE UPDATE ON office_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_office_documents_updated_at();

-- Comentários para documentação
COMMENT ON TABLE office_documents IS 'Armazena metadados dos documentos Word editados na plataforma Office';
COMMENT ON COLUMN office_documents.id IS 'Identificador único do documento';
COMMENT ON COLUMN office_documents.user_id IS 'ID do usuário proprietário do documento';
COMMENT ON COLUMN office_documents.entity_id IS 'ID da entidade/empresa do usuário';
COMMENT ON COLUMN office_documents.title IS 'Título/nome do documento';
COMMENT ON COLUMN office_documents.file_path IS 'Caminho do arquivo no Supabase Storage';
COMMENT ON COLUMN office_documents.file_type IS 'Tipo MIME do arquivo';
COMMENT ON COLUMN office_documents.file_size IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN office_documents.created_at IS 'Data de criação do documento';
COMMENT ON COLUMN office_documents.updated_at IS 'Data da última atualização do documento';
