-- Script para configurar o sistema de controle de versão de documentos

-- 1. Verificar se a coluna version existe na tabela documents
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' 
        AND column_name = 'version'
    ) THEN
        ALTER TABLE documents ADD COLUMN version INTEGER DEFAULT 1;
    END IF;
END $$;

-- 2. Atualizar documentos existentes que não têm versão definida
UPDATE documents 
SET version = 1 
WHERE version IS NULL;

-- 3. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id 
ON document_versions(document_id);

CREATE INDEX IF NOT EXISTS idx_document_versions_version_number 
ON document_versions(document_id, version_number);

-- 4. Criar função para automaticamente salvar versão anterior quando documento é atualizado
CREATE OR REPLACE FUNCTION save_document_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o file_path mudou, salvar a versão anterior
    IF OLD.file_path IS DISTINCT FROM NEW.file_path AND OLD.file_path IS NOT NULL THEN
        INSERT INTO document_versions (
            document_id,
            version_number,
            file_path,
            file_name,
            file_size,
            file_type,
            author_id,
            change_description
        ) VALUES (
            OLD.id,
            OLD.version,
            OLD.file_path,
            OLD.file_name,
            OLD.file_size,
            OLD.file_type,
            NEW.author_id, -- Usar o autor da atualização
            'Versão anterior salva automaticamente'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger para salvar versões automaticamente
DROP TRIGGER IF EXISTS save_document_version_trigger ON documents;
CREATE TRIGGER save_document_version_trigger
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION save_document_version();

-- 6. Criar função para limpar versões quando documento é excluído
-- (Já existe CASCADE na FK, mas vamos garantir limpeza do storage também)
CREATE OR REPLACE FUNCTION cleanup_document_versions()
RETURNS TRIGGER AS $$
BEGIN
    -- As versões serão excluídas automaticamente pelo CASCADE
    -- Aqui podemos adicionar lógica adicional se necessário
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar trigger para limpeza
DROP TRIGGER IF EXISTS cleanup_document_versions_trigger ON documents;
CREATE TRIGGER cleanup_document_versions_trigger
    AFTER DELETE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_document_versions();

-- 8. Adicionar constraint para garantir que version seja sempre >= 1
ALTER TABLE documents 
ADD CONSTRAINT documents_version_check 
CHECK (version >= 1);

-- 9. Adicionar constraint para garantir que version_number seja sempre >= 1
ALTER TABLE document_versions 
ADD CONSTRAINT document_versions_version_number_check 
CHECK (version_number >= 1);

-- 10. Criar índice único para evitar versões duplicadas
CREATE UNIQUE INDEX IF NOT EXISTS idx_document_versions_unique 
ON document_versions(document_id, version_number);

-- 11. Comentários nas tabelas para documentação
COMMENT ON TABLE document_versions IS 'Armazena o histórico de versões dos documentos';
COMMENT ON COLUMN document_versions.version_number IS 'Número da versão (1, 2, 3, etc.)';
COMMENT ON COLUMN document_versions.change_description IS 'Descrição das alterações feitas nesta versão';
COMMENT ON COLUMN documents.version IS 'Versão atual do documento (sempre a mais recente)';

-- 12. Função para obter estatísticas de versões
CREATE OR REPLACE FUNCTION get_document_version_stats(doc_id UUID)
RETURNS TABLE(
    total_versions INTEGER,
    oldest_version_date TIMESTAMP WITH TIME ZONE,
    latest_version_date TIMESTAMP WITH TIME ZONE,
    total_size_bytes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_versions,
        MIN(created_at) as oldest_version_date,
        MAX(created_at) as latest_version_date,
        SUM(file_size)::BIGINT as total_size_bytes
    FROM document_versions 
    WHERE document_id = doc_id;
END;
$$ LANGUAGE plpgsql;

-- 13. View para facilitar consultas de documentos com informações de versão
CREATE OR REPLACE VIEW documents_with_version_info AS
SELECT 
    d.*,
    COALESCE(v.version_count, 0) as total_versions,
    v.oldest_version,
    v.latest_version_update
FROM documents d
LEFT JOIN (
    SELECT 
        document_id,
        COUNT(*) as version_count,
        MIN(created_at) as oldest_version,
        MAX(created_at) as latest_version_update
    FROM document_versions
    GROUP BY document_id
) v ON d.id = v.document_id;

COMMENT ON VIEW documents_with_version_info IS 'View que combina documentos com informações de suas versões';

-- Finalizar
SELECT 'Sistema de controle de versão de documentos configurado com sucesso!' as status;