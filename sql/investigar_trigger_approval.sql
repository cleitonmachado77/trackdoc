-- ========================================
-- INVESTIGAÇÃO DO TRIGGER DE APPROVAL_REQUIRED
-- ========================================

-- 1. Verificar se o trigger existe
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_documents_on_type_change';

-- 2. Verificar a função associada ao trigger
SELECT 
    routine_name,
    routine_definition,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'update_documents_on_type_change';

-- 3. Verificar todos os triggers na tabela document_types
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'document_types';

-- 4. Verificar se há outras funções relacionadas
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition ILIKE '%approval_required%'
   OR routine_definition ILIKE '%document_types%';

-- ========================================
-- SOLUÇÃO TEMPORÁRIA: DESABILITAR TRIGGER
-- ========================================

-- Se o trigger estiver causando problemas, você pode desabilitá-lo temporariamente:
/*
DROP TRIGGER IF EXISTS trigger_update_documents_on_type_change ON document_types;
*/

-- ========================================
-- SOLUÇÃO ALTERNATIVA: MODIFICAR TRIGGER
-- ========================================

-- Se quiser manter o trigger mas evitar problemas, pode modificá-lo para ser menos agressivo:
/*
-- Primeiro, ver a definição atual
SELECT pg_get_triggerdef(oid) 
FROM pg_trigger 
WHERE tgname = 'trigger_update_documents_on_type_change';

-- Depois, recriar com lógica mais específica se necessário
*/

-- ========================================
-- VERIFICAR LOGS DE ERRO
-- ========================================

-- Nota: pg_log não está disponível no Supabase
-- Para verificar logs, use o Dashboard do Supabase > Logs
-- Ou verifique logs da aplicação no console do navegador

-- ========================================
-- TESTE MANUAL DO COMPORTAMENTO
-- ========================================

-- Testar uma atualização manual para ver o que acontece
/*
-- Backup do estado atual
CREATE TEMP TABLE temp_document_types_backup AS 
SELECT * FROM document_types WHERE id = 'SEU_TIPO_ID_AQUI';

-- Teste de atualização
UPDATE document_types 
SET approval_required = NOT approval_required 
WHERE id = 'SEU_TIPO_ID_AQUI';

-- Verificar o que mudou
SELECT * FROM document_types WHERE id = 'SEU_TIPO_ID_AQUI';

-- Reverter se necessário
UPDATE document_types 
SET approval_required = (SELECT approval_required FROM temp_document_types_backup)
WHERE id = 'SEU_TIPO_ID_AQUI';
*/

-- ========================================
-- MONITORAMENTO EM TEMPO REAL
-- ========================================

-- Para monitorar o que acontece quando o trigger executa:
/*
-- Habilitar log de statements
SET log_statement = 'all';
SET log_min_duration_statement = 0;

-- Executar a atualização e observar os logs
UPDATE document_types 
SET approval_required = true 
WHERE id = 'SEU_TIPO_ID_AQUI';
*/