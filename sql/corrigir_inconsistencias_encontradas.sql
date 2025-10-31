-- ========================================
-- CORREÇÃO DAS INCONSISTÊNCIAS ENCONTRADAS
-- ========================================

-- Dados identificados:
-- - 2 documentos da entidade 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52'
-- - Usando tipos de documentos com entity_id = NULL
-- - Tipos: "Relatório" e "Contrato"

-- ========================================
-- OPÇÃO 1: ASSOCIAR OS TIPOS À ENTIDADE DOS DOCUMENTOS
-- ========================================

-- Esta é a opção RECOMENDADA se os tipos "Relatório" e "Contrato" 
-- devem pertencer à entidade dos documentos

-- 1.1. Verificar quais tipos estão sendo usados
SELECT 
    dt.id,
    dt.name,
    dt.entity_id as tipo_entity_id,
    COUNT(d.id) as documentos_usando,
    STRING_AGG(DISTINCT d.entity_id::text, ', ') as entidades_dos_documentos
FROM document_types dt
LEFT JOIN documents d ON dt.id = d.document_type_id
WHERE dt.entity_id IS NULL
  AND dt.name IN ('Relatório', 'Contrato')
GROUP BY dt.id, dt.name, dt.entity_id;

-- 1.2. Associar os tipos à entidade dos documentos
UPDATE document_types 
SET entity_id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52'
WHERE entity_id IS NULL 
  AND name IN ('Relatório', 'Contrato');

-- ========================================
-- OPÇÃO 2: REMOVER A ASSOCIAÇÃO COM OS TIPOS
-- ========================================

-- Esta opção remove a associação dos documentos com os tipos inconsistentes
-- Use se os tipos devem permanecer como "usuários únicos"

/*
UPDATE documents 
SET document_type_id = NULL
WHERE id IN (
    'c7686867-31f7-4a2e-bbd2-edd81788f069',
    'bddca04a-9cfb-4fbb-882f-d360ff02ced8'
);
*/

-- ========================================
-- OPÇÃO 3: MOVER OS DOCUMENTOS PARA ENTITY_ID NULL
-- ========================================

-- Esta opção move os documentos para "usuários únicos"
-- Use apenas se os documentos não devem pertencer à entidade

/*
UPDATE documents 
SET entity_id = NULL
WHERE id IN (
    'c7686867-31f7-4a2e-bbd2-edd81788f069',
    'bddca04a-9cfb-4fbb-882f-d360ff02ced8'
);
*/

-- ========================================
-- VERIFICAÇÃO APÓS CORREÇÃO
-- ========================================

-- Verificar se as inconsistências foram resolvidas
SELECT 
    'Após correção' as status,
    d.id as documento_id,
    d.title,
    d.entity_id as documento_entity_id,
    dt.name as tipo_nome,
    dt.entity_id as tipo_entity_id,
    CASE 
        WHEN d.entity_id = dt.entity_id THEN '✅ Consistente'
        WHEN d.entity_id IS NULL AND dt.entity_id IS NULL THEN '✅ Consistente'
        ELSE '❌ Ainda inconsistente'
    END as status_consistencia
FROM documents d
JOIN document_types dt ON d.document_type_id = dt.id
WHERE d.id IN (
    'c7686867-31f7-4a2e-bbd2-edd81788f069',
    'bddca04a-9cfb-4fbb-882f-d360ff02ced8'
);

-- ========================================
-- VERIFICAÇÃO GERAL DE INCONSISTÊNCIAS
-- ========================================

-- Verificar se ainda há outras inconsistências
SELECT 
    COUNT(*) as total_inconsistencias_restantes
FROM documents d
JOIN document_types dt ON d.document_type_id = dt.id
WHERE (d.entity_id != dt.entity_id)
   OR (d.entity_id IS NULL AND dt.entity_id IS NOT NULL)
   OR (d.entity_id IS NOT NULL AND dt.entity_id IS NULL);

-- ========================================
-- INFORMAÇÕES ADICIONAIS
-- ========================================

-- Ver todos os tipos de documentos sem entity_id
SELECT 
    dt.id,
    dt.name,
    dt.prefix,
    dt.entity_id,
    COUNT(d.id) as documentos_usando
FROM document_types dt
LEFT JOIN documents d ON dt.id = d.document_type_id
WHERE dt.entity_id IS NULL
GROUP BY dt.id, dt.name, dt.prefix, dt.entity_id
ORDER BY COUNT(d.id) DESC;

-- Ver a entidade dos documentos afetados
SELECT 
    e.id,
    e.name as entidade_nome,
    e.legal_name
FROM entities e
WHERE e.id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52';