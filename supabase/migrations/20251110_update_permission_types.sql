-- Migration: Atualizar tipos de permissão para apenas 'read' e 'delete'
-- Data: 2025-11-10

-- 1. Remover trigger problemático que referencia coluna inexistente
DROP TRIGGER IF EXISTS update_document_permissions_updated_at_trigger ON document_permissions;
DROP FUNCTION IF EXISTS update_document_permissions_updated_at();

-- 2. Atualizar permissões existentes que não são 'read' ou 'delete'
-- Converter 'edit', 'upload', 'sign', 'download' para 'read'
-- Converter 'approve', 'reject' para 'delete'
UPDATE document_permissions 
SET permission_type = 'read' 
WHERE permission_type IN ('edit', 'upload', 'sign', 'download');

UPDATE document_permissions 
SET permission_type = 'delete' 
WHERE permission_type IN ('approve', 'reject');

-- 3. Remover constraint antiga
ALTER TABLE document_permissions 
DROP CONSTRAINT IF EXISTS document_permissions_permission_type_check;

-- 4. Adicionar nova constraint com apenas 'read' e 'delete'
ALTER TABLE document_permissions 
ADD CONSTRAINT document_permissions_permission_type_check 
CHECK (permission_type IN ('read', 'delete'));

-- 5. Comentário para documentação
COMMENT ON COLUMN document_permissions.permission_type IS 'Tipo de permissão: read (visualizar) ou delete (excluir)';
