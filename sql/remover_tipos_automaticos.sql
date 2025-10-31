-- ========================================
-- REMOÇÃO DOS TIPOS DE DOCUMENTOS AUTOMÁTICOS
-- ========================================

-- SITUAÇÃO:
-- - Tipos "Relatório" e "Contrato" foram criados automaticamente pelo sistema
-- - Não serão utilizados
-- - Devem ser removidos para limpar inconsistências

-- ========================================
-- 1. VERIFICAR DOCUMENTOS AFETADOS
-- ========================================

-- Ver quais documentos usam esses tipos antes de remover
SELECT 
    'Documentos que serão afetados' as status,
    d.id,
    d.title,
    d.entity_id,
    dt.name as tipo_atual,
    dt.entity_id as tipo_entity_id
FROM documents d
JOIN document_types dt ON d.document_type_id = dt.id
WHERE dt.name IN ('Relatório', 'Contrato')
  AND dt.entity_id IS NULL;

-- ========================================
-- 2. REMOVER ASSOCIAÇÃO DOS DOCUMENTOS
-- ========================================

-- Primeiro, remover a associação dos documentos com esses tipos
-- Os documentos continuarão existindo, mas sem tipo definido
UPDATE documents 
SET document_type_id = NULL,
    updated_at = NOW()
WHERE document_type_id IN (
    SELECT id 
    FROM document_types 
    WHERE name IN ('Relatório', 'Contrato')
      AND entity_id IS NULL
);

-- Verificar quantos documentos foram afetados
SELECT 
    'Documentos atualizados' as status,
    COUNT(*) as quantidade
FROM documents 
WHERE document_type_id IS NULL
  AND updated_at > NOW() - INTERVAL '1 minute';

-- ========================================
-- 3. REMOVER OS TIPOS DE DOCUMENTOS
-- ========================================

-- Agora remover os tipos automáticos
DELETE FROM document_types 
WHERE name IN ('Relatório', 'Contrato')
  AND entity_id IS NULL;

-- Verificar se foram removidos
SELECT 
    'Tipos removidos' as status,
    COUNT(*) as tipos_restantes_com_mesmo_nome
FROM document_types 
WHERE name IN ('Relatório', 'Contrato');

-- ========================================
-- 4. VERIFICAÇÃO FINAL
-- ========================================

-- Confirmar que as inconsistências foram resolvidas
SELECT 
    'Verificação final' as status,
    COUNT(*) as inconsistencias_restantes
FROM documents d
LEFT JOIN document_types dt ON d.document_type_id = dt.id
WHERE d.document_type_id IS NOT NULL
  AND (
      (d.entity_id != dt.entity_id)
      OR (d.entity_id IS NULL AND dt.entity_id IS NOT NULL)
      OR (d.entity_id IS NOT NULL AND dt.entity_id IS NULL)
  );

-- Ver os documentos que ficaram sem tipo
SELECT 
    'Documentos sem tipo após limpeza' as info,
    d.id,
    d.title,
    d.entity_id,
    d.updated_at
FROM documents d
WHERE d.document_type_id IS NULL
  AND d.id IN (
      'c7686867-31f7-4a2e-bbd2-edd81788f069',
      'bddca04a-9cfb-4fbb-882f-d360ff02ced8'
  );

-- ========================================
-- 5. LIMPEZA ADICIONAL (OPCIONAL)
-- ========================================

-- Se quiser remover TODOS os tipos automáticos sem entity_id que não são usados
/*
DELETE FROM document_types 
WHERE entity_id IS NULL
  AND id NOT IN (
      SELECT DISTINCT document_type_id 
      FROM documents 
      WHERE document_type_id IS NOT NULL
  );
*/

-- ========================================
-- 6. ESTATÍSTICAS FINAIS
-- ========================================

-- Ver distribuição atual de tipos por entidade
SELECT 
    'Distribuição final de tipos' as info,
    CASE 
        WHEN entity_id IS NULL THEN 'Usuários Solo'
        ELSE 'Entidade: ' || entity_id
    END as origem,
    COUNT(*) as quantidade_tipos,
    STRING_AGG(name, ', ') as nomes_tipos
FROM document_types
GROUP BY entity_id
ORDER BY entity_id NULLS FIRST;

-- Ver documentos sem tipo por entidade
SELECT 
    'Documentos sem tipo' as info,
    CASE 
        WHEN entity_id IS NULL THEN 'Usuários Solo'
        ELSE 'Entidade: ' || entity_id
    END as origem,
    COUNT(*) as quantidade_documentos_sem_tipo
FROM documents
WHERE document_type_id IS NULL
GROUP BY entity_id
ORDER BY entity_id NULLS FIRST;

-- ========================================
-- 7. RECOMENDAÇÕES PÓS-LIMPEZA
-- ========================================

-- Mostrar sugestão de próximos passos
SELECT 
    'Próximos passos recomendados' as recomendacao,
    'Os documentos ficaram sem tipo definido. ' ||
    'Considere criar novos tipos específicos para a entidade ' ||
    'ou permitir que os usuários escolham tipos apropriados.' as acao_sugerida;