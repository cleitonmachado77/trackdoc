-- ========================================
-- VERIFICAÇÃO DE DADOS EXISTENTES
-- Execute estas consultas para identificar dados que podem precisar de correção
-- ========================================

-- 1. CONTAR REGISTROS SEM ENTITY_ID POR TABELA
SELECT 
    'document_types' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN entity_id IS NULL THEN 1 END) as sem_entity_id,
    COUNT(CASE WHEN entity_id IS NOT NULL THEN 1 END) as com_entity_id
FROM document_types
UNION ALL
SELECT 
    'categories' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN entity_id IS NULL THEN 1 END) as sem_entity_id,
    COUNT(CASE WHEN entity_id IS NOT NULL THEN 1 END) as com_entity_id
FROM categories
UNION ALL
SELECT 
    'departments' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN entity_id IS NULL THEN 1 END) as sem_entity_id,
    COUNT(CASE WHEN entity_id IS NOT NULL THEN 1 END) as com_entity_id
FROM departments
UNION ALL
SELECT 
    'documents' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN entity_id IS NULL THEN 1 END) as sem_entity_id,
    COUNT(CASE WHEN entity_id IS NOT NULL THEN 1 END) as com_entity_id
FROM documents;

-- ========================================
-- 2. LISTAR ENTIDADES EXISTENTES
-- ========================================
SELECT 
    e.id,
    e.name,
    e.legal_name,
    COUNT(p.id) as usuarios_na_entidade
FROM entities e
LEFT JOIN profiles p ON e.id = p.entity_id
GROUP BY e.id, e.name, e.legal_name
ORDER BY e.name;

-- ========================================
-- 3. VERIFICAR USUÁRIOS SEM ENTIDADE
-- ========================================
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.entity_id,
    p.created_at
FROM profiles p
WHERE p.entity_id IS NULL
ORDER BY p.created_at DESC;

-- ========================================
-- 4. TIPOS DE DOCUMENTOS SEM ENTITY_ID
-- ========================================
SELECT 
    dt.id,
    dt.name,
    dt.prefix,
    dt.created_at,
    COUNT(d.id) as documentos_usando_este_tipo
FROM document_types dt
LEFT JOIN documents d ON dt.id = d.document_type_id
WHERE dt.entity_id IS NULL
GROUP BY dt.id, dt.name, dt.prefix, dt.created_at
ORDER BY dt.created_at DESC;

-- ========================================
-- 5. CATEGORIAS SEM ENTITY_ID
-- ========================================
SELECT 
    c.id,
    c.name,
    c.description,
    c.created_at,
    COUNT(d.id) as documentos_usando_esta_categoria
FROM categories c
LEFT JOIN documents d ON c.id = d.category_id
WHERE c.entity_id IS NULL
GROUP BY c.id, c.name, c.description, c.created_at
ORDER BY c.created_at DESC;

-- ========================================
-- 6. DEPARTAMENTOS SEM ENTITY_ID
-- ========================================
SELECT 
    dep.id,
    dep.name,
    dep.description,
    dep.created_at,
    COUNT(d.id) as documentos_usando_este_departamento
FROM departments dep
LEFT JOIN documents d ON dep.id = d.department_id
WHERE dep.entity_id IS NULL
GROUP BY dep.id, dep.name, dep.description, dep.created_at
ORDER BY dep.created_at DESC;

-- ========================================
-- 7. DOCUMENTOS SEM ENTITY_ID
-- ========================================
SELECT 
    d.id,
    d.title,
    d.author_id,
    p.full_name as autor_nome,
    p.entity_id as autor_entity_id,
    d.created_at
FROM documents d
LEFT JOIN profiles p ON d.author_id = p.id
WHERE d.entity_id IS NULL
ORDER BY d.created_at DESC
LIMIT 20;

-- ========================================
-- 8. VERIFICAR RELACIONAMENTOS INCONSISTENTES
-- ========================================

-- Documentos usando tipos de documentos de entidades diferentes
SELECT 
    'Documento com tipo de entidade diferente' as problema,
    d.id as documento_id,
    d.title,
    d.entity_id as documento_entity_id,
    dt.name as tipo_nome,
    dt.entity_id as tipo_entity_id
FROM documents d
JOIN document_types dt ON d.document_type_id = dt.id
WHERE d.entity_id != dt.entity_id
   OR (d.entity_id IS NULL AND dt.entity_id IS NOT NULL)
   OR (d.entity_id IS NOT NULL AND dt.entity_id IS NULL);

-- Documentos usando categorias de entidades diferentes
SELECT 
    'Documento com categoria de entidade diferente' as problema,
    d.id as documento_id,
    d.title,
    d.entity_id as documento_entity_id,
    c.name as categoria_nome,
    c.entity_id as categoria_entity_id
FROM documents d
JOIN categories c ON d.category_id = c.id
WHERE d.entity_id != c.entity_id
   OR (d.entity_id IS NULL AND c.entity_id IS NOT NULL)
   OR (d.entity_id IS NOT NULL AND c.entity_id IS NULL);

-- Documentos usando departamentos de entidades diferentes
SELECT 
    'Documento com departamento de entidade diferente' as problema,
    d.id as documento_id,
    d.title,
    d.entity_id as documento_entity_id,
    dep.name as departamento_nome,
    dep.entity_id as departamento_entity_id
FROM documents d
JOIN departments dep ON d.department_id = dep.id
WHERE d.entity_id != dep.entity_id
   OR (d.entity_id IS NULL AND dep.entity_id IS NOT NULL)
   OR (d.entity_id IS NOT NULL AND dep.entity_id IS NULL);