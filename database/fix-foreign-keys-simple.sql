-- ============================================================================
-- CORREÇÃO SIMPLIFICADA - Foreign Keys para profiles(id)
-- ============================================================================

-- 1. CORRIGIR document_signatures
ALTER TABLE document_signatures DROP CONSTRAINT IF EXISTS document_signatures_user_id_fkey;
ALTER TABLE document_signatures 
ADD CONSTRAINT document_signatures_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 2. CORRIGIR multi_signature_approvals
ALTER TABLE multi_signature_approvals DROP CONSTRAINT IF EXISTS multi_signature_approvals_user_id_fkey;
ALTER TABLE multi_signature_approvals 
ADD CONSTRAINT multi_signature_approvals_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 3. CORRIGIR multi_signature_requests
ALTER TABLE multi_signature_requests DROP CONSTRAINT IF EXISTS multi_signature_requests_requester_id_fkey;
ALTER TABLE multi_signature_requests 
ADD CONSTRAINT multi_signature_requests_requester_id_fkey 
FOREIGN KEY (requester_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 4. CORRIGIR entity_invitations.invited_by
ALTER TABLE entity_invitations DROP CONSTRAINT IF EXISTS entity_invitations_invited_by_fkey;
ALTER TABLE entity_invitations 
ADD CONSTRAINT entity_invitations_invited_by_fkey 
FOREIGN KEY (invited_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- 5. CORRIGIR entities.admin_user_id
ALTER TABLE entities DROP CONSTRAINT IF EXISTS entities_admin_user_id_fkey;
ALTER TABLE entities 
ADD CONSTRAINT entities_admin_user_id_fkey 
FOREIGN KEY (admin_user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 6. CORRIGIR departments.manager_id
ALTER TABLE departments DROP CONSTRAINT IF EXISTS departments_manager_id_fkey;
ALTER TABLE departments 
ADD CONSTRAINT departments_manager_id_fkey 
FOREIGN KEY (manager_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 7. CORRIGIR documents.author_id
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_author_id_fkey;
ALTER TABLE documents 
ADD CONSTRAINT documents_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE RESTRICT;

-- 8. CORRIGIR document_versions.author_id
ALTER TABLE document_versions DROP CONSTRAINT IF EXISTS document_versions_author_id_fkey;
ALTER TABLE document_versions 
ADD CONSTRAINT document_versions_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 9. CORRIGIR approval_requests.approver_id
ALTER TABLE approval_requests DROP CONSTRAINT IF EXISTS approval_requests_approver_id_fkey;
ALTER TABLE approval_requests 
ADD CONSTRAINT approval_requests_approver_id_fkey 
FOREIGN KEY (approver_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 10. CORRIGIR approval_workflows.approver_id
ALTER TABLE approval_workflows DROP CONSTRAINT IF EXISTS approval_workflows_approver_id_fkey;
ALTER TABLE approval_workflows 
ADD CONSTRAINT approval_workflows_approver_id_fkey 
FOREIGN KEY (approver_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 11. CORRIGIR document_permissions
ALTER TABLE document_permissions DROP CONSTRAINT IF EXISTS document_permissions_granted_by_fkey;
ALTER TABLE document_permissions 
ADD CONSTRAINT document_permissions_granted_by_fkey 
FOREIGN KEY (granted_by) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE document_permissions DROP CONSTRAINT IF EXISTS document_permissions_user_id_fkey;
ALTER TABLE document_permissions 
ADD CONSTRAINT document_permissions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 12. CORRIGIR TABELAS DE CHAT
-- chat_conversations
ALTER TABLE chat_conversations DROP CONSTRAINT IF EXISTS chat_conversations_created_by_fkey;
ALTER TABLE chat_conversations 
ADD CONSTRAINT chat_conversations_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- chat_messages
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_id_fkey;
ALTER TABLE chat_messages 
ADD CONSTRAINT chat_messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- chat_participants
ALTER TABLE chat_participants DROP CONSTRAINT IF EXISTS chat_participants_user_id_fkey;
ALTER TABLE chat_participants 
ADD CONSTRAINT chat_participants_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- chat_message_reads
ALTER TABLE chat_message_reads DROP CONSTRAINT IF EXISTS chat_message_reads_user_id_fkey;
ALTER TABLE chat_message_reads 
ADD CONSTRAINT chat_message_reads_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- chat_deleted_conversations
ALTER TABLE chat_deleted_conversations DROP CONSTRAINT IF EXISTS chat_deleted_conversations_user_id_fkey;
ALTER TABLE chat_deleted_conversations 
ADD CONSTRAINT chat_deleted_conversations_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- chat_hidden_conversations
ALTER TABLE chat_hidden_conversations DROP CONSTRAINT IF EXISTS chat_hidden_conversations_user_id_fkey;
ALTER TABLE chat_hidden_conversations 
ADD CONSTRAINT chat_hidden_conversations_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 13. CORRIGIR audit_logs.user_id
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
ALTER TABLE audit_logs 
ADD CONSTRAINT audit_logs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;