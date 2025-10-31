-- ========================================
-- SCRIPT PARA CORRIGIR DADOS INCONSISTENTES
-- ATENÇÃO: Execute apenas após revisar os dados com o script verificar_dados_existentes.sql
-- ========================================

-- ========================================
-- 1. BACKUP DAS TABELAS (RECOMENDADO)
-- ========================================
/*
-- Criar backups antes de fazer alterações
CREATE TABLE document_types_backup AS SELECT * FROM document_types;
CREATE TABLE categories_backup AS SELECT * FROM categories;
CREATE TABLE departments_backup AS SELECT * FROM departments;
CREATE TABLE documents_backup AS SELECT * FROM documents;
*/

-- ========================================
-- 2. OPÇÃO A: ASSOCIAR DADOS SEM ENTITY_ID A UMA ENTIDADE ESPECÍFICA
-- ========================================

-- Substitua 'ENTITY_ID_DESTINO' pelo ID da entidade que deve receber os dados órfãos
/*
-- Associar tipos de documentos sem entidade
UPDATE document_types 
SET entity_id = 'ENTITY_ID_DESTINO'
WHERE entity_id IS NULL;

-- Associar categorias sem entidade
UPDATE categories 
SET entity_id = 'ENTITY_ID_DESTINO'
WHERE entity_id IS NULL;

-- Associar departamentos sem entidade
UPDATE departments 
SET entity_id = 'ENTITY_ID_DESTINO'
WHERE entity_id IS NULL;

-- Associar documentos sem entidade
UPDATE documents 
SET entity_id = 'ENTITY_ID_DESTINO'
WHERE entity_id IS NULL;
*/

-- ========================================
-- 3. OPÇÃO B: ASSOCIAR DADOS BASEADO NO AUTOR
-- ========================================

-- Associar documentos à entidade do autor
/*
UPDATE documents 
SET entity_id = (
    SELECT p.entity_id 
    FROM profiles p 
    WHERE p.id = documents.author_id
)
WHERE entity_id IS NULL 
  AND author_id IS NOT NULL
  AND EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = documents.author_id 
        AND p.entity_id IS NOT NULL
  );
*/

-- ========================================
-- 4. OPÇÃO C: CORRIGIR RELACIONAMENTOS INCONSISTENTES
-- ========================================

-- Corrigir documentos que usam tipos de documentos de entidades diferentes
/*
-- Opção 1: Atualizar o documento para a entidade do tipo
UPDATE documents 
SET entity_id = (
    SELECT dt.entity_id 
    FROM document_types dt 
    WHERE dt.id = documents.document_type_id
)
WHERE document_type_id IS NOT NULL
  AND entity_id != (
      SELECT dt.entity_id 
      FROM document_types dt 
      WHERE dt.id = documents.document_type_id
  );

-- Opção 2: Remover a associação com o tipo inconsistente
UPDATE documents 
SET document_type_id = NULL
WHERE document_type_id IS NOT NULL
  AND entity_id != (
      SELECT dt.entity_id 
      FROM document_types dt 
      WHERE dt.id = documents.document_type_id
  );
*/

-- Corrigir documentos que usam categorias de entidades diferentes
/*
-- Opção 1: Atualizar o documento para a entidade da categoria
UPDATE documents 
SET entity_id = (
    SELECT c.entity_id 
    FROM categories c 
    WHERE c.id = documents.category_id
)
WHERE category_id IS NOT NULL
  AND entity_id != (
      SELECT c.entity_id 
      FROM categories c 
      WHERE c.id = documents.category_id
  );

-- Opção 2: Remover a associação com a categoria inconsistente
UPDATE documents 
SET category_id = NULL
WHERE category_id IS NOT NULL
  AND entity_id != (
      SELECT c.entity_id 
      FROM categories c 
      WHERE c.id = documents.category_id
  );
*/

-- Corrigir documentos que usam departamentos de entidades diferentes
/*
-- Opção 1: Atualizar o documento para a entidade do departamento
UPDATE documents 
SET entity_id = (
    SELECT dep.entity_id 
    FROM departments dep 
    WHERE dep.id = documents.department_id
)
WHERE department_id IS NOT NULL
  AND entity_id != (
      SELECT dep.entity_id 
      FROM departments dep 
      WHERE dep.id = documents.department_id
  );

-- Opção 2: Remover a associação com o departamento inconsistente
UPDATE documents 
SET department_id = NULL
WHERE department_id IS NOT NULL
  AND entity_id != (
      SELECT dep.entity_id 
      FROM departments dep 
      WHERE dep.id = documents.department_id
  );
*/

-- ========================================
-- 5. OPÇÃO D: DELETAR DADOS ÓRFÃOS (CUIDADO!)
-- ========================================

-- ATENÇÃO: Só execute se tiver certeza de que os dados podem ser removidos
/*
-- Deletar tipos de documentos sem entidade que não são usados
DELETE FROM document_types 
WHERE entity_id IS NULL 
  AND id NOT IN (
      SELECT DISTINCT document_type_id 
      FROM documents 
      WHERE document_type_id IS NOT NULL
  );

-- Deletar categorias sem entidade que não são usadas
DELETE FROM categories 
WHERE entity_id IS NULL 
  AND id NOT IN (
      SELECT DISTINCT category_id 
      FROM documents 
      WHERE category_id IS NOT NULL
  );

-- Deletar departamentos sem entidade que não são usados
DELETE FROM departments 
WHERE entity_id IS NULL 
  AND id NOT IN (
      SELECT DISTINCT department_id 
      FROM documents 
      WHERE department_id IS NOT NULL
  );
*/

-- ========================================
-- 6. VERIFICAÇÃO FINAL
-- ========================================

-- Verificar se ainda há inconsistências após as correções
SELECT 
    'Verificação Final' as status,
    (SELECT COUNT(*) FROM document_types WHERE entity_id IS NULL) as tipos_sem_entidade,
    (SELECT COUNT(*) FROM categories WHERE entity_id IS NULL) as categorias_sem_entidade,
    (SELECT COUNT(*) FROM departments WHERE entity_id IS NULL) as departamentos_sem_entidade,
    (SELECT COUNT(*) FROM documents WHERE entity_id IS NULL) as documentos_sem_entidade;

-- Verificar relacionamentos inconsistentes restantes
SELECT 
    COUNT(*) as relacionamentos_inconsistentes
FROM documents d
LEFT JOIN document_types dt ON d.document_type_id = dt.id
LEFT JOIN categories c ON d.category_id = c.id
LEFT JOIN departments dep ON d.department_id = dep.id
WHERE 
    (d.document_type_id IS NOT NULL AND d.entity_id != dt.entity_id)
    OR (d.category_id IS NOT NULL AND d.entity_id != c.entity_id)
    OR (d.department_id IS NOT NULL AND d.entity_id != dep.entity_id);

-- ========================================
-- 7. RESTAURAR BACKUPS (SE NECESSÁRIO)
-- ========================================
/*
-- Se algo der errado, você pode restaurar os backups:
DROP TABLE document_types;
DROP TABLE categories;
DROP TABLE departments;
DROP TABLE documents;

ALTER TABLE document_types_backup RENAME TO document_types;
ALTER TABLE categories_backup RENAME TO categories;
ALTER TABLE departments_backup RENAME TO departments;
ALTER TABLE documents_backup RENAME TO documents;
*/