-- Verificar todas as constraints da tabela documents
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'documents'::regclass
ORDER BY contype, conname;

-- Verificar índices únicos
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'documents'
  AND indexdef LIKE '%UNIQUE%';

-- Verificar se há document_number duplicado para algum usuário
SELECT 
    author_id,
    entity_id,
    document_number,
    COUNT(*) as count
FROM documents
GROUP BY author_id, entity_id, document_number
HAVING COUNT(*) > 1;

-- Verificar último document_number por entidade
SELECT 
    entity_id,
    MAX(document_number) as ultimo_numero,
    COUNT(*) as total_documentos
FROM documents
GROUP BY entity_id
ORDER BY entity_id;
