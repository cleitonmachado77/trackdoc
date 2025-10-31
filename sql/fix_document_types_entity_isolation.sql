-- Script para corrigir o isolamento de dados por entidade
-- Este script deve ser executado no banco de dados para garantir que dados
-- criados por usuários únicos não apareçam em outras entidades

-- ========================================
-- 1. VERIFICAR TIPOS DE DOCUMENTOS
-- ========================================
SELECT 
    'document_types' as tabela,
    dt.id,
    dt.name,
    dt.entity_id,
    dt.created_at
FROM document_types dt
WHERE dt.entity_id IS NULL
ORDER BY dt.created_at DESC;

-- ========================================
-- 2. VERIFICAR CATEGORIAS
-- ========================================
SELECT 
    'categories' as tabela,
    c.id,
    c.name,
    c.entity_id,
    c.created_at
FROM categories c
WHERE c.entity_id IS NULL
ORDER BY c.created_at DESC;

-- ========================================
-- 3. VERIFICAR DEPARTAMENTOS
-- ========================================
SELECT 
    'departments' as tabela,
    d.id,
    d.name,
    d.entity_id,
    d.created_at
FROM departments d
WHERE d.entity_id IS NULL
ORDER BY d.created_at DESC;

-- ========================================
-- 4. VERIFICAR DOCUMENTOS
-- ========================================
SELECT 
    'documents' as tabela,
    doc.id,
    doc.title,
    doc.entity_id,
    doc.created_at
FROM documents doc
WHERE doc.entity_id IS NULL
ORDER BY doc.created_at DESC;

-- ========================================
-- 5. CORREÇÕES SUGERIDAS
-- ========================================

-- Para dados sem entity_id, você pode:
--    a) Associá-los a uma entidade específica se souber qual é
--    b) Mantê-los como null para usuários únicos
--    c) Deletá-los se foram criados por engano

-- Exemplo: Associar dados sem entity_id a uma entidade específica
-- (Substitua 'sua-entity-id-aqui' pelo ID da entidade correta)

/*
-- Tipos de documentos
UPDATE document_types 
SET entity_id = 'sua-entity-id-aqui'
WHERE entity_id IS NULL 
  AND name IN ('Nome do Tipo 1', 'Nome do Tipo 2');

-- Categorias
UPDATE categories 
SET entity_id = 'sua-entity-id-aqui'
WHERE entity_id IS NULL 
  AND name IN ('Nome da Categoria 1', 'Nome da Categoria 2');

-- Departamentos
UPDATE departments 
SET entity_id = 'sua-entity-id-aqui'
WHERE entity_id IS NULL 
  AND name IN ('Nome do Departamento 1', 'Nome do Departamento 2');

-- Documentos
UPDATE documents 
SET entity_id = 'sua-entity-id-aqui'
WHERE entity_id IS NULL 
  AND author_id IN ('user-id-1', 'user-id-2');
*/

-- ========================================
-- 6. VERIFICAR RELACIONAMENTOS CRUZADOS
-- ========================================

-- Documentos usando tipos de documentos sem entity_id
SELECT 
    'doc_type_mismatch' as problema,
    dt.name as tipo_documento,
    dt.entity_id as tipo_entity_id,
    d.title as documento_titulo,
    d.entity_id as documento_entity_id,
    p.full_name as autor,
    p.entity_id as autor_entity_id
FROM documents d
JOIN document_types dt ON d.document_type_id = dt.id
JOIN profiles p ON d.author_id = p.id
WHERE dt.entity_id IS NULL OR d.entity_id != dt.entity_id
ORDER BY dt.name, d.created_at DESC;

-- Documentos usando categorias sem entity_id
SELECT 
    'category_mismatch' as problema,
    c.name as categoria,
    c.entity_id as categoria_entity_id,
    d.title as documento_titulo,
    d.entity_id as documento_entity_id,
    p.full_name as autor,
    p.entity_id as autor_entity_id
FROM documents d
JOIN categories c ON d.category_id = c.id
JOIN profiles p ON d.author_id = p.id
WHERE c.entity_id IS NULL OR d.entity_id != c.entity_id
ORDER BY c.name, d.created_at DESC;

-- Documentos usando departamentos sem entity_id
SELECT 
    'department_mismatch' as problema,
    dep.name as departamento,
    dep.entity_id as departamento_entity_id,
    d.title as documento_titulo,
    d.entity_id as documento_entity_id,
    p.full_name as autor,
    p.entity_id as autor_entity_id
FROM documents d
JOIN departments dep ON d.department_id = dep.id
JOIN profiles p ON d.author_id = p.id
WHERE dep.entity_id IS NULL OR d.entity_id != dep.entity_id
ORDER BY dep.name, d.created_at DESC;

-- ========================================
-- 7. VERIFICAR ISOLAMENTO POR ENTIDADE
-- ========================================

-- Verificar isolamento de tipos de documentos por entidade
-- Substitua 'entity-id-para-testar' pelo ID de uma entidade específica
/*
SELECT 
    'document_types' as tabela,
    dt.id,
    dt.name,
    dt.entity_id,
    COUNT(d.id) as documentos_usando
FROM document_types dt
LEFT JOIN documents d ON dt.id = d.document_type_id
WHERE dt.entity_id = 'entity-id-para-testar' OR dt.entity_id IS NULL
GROUP BY dt.id, dt.name, dt.entity_id
ORDER BY dt.name;

-- Verificar isolamento de categorias por entidade
SELECT 
    'categories' as tabela,
    c.id,
    c.name,
    c.entity_id,
    COUNT(d.id) as documentos_usando
FROM categories c
LEFT JOIN documents d ON c.id = d.category_id
WHERE c.entity_id = 'entity-id-para-testar' OR c.entity_id IS NULL
GROUP BY c.id, c.name, c.entity_id
ORDER BY c.name;

-- Verificar isolamento de departamentos por entidade
SELECT 
    'departments' as tabela,
    dep.id,
    dep.name,
    dep.entity_id,
    COUNT(d.id) as documentos_usando
FROM departments dep
LEFT JOIN documents d ON dep.id = d.department_id
WHERE dep.entity_id = 'entity-id-para-testar' OR dep.entity_id IS NULL
GROUP BY dep.id, dep.name, dep.entity_id
ORDER BY dep.name;
*/

-- ========================================
-- 8. VERIFICAR ÍNDICES E PERFORMANCE
-- ========================================

-- Verificar se os índices existem para melhorar performance
SELECT 
    schemaname, 
    tablename, 
    indexname, 
    indexdef
FROM pg_indexes 
WHERE tablename IN ('document_types', 'categories', 'departments', 'documents')
  AND indexname LIKE '%entity_id%'
ORDER BY tablename, indexname;

-- ========================================
-- 9. VERIFICAR RLS (ROW LEVEL SECURITY)
-- ========================================

-- Verificar se RLS está habilitado nas tabelas
SELECT 
    schemaname, 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN 'RLS Habilitado'
        ELSE 'RLS Desabilitado'
    END as status_rls
FROM pg_tables 
WHERE tablename IN ('document_types', 'categories', 'departments', 'documents')
ORDER BY tablename;

-- ========================================
-- 10. POLÍTICAS RLS SUGERIDAS (OPCIONAL)
-- ========================================

/*
-- Se você quiser implementar RLS para garantia adicional de segurança:

-- Para document_types
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY document_types_entity_isolation ON document_types
    FOR ALL
    USING (
        entity_id = (SELECT entity_id FROM profiles WHERE id = auth.uid())
        OR 
        (entity_id IS NULL AND (SELECT entity_id FROM profiles WHERE id = auth.uid()) IS NULL)
    );

-- Para categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY categories_entity_isolation ON categories
    FOR ALL
    USING (
        entity_id = (SELECT entity_id FROM profiles WHERE id = auth.uid())
        OR 
        (entity_id IS NULL AND (SELECT entity_id FROM profiles WHERE id = auth.uid()) IS NULL)
    );

-- Para departments
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY departments_entity_isolation ON departments
    FOR ALL
    USING (
        entity_id = (SELECT entity_id FROM profiles WHERE id = auth.uid())
        OR 
        (entity_id IS NULL AND (SELECT entity_id FROM profiles WHERE id = auth.uid()) IS NULL)
    );

-- Para documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY documents_entity_isolation ON documents
    FOR ALL
    USING (
        entity_id = (SELECT entity_id FROM profiles WHERE id = auth.uid())
        OR 
        (entity_id IS NULL AND (SELECT entity_id FROM profiles WHERE id = auth.uid()) IS NULL)
    );
*/