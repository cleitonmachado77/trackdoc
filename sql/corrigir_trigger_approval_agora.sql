-- ========================================
-- CORREÇÃO IMEDIATA DO PROBLEMA DE APPROVAL_REQUIRED
-- ========================================

-- Este script resolve o problema de redirecionamento quando
-- o campo "Aprovação Obrigatória" é alterado

-- ========================================
-- PASSO 1: VERIFICAR O PROBLEMA
-- ========================================

-- Ver se o trigger problemático existe
SELECT 
    'Trigger encontrado: ' || trigger_name as status
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_documents_on_type_change'
UNION ALL
SELECT 'Nenhum trigger encontrado' as status
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'trigger_update_documents_on_type_change'
);

-- ========================================
-- PASSO 2: SOLUÇÃO IMEDIATA
-- ========================================

-- Desabilitar o trigger que está causando o redirecionamento
DROP TRIGGER IF EXISTS trigger_update_documents_on_type_change ON document_types;

-- ========================================
-- PASSO 3: VERIFICAR SE FOI RESOLVIDO
-- ========================================

-- Confirmar que o trigger foi removido
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Trigger removido com sucesso!'
        ELSE '❌ Trigger ainda existe'
    END as resultado
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_documents_on_type_change';

-- ========================================
-- PASSO 4: VERIFICAR TRIGGERS RESTANTES
-- ========================================

-- Ver quais triggers ainda existem na tabela document_types
SELECT 
    '📋 Triggers restantes:' as info,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'document_types'
ORDER BY trigger_name;

-- ========================================
-- INFORMAÇÕES IMPORTANTES
-- ========================================

SELECT '⚠️ ATENÇÃO: Ao remover o trigger, a sincronização automática entre tipos de documentos e documentos foi desabilitada.' as aviso
UNION ALL
SELECT '✅ BENEFÍCIO: O problema de redirecionamento ao alterar "Aprovação Obrigatória" foi resolvido.' as beneficio
UNION ALL
SELECT '🔄 PRÓXIMO PASSO: Teste alterar o campo "Aprovação Obrigatória" na interface para confirmar que funciona.' as proximo_passo;