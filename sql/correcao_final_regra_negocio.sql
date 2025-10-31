-- ========================================
-- CORREÇÃO FINAL BASEADA NA REGRA DE NEGÓCIO
-- ========================================

-- REGRA: 
-- - Usuários de entidade: dados compartilhados com toda a entidade
-- - Usuários solo: dados exclusivos do usuário

-- PROBLEMA IDENTIFICADO:
-- - Documentos da entidade 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52'
-- - Usando tipos "Relatório" e "Contrato" com entity_id = NULL
-- - Isso viola a regra: usuários de entidade usando dados de usuários solo

-- ========================================
-- 1. VERIFICAR O IMPACTO DA CORREÇÃO
-- ========================================

-- Ver todos os documentos que usam os tipos "Relatório" e "Contrato"
SELECT 
    'Impacto da correção' as analise,
    dt.name as tipo_nome,
    dt.entity_id as tipo_entity_atual,
    d.entity_id as documento_entity,
    COUNT(*) as quantidade_documentos,
    STRING_AGG(DISTINCT 
        CASE 
            WHEN d.entity_id IS NULL THEN 'Usuário Solo'
            ELSE 'Entidade: ' || d.entity_id
        END, 
        '; '
    ) as origem_documentos
FROM document_types dt
LEFT JOIN documents d ON dt.id = d.document_type_id
WHERE dt.name IN ('Relatório', 'Contrato')
  AND dt.entity_id IS NULL
GROUP BY dt.name, dt.entity_id, d.entity_id
ORDER BY dt.name;

-- ========================================
-- 2. CORREÇÃO PRINCIPAL
-- ========================================

-- Associar os tipos "Relatório" e "Contrato" à entidade dos documentos
-- Isso resolve o problema e segue a regra de negócio
UPDATE document_types 
SET entity_id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52',
    updated_at = NOW()
WHERE entity_id IS NULL 
  AND name IN ('Relatório', 'Contrato')
  AND id IN (
      -- Só atualizar tipos que são realmente usados por documentos da entidade
      SELECT DISTINCT dt.id
      FROM document_types dt
      JOIN documents d ON dt.id = d.document_type_id
      WHERE dt.entity_id IS NULL
        AND dt.name IN ('Relatório', 'Contrato')
        AND d.entity_id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52'
  );

-- ========================================
-- 3. VERIFICAR SE HÁ CONFLITOS
-- ========================================

-- Verificar se já existem tipos com os mesmos nomes na entidade
SELECT 
    'Verificação de conflitos' as status,
    name,
    entity_id,
    COUNT(*) as quantidade
FROM document_types 
WHERE name IN ('Relatório', 'Contrato')
  AND (entity_id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52' OR entity_id IS NULL)
GROUP BY name, entity_id
HAVING COUNT(*) > 1;

-- ========================================
-- 4. CORREÇÃO ALTERNATIVA (SE HOUVER CONFLITOS)
-- ========================================

-- Se houver conflitos (tipos duplicados), usar esta abordagem:
/*
-- Opção A: Renomear os tipos antes de mover
UPDATE document_types 
SET name = name || ' (Migrado)',
    entity_id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52',
    updated_at = NOW()
WHERE entity_id IS NULL 
  AND name IN ('Relatório', 'Contrato');

-- Opção B: Mover documentos para usar tipos existentes da entidade
UPDATE documents 
SET document_type_id = (
    SELECT id FROM document_types 
    WHERE name = (
        SELECT name FROM document_types dt2 
        WHERE dt2.id = documents.document_type_id
    )
    AND entity_id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52'
    LIMIT 1
)
WHERE document_type_id IN (
    SELECT id FROM document_types 
    WHERE entity_id IS NULL 
      AND name IN ('Relatório', 'Contrato')
)
AND entity_id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52';
*/

-- ========================================
-- 5. VERIFICAÇÃO FINAL
-- ========================================

-- Confirmar que as inconsistências foram resolvidas
SELECT 
    'Status final' as verificacao,
    d.id as documento_id,
    d.title,
    d.entity_id as documento_entity_id,
    dt.name as tipo_nome,
    dt.entity_id as tipo_entity_id,
    CASE 
        WHEN d.entity_id = dt.entity_id THEN '✅ CORRETO: Mesmo entity_id'
        WHEN d.entity_id IS NULL AND dt.entity_id IS NULL THEN '✅ CORRETO: Ambos usuários solo'
        ELSE '❌ AINDA INCONSISTENTE'
    END as status_consistencia
FROM documents d
JOIN document_types dt ON d.document_type_id = dt.id
WHERE d.id IN (
    'c7686867-31f7-4a2e-bbd2-edd81788f069',
    'bddca04a-9cfb-4fbb-882f-d360ff02ced8'
);

-- ========================================
-- 6. VERIFICAÇÃO GERAL DO SISTEMA
-- ========================================

-- Contar todas as inconsistências restantes no sistema
SELECT 
    'Inconsistências restantes' as status,
    COUNT(*) as total_problemas
FROM documents d
JOIN document_types dt ON d.document_type_id = dt.id
WHERE (d.entity_id != dt.entity_id)
   OR (d.entity_id IS NULL AND dt.entity_id IS NOT NULL)
   OR (d.entity_id IS NOT NULL AND dt.entity_id IS NULL);

-- Verificar distribuição de tipos por entidade
SELECT 
    'Distribuição final' as info,
    CASE 
        WHEN entity_id IS NULL THEN 'Usuários Solo'
        ELSE 'Entidade: ' || entity_id
    END as origem,
    COUNT(*) as quantidade_tipos
FROM document_types
GROUP BY entity_id
ORDER BY entity_id NULLS FIRST;

-- ========================================
-- 7. LOG DA OPERAÇÃO
-- ========================================

-- Registrar a correção (opcional, se tiver tabela de auditoria)
/*
INSERT INTO audit_logs (
    table_name,
    operation,
    record_id,
    old_values,
    new_values,
    user_id,
    created_at
)
SELECT 
    'document_types' as table_name,
    'UPDATE - Correção de Isolamento' as operation,
    id as record_id,
    jsonb_build_object('entity_id', NULL) as old_values,
    jsonb_build_object('entity_id', 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52') as new_values,
    'system' as user_id,
    NOW() as created_at
FROM document_types 
WHERE name IN ('Relatório', 'Contrato')
  AND entity_id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52';
*/