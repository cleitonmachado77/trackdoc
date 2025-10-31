-- ========================================
-- SOLUÇÃO PARA O PROBLEMA DO TRIGGER DE APPROVAL_REQUIRED
-- ========================================

-- PROBLEMA: Quando o campo approval_required é alterado, o trigger
-- trigger_update_documents_on_type_change causa redirecionamento na aplicação

-- ========================================
-- OPÇÃO 1: DESABILITAR TRIGGER TEMPORARIAMENTE
-- ========================================

-- Verificar se o trigger existe
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_documents_on_type_change';

-- Desabilitar o trigger (CUIDADO: isso pode afetar a sincronização automática)
DROP TRIGGER IF EXISTS trigger_update_documents_on_type_change ON document_types;

-- ========================================
-- OPÇÃO 2: MODIFICAR O TRIGGER PARA SER MENOS AGRESSIVO
-- ========================================

-- Primeiro, salvar a definição atual (se existir)
/*
SELECT pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger 
WHERE tgname = 'trigger_update_documents_on_type_change';
*/

-- Recriar o trigger com lógica mais específica
-- (Execute apenas se você souber a função original)
/*
CREATE OR REPLACE FUNCTION update_documents_on_type_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Só atualizar documentos se realmente houver mudança significativa
    IF (OLD.retention_period IS DISTINCT FROM NEW.retention_period) THEN
        -- Atualizar apenas retention_period e retention_end_date
        UPDATE documents 
        SET 
            retention_period = NEW.retention_period,
            retention_end_date = CASE 
                WHEN NEW.retention_period > 0 THEN 
                    created_at + (NEW.retention_period || ' months')::INTERVAL
                ELSE NULL 
            END,
            updated_at = NOW()
        WHERE document_type_id = NEW.id;
    END IF;
    
    -- Para approval_required, não fazer nada que possa causar redirecionamento
    IF (OLD.approval_required IS DISTINCT FROM NEW.approval_required) THEN
        -- Apenas log ou operação mínima
        -- UPDATE documents SET updated_at = NOW() WHERE document_type_id = NEW.id;
        NULL; -- Não fazer nada por enquanto
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar o trigger
CREATE TRIGGER trigger_update_documents_on_type_change
    AFTER UPDATE ON document_types
    FOR EACH ROW
    EXECUTE FUNCTION update_documents_on_type_change();
*/

-- ========================================
-- OPÇÃO 3: CRIAR TRIGGER MAIS ESPECÍFICO
-- ========================================

-- Criar um trigger que só atua em retention_period
/*
CREATE OR REPLACE FUNCTION update_documents_retention_only()
RETURNS TRIGGER AS $$
BEGIN
    -- Só atualizar se retention_period mudou
    IF (OLD.retention_period IS DISTINCT FROM NEW.retention_period) THEN
        UPDATE documents 
        SET 
            retention_period = NEW.retention_period,
            retention_end_date = CASE 
                WHEN NEW.retention_period > 0 THEN 
                    created_at + (NEW.retention_period || ' months')::INTERVAL
                ELSE NULL 
            END,
            updated_at = NOW()
        WHERE document_type_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_documents_retention_only
    AFTER UPDATE OF retention_period ON document_types
    FOR EACH ROW
    EXECUTE FUNCTION update_documents_retention_only();
*/

-- ========================================
-- VERIFICAÇÃO PÓS-CORREÇÃO
-- ========================================

-- Verificar triggers ativos
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'document_types'
ORDER BY trigger_name;

-- Testar uma atualização de approval_required
/*
-- Backup do estado atual
CREATE TEMP TABLE temp_test_backup AS 
SELECT id, name, approval_required FROM document_types LIMIT 1;

-- Teste
UPDATE document_types 
SET approval_required = NOT approval_required 
WHERE id = (SELECT id FROM temp_test_backup);

-- Verificar se funcionou sem problemas
SELECT 'Teste concluído - verificar se houve redirecionamento na aplicação' as status;

-- Reverter se necessário
UPDATE document_types 
SET approval_required = (SELECT approval_required FROM temp_test_backup)
WHERE id = (SELECT id FROM temp_test_backup);
*/

-- ========================================
-- MONITORAMENTO
-- ========================================

-- Para monitorar problemas futuros
SELECT 
    schemaname,
    tablename,
    n_tup_upd as updates_count,
    n_tup_del as deletes_count,
    last_autoanalyze
FROM pg_stat_user_tables 
WHERE tablename IN ('document_types', 'documents')
ORDER BY tablename;