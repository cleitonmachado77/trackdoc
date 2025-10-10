-- ============================================================================
-- RESET COMPLETO - REMOVER TODOS OS USUÁRIOS E PERFIS
-- ============================================================================

-- ⚠️ ATENÇÃO: Este script remove TODOS os usuários do sistema!
-- Execute apenas se tiver certeza que quer zerar tudo

-- 1. REMOVER TRIGGER PARA EVITAR CRIAÇÃO AUTOMÁTICA
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. LIMPAR TODAS AS TABELAS QUE REFERENCIAM USUÁRIOS
-- (Em ordem para evitar problemas de foreign key)

-- Tabelas de chat
DELETE FROM chat_message_reads;
DELETE FROM chat_messages;
DELETE FROM chat_participants;
DELETE FROM chat_deleted_conversations;
DELETE FROM chat_hidden_conversations;
DELETE FROM chat_conversations;

-- Tabelas de documentos e assinaturas
DELETE FROM document_signatures;
DELETE FROM multi_signature_approvals;
DELETE FROM multi_signature_requests;
DELETE FROM document_permissions;
DELETE FROM document_versions;
DELETE FROM approval_requests;
DELETE FROM approval_workflows;

-- Limpar referências em outras tabelas
UPDATE documents SET author_id = NULL;
UPDATE entities SET admin_user_id = NULL;
UPDATE departments SET manager_id = NULL;
UPDATE entity_invitations SET invited_by = NULL;
UPDATE audit_logs SET user_id = NULL;

-- 3. REMOVER TODOS OS PERFIS
DELETE FROM profiles;

-- 4. REMOVER TODOS OS USUÁRIOS DO AUTH (USANDO SERVICE ROLE)
-- Nota: Isso deve ser feito com cuidado pois remove completamente os usuários
DELETE FROM auth.users;

-- 5. VERIFICAR SE TUDO FOI REMOVIDO
SELECT 
    (SELECT COUNT(*) FROM auth.users) as usuarios_auth,
    (SELECT COUNT(*) FROM profiles) as perfis,
    'SISTEMA ZERADO' as status;

-- 6. RELATÓRIO FINAL
SELECT 
    'RESET COMPLETO EXECUTADO' as resultado,
    'Todos os usuários e perfis foram removidos' as descricao,
    'Sistema pronto para novos registros' as proximo_passo;