-- ============================================================================
-- CORREÇÃO ROBUSTA DE FOREIGN KEYS COM LIMPEZA E AJUSTE DE CONSTRAINTS
-- ============================================================================

-- PARTE 1: AJUSTAR CONSTRAINTS NOT NULL PROBLEMÁTICAS
-- ============================================================================

-- 1. Remover constraint NOT NULL de documents.author_id
ALTER TABLE documents ALTER COLUMN author_id DROP NOT NULL;

-- 2. Remover constraint NOT NULL de outras colunas problemáticas (se existirem)
DO $$
BEGIN
    -- Verificar e ajustar document_versions.author_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'document_versions' 
        AND column_name = 'author_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE document_versions ALTER COLUMN author_id DROP NOT NULL;
    END IF;
    
    -- Verificar e ajustar approval_requests.approver_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'approval_requests' 
        AND column_name = 'approver_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE approval_requests ALTER COLUMN approver_id DROP NOT NULL;
    END IF;
END $$;

-- PARTE 2: LIMPEZA DE REFERÊNCIAS ÓRFÃS
-- ============================================================================

-- 1. LIMPAR document_signatures
DELETE FROM document_signatures 
WHERE user_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = user_id);

-- 2. LIMPAR multi_signature_approvals
DELETE FROM multi_signature_approvals 
WHERE user_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = user_id);

-- 3. LIMPAR multi_signature_requests
DELETE FROM multi_signature_requests 
WHERE requester_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = requester_id);

-- 4. CORRIGIR entities.admin_user_id (definir como NULL)
UPDATE entities 
SET admin_user_id = NULL
WHERE admin_user_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = admin_user_id);

-- 5. CORRIGIR documents.author_id (agora pode ser NULL)
UPDATE documents 
SET author_id = NULL
WHERE author_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = author_id);

-- 6. CORRIGIR document_versions.author_id
UPDATE document_versions 
SET author_id = NULL
WHERE author_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = author_id);

-- 7. CORRIGIR approval_requests.approver_id
UPDATE approval_requests 
SET approver_id = NULL
WHERE approver_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = approver_id);

-- 8. LIMPAR chat_conversations órfãs
DELETE FROM chat_conversations 
WHERE created_by IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = created_by);

-- 9. LIMPAR chat_messages órfãs
DELETE FROM chat_messages 
WHERE sender_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = sender_id);

-- 10. LIMPAR chat_participants órfãos
DELETE FROM chat_participants 
WHERE user_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = user_id);

-- 11. LIMPAR chat_message_reads órfãos
DELETE FROM chat_message_reads 
WHERE user_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = user_id);

-- 12. LIMPAR chat_deleted_conversations órfãos
DELETE FROM chat_deleted_conversations 
WHERE user_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = user_id);

-- 13. LIMPAR chat_hidden_conversations órfãos
DELETE FROM chat_hidden_conversations 
WHERE user_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = user_id);

-- 14. CORRIGIR audit_logs.user_id (definir como NULL)
UPDATE audit_logs 
SET user_id = NULL
WHERE user_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = user_id);

-- 15. LIMPAR document_permissions órfãos
DELETE FROM document_permissions 
WHERE (user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = user_id))
OR (granted_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = granted_by));

-- 16. LIMPAR entity_invitations órfãos
UPDATE entity_invitations 
SET invited_by = NULL
WHERE invited_by IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = invited_by);

-- 17. CORRIGIR departments.manager_id (se a tabela existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'departments') THEN
        UPDATE departments 
        SET manager_id = NULL
        WHERE manager_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = manager_id);
    END IF;
END $$;

-- PARTE 3: APLICAR FOREIGN KEYS
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

-- 6. CORRIGIR departments.manager_id (se a tabela existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'departments') THEN
        ALTER TABLE departments DROP CONSTRAINT IF EXISTS departments_manager_id_fkey;
        ALTER TABLE departments 
        ADD CONSTRAINT departments_manager_id_fkey 
        FOREIGN KEY (manager_id) REFERENCES profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 7. CORRIGIR documents.author_id
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_author_id_fkey;
ALTER TABLE documents 
ADD CONSTRAINT documents_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL;

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

-- PARTE 4: RELATÓRIO FINAL
-- ============================================================================
DO $$
DECLARE
    total_profiles INTEGER;
    total_documents INTEGER;
    total_orphaned_docs INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_profiles FROM profiles;
    SELECT COUNT(*) INTO total_documents FROM documents;
    SELECT COUNT(*) INTO total_orphaned_docs FROM documents WHERE author_id IS NULL;
    
    RAISE NOTICE '=== CORREÇÃO CONCLUÍDA ===';
    RAISE NOTICE 'Perfis na tabela profiles: %', total_profiles;
    RAISE NOTICE 'Total de documentos: %', total_documents;
    RAISE NOTICE 'Documentos sem autor: %', total_orphaned_docs;
    RAISE NOTICE 'Foreign keys aplicadas com sucesso!';
END $$;