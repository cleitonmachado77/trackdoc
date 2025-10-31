-- ========================================
-- INVESTIGAÇÃO SIMPLES DO TRIGGER
-- ========================================

-- 1. Verificar se o trigger existe
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_documents_on_type_change';

-- 2. Verificar todos os triggers na tabela document_types
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'document_types'
ORDER BY trigger_name;

-- 3. Verificar a função associada (se existir)
SELECT 
    routine_name,
    routine_type,
    routine_language
FROM information_schema.routines 
WHERE routine_name = 'update_documents_on_type_change';

-- 4. Ver definição da função (se existir)
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'update_documents_on_type_change';

-- ========================================
-- SOLUÇÃO RÁPIDA: DESABILITAR TRIGGER
-- ========================================

-- Se quiser desabilitar o trigger que está causando problema:
-- DROP TRIGGER IF EXISTS trigger_update_documents_on_type_change ON document_types;

-- ========================================
-- VERIFICAR RESULTADO
-- ========================================

-- Após desabilitar, verificar se foi removido:
-- SELECT COUNT(*) as triggers_restantes
-- FROM information_schema.triggers 
-- WHERE trigger_name = 'trigger_update_documents_on_type_change';