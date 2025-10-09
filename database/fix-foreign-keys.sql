-- ============================================================================
-- CORREÇÃO DAS FOREIGN KEYS - Padronização para profiles(id)
-- ============================================================================

-- 1. CORRIGIR FOREIGN KEYS EM document_signatures
DO $$
BEGIN
  -- Verificar se a tabela existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_signatures') THEN
    -- Remover constraint antiga se existir
    ALTER TABLE document_signatures DROP CONSTRAINT IF EXISTS document_signatures_user_id_fkey;
    
    -- Adicionar nova constraint referenciando profiles(id)
    ALTER TABLE document_signatures 
    ADD CONSTRAINT document_signatures_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key de document_signatures corrigida';
  END IF;
END $$;

-- 2. CORRIGIR FOREIGN KEYS EM multi_signature_approvals
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multi_signature_approvals') THEN
    ALTER TABLE multi_signature_approvals DROP CONSTRAINT IF EXISTS multi_signature_approvals_user_id_fkey;
    
    ALTER TABLE multi_signature_approvals 
    ADD CONSTRAINT multi_signature_approvals_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key de multi_signature_approvals corrigida';
  END IF;
END $$;

-- 3. CORRIGIR FOREIGN KEYS EM multi_signature_requests
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multi_signature_requests') THEN
    ALTER TABLE multi_signature_requests DROP CONSTRAINT IF EXISTS multi_signature_requests_requester_id_fkey;
    
    ALTER TABLE multi_signature_requests 
    ADD CONSTRAINT multi_signature_requests_requester_id_fkey 
    FOREIGN KEY (requester_id) REFERENCES profiles(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key de multi_signature_requests corrigida';
  END IF;
END $$;

-- 4. VERIFICAR E CORRIGIR OUTRAS TABELAS QUE PODEM TER REFERÊNCIAS INCONSISTENTES

-- Verificar entity_invitations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entity_invitations') THEN
    -- Verificar se invited_by referencia auth.users ou profiles
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'entity_invitations' 
      AND kcu.column_name = 'invited_by'
      AND tc.constraint_type = 'FOREIGN KEY'
    ) THEN
      ALTER TABLE entity_invitations DROP CONSTRAINT IF EXISTS entity_invitations_invited_by_fkey;
      
      ALTER TABLE entity_invitations 
      ADD CONSTRAINT entity_invitations_invited_by_fkey 
      FOREIGN KEY (invited_by) REFERENCES profiles(id) ON DELETE SET NULL;
      
      RAISE NOTICE 'Foreign key de entity_invitations.invited_by corrigida';
    END IF;
  END IF;
END $$;

-- 5. VERIFICAR E CORRIGIR entities.admin_user_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entities') THEN
    ALTER TABLE entities DROP CONSTRAINT IF EXISTS entities_admin_user_id_fkey;
    
    ALTER TABLE entities 
    ADD CONSTRAINT entities_admin_user_id_fkey 
    FOREIGN KEY (admin_user_id) REFERENCES profiles(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'Foreign key de entities.admin_user_id corrigida';
  END IF;
END $$;

-- 6. VERIFICAR E CORRIGIR departments.manager_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'departments') THEN
    ALTER TABLE departments DROP CONSTRAINT IF EXISTS departments_manager_id_fkey;
    
    ALTER TABLE departments 
    ADD CONSTRAINT departments_manager_id_fkey 
    FOREIGN KEY (manager_id) REFERENCES profiles(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'Foreign key de departments.manager_id corrigida';
  END IF;
END $$;

-- 7. VERIFICAR E CORRIGIR documents.author_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents') THEN
    ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_author_id_fkey;
    
    ALTER TABLE documents 
    ADD CONSTRAINT documents_author_id_fkey 
    FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE RESTRICT;
    
    RAISE NOTICE 'Foreign key de documents.author_id corrigida';
  END IF;
END $$;

-- 8. VERIFICAR E CORRIGIR document_versions.author_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_versions') THEN
    ALTER TABLE document_versions DROP CONSTRAINT IF EXISTS document_versions_author_id_fkey;
    
    ALTER TABLE document_versions 
    ADD CONSTRAINT document_versions_author_id_fkey 
    FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'Foreign key de document_versions.author_id corrigida';
  END IF;
END $$;

-- 9. VERIFICAR E CORRIGIR approval_requests.approver_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'approval_requests') THEN
    ALTER TABLE approval_requests DROP CONSTRAINT IF EXISTS approval_requests_approver_id_fkey;
    
    ALTER TABLE approval_requests 
    ADD CONSTRAINT approval_requests_approver_id_fkey 
    FOREIGN KEY (approver_id) REFERENCES profiles(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'Foreign key de approval_requests.approver_id corrigida';
  END IF;
END $$;

-- 10. VERIFICAR E CORRIGIR approval_workflows.approver_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'approval_workflows') THEN
    ALTER TABLE approval_workflows DROP CONSTRAINT IF EXISTS approval_workflows_approver_id_fkey;
    
    ALTER TABLE approval_workflows 
    ADD CONSTRAINT approval_workflows_approver_id_fkey 
    FOREIGN KEY (approver_id) REFERENCES profiles(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key de approval_workflows.approver_id corrigida';
  END IF;
END $$;

-- 11. VERIFICAR E CORRIGIR document_permissions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_permissions') THEN
    -- granted_by
    ALTER TABLE document_permissions DROP CONSTRAINT IF EXISTS document_permissions_granted_by_fkey;
    ALTER TABLE document_permissions 
    ADD CONSTRAINT document_permissions_granted_by_fkey 
    FOREIGN KEY (granted_by) REFERENCES profiles(id) ON DELETE CASCADE;
    
    -- user_id
    ALTER TABLE document_permissions DROP CONSTRAINT IF EXISTS document_permissions_user_id_fkey;
    ALTER TABLE document_permissions 
    ADD CONSTRAINT document_permissions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign keys de document_permissions corrigidas';
  END IF;
END $$;

-- 12. VERIFICAR E CORRIGIR TABELAS DE CHAT
DO $$
BEGIN
  -- chat_conversations
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_conversations') THEN
    ALTER TABLE chat_conversations DROP CONSTRAINT IF EXISTS chat_conversations_created_by_fkey;
    ALTER TABLE chat_conversations 
    ADD CONSTRAINT chat_conversations_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key de chat_conversations.created_by corrigida';
  END IF;
  
  -- chat_messages
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
    ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_id_fkey;
    ALTER TABLE chat_messages 
    ADD CONSTRAINT chat_messages_sender_id_fkey 
    FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key de chat_messages.sender_id corrigida';
  END IF;
  
  -- chat_participants
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_participants') THEN
    ALTER TABLE chat_participants DROP CONSTRAINT IF EXISTS chat_participants_user_id_fkey;
    ALTER TABLE chat_participants 
    ADD CONSTRAINT chat_participants_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key de chat_participants.user_id corrigida';
  END IF;
  
  -- chat_message_reads
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_message_reads') THEN
    ALTER TABLE chat_message_reads DROP CONSTRAINT IF EXISTS chat_message_reads_user_id_fkey;
    ALTER TABLE chat_message_reads 
    ADD CONSTRAINT chat_message_reads_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key de chat_message_reads.user_id corrigida';
  END IF;
  
  -- chat_deleted_conversations
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_deleted_conversations') THEN
    ALTER TABLE chat_deleted_conversations DROP CONSTRAINT IF EXISTS chat_deleted_conversations_user_id_fkey;
    ALTER TABLE chat_deleted_conversations 
    ADD CONSTRAINT chat_deleted_conversations_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key de chat_deleted_conversations.user_id corrigida';
  END IF;
  
  -- chat_hidden_conversations
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_hidden_conversations') THEN
    ALTER TABLE chat_hidden_conversations DROP CONSTRAINT IF EXISTS chat_hidden_conversations_user_id_fkey;
    ALTER TABLE chat_hidden_conversations 
    ADD CONSTRAINT chat_hidden_conversations_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key de chat_hidden_conversations.user_id corrigida';
  END IF;
END $$;

-- 13. VERIFICAR E CORRIGIR audit_logs.user_id (já deve estar correto)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    -- Simplesmente recriar a constraint para garantir consistência
    ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
    ALTER TABLE audit_logs 
    ADD CONSTRAINT audit_logs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'Foreign key de audit_logs.user_id corrigida';
  END IF;
END $$;

-- 14. RELATÓRIO FINAL
DO $$
DECLARE
  fk_count INTEGER;
BEGIN
  -- Contar foreign keys que referenciam profiles usando constraint_column_usage
  SELECT COUNT(*) INTO fk_count
  FROM information_schema.referential_constraints rc
  JOIN information_schema.constraint_column_usage ccu ON rc.constraint_name = ccu.constraint_name
  WHERE ccu.table_name = 'profiles';
  
  RAISE NOTICE 'Total de foreign keys referenciando profiles: %', fk_count;
  
  -- Contar foreign keys que ainda referenciam auth.users
  SELECT COUNT(*) INTO fk_count
  FROM information_schema.referential_constraints rc
  JOIN information_schema.constraint_column_usage ccu ON rc.constraint_name = ccu.constraint_name
  WHERE ccu.table_name = 'users' 
  AND ccu.table_schema = 'auth';
  
  RAISE NOTICE 'Foreign keys ainda referenciando auth.users: %', fk_count;
  
  RAISE NOTICE 'Correção de foreign keys concluída!';
END $$;