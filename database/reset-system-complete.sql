-- ============================================================================
-- RESET COMPLETO DO SISTEMA - ZERAR TODOS OS USUÁRIOS
-- ============================================================================

-- ⚠️ ATENÇÃO: Este script ZERA COMPLETAMENTE o sistema!
-- Remove todos os usuários, perfis e dados relacionados
-- Execute apenas se tiver certeza absoluta!

-- 1. DESABILITAR TRIGGER PRIMEIRO
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. LIMPAR TODAS AS TABELAS RELACIONADAS A USUÁRIOS
-- (Em ordem para evitar problemas de foreign key)

-- Notificações
DELETE FROM notification_history;
DELETE FROM notifications;

-- Chat completo
DELETE FROM chat_message_reads;
DELETE FROM chat_messages;
DELETE FROM chat_participants;
DELETE FROM chat_deleted_conversations;
DELETE FROM chat_hidden_conversations;
DELETE FROM chat_conversations;

-- Assinaturas e aprovações
DELETE FROM document_signatures;
DELETE FROM multi_signature_approvals;
DELETE FROM multi_signature_requests;
DELETE FROM approval_requests;
DELETE FROM approval_workflows;

-- Permissões de documentos
DELETE FROM document_permissions;

-- Versões de documentos
DELETE FROM document_versions;

-- Convites de entidade
DELETE FROM entity_invitations;

-- 3. LIMPAR REFERÊNCIAS EM TABELAS QUE NÃO PODEM SER DELETADAS
UPDATE documents SET author_id = NULL;
UPDATE entities SET admin_user_id = NULL;
UPDATE departments SET manager_id = NULL;
UPDATE audit_logs SET user_id = NULL;

-- 4. REMOVER TODOS OS PERFIS
DELETE FROM profiles;

-- 5. REMOVER TODOS OS USUÁRIOS DO AUTH
-- Nota: Isso remove completamente os usuários do sistema de autenticação
DELETE FROM auth.users;

-- 6. RESET DE SEQUÊNCIAS (se necessário)
-- ALTER SEQUENCE IF EXISTS profiles_id_seq RESTART WITH 1;

-- 7. VERIFICAÇÃO FINAL
SELECT 
    (SELECT COUNT(*) FROM auth.users) as usuarios_auth,
    (SELECT COUNT(*) FROM profiles) as perfis,
    (SELECT COUNT(*) FROM documents) as documentos_restantes,
    (SELECT COUNT(*) FROM entities) as entidades_restantes,
    'SISTEMA COMPLETAMENTE ZERADO' as status;

-- 8. VERIFICAR SE TRIGGER FOI REMOVIDO
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = 'on_auth_user_created'
        )
        THEN '❌ TRIGGER AINDA ATIVO'
        ELSE '✅ TRIGGER REMOVIDO - PERFIS NÃO SERÃO CRIADOS AUTOMATICAMENTE'
    END as status_trigger;

-- 9. MENSAGEM FINAL
SELECT 
    '🔄 SISTEMA ZERADO COMPLETAMENTE' as resultado,
    '✅ Todos os usuários removidos' as usuarios,
    '✅ Todos os perfis removidos' as perfis,
    '✅ Trigger desabilitado' as trigger_status,
    '🎯 Sistema pronto para novos registros controlados' as proximo_passo;