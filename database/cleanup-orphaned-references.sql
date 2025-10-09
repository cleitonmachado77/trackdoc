-- ============================================================================
-- LIMPEZA DE REFERÊNCIAS ÓRFÃS - Antes de aplicar Foreign Keys
-- ============================================================================

-- Este script remove registros que referenciam usuários inexistentes
-- Execute ANTES de aplicar fix-foreign-keys-simple.sql

-- 1. VERIFICAR E LIMPAR document_signatures
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    -- Contar registros órfãos
    SELECT COUNT(*) INTO orphaned_count
    FROM document_signatures ds
    WHERE ds.user_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = ds.user_id);
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Encontrados % registros órfãos em document_signatures', orphaned_count;
        
        -- Remover registros órfãos
        DELETE FROM document_signatures 
        WHERE user_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = user_id);
        
        RAISE NOTICE 'Removidos % registros órfãos de document_signatures', orphaned_count;
    ELSE
        RAISE NOTICE 'Nenhum registro órfão encontrado em document_signatures';
    END IF;
END $$;

-- 2. VERIFICAR E LIMPAR multi_signature_approvals
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM multi_signature_approvals msa
    WHERE msa.user_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = msa.user_id);
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Encontrados % registros órfãos em multi_signature_approvals', orphaned_count;
        
        DELETE FROM multi_signature_approvals 
        WHERE user_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = user_id);
        
        RAISE NOTICE 'Removidos % registros órfãos de multi_signature_approvals', orphaned_count;
    ELSE
        RAISE NOTICE 'Nenhum registro órfão encontrado em multi_signature_approvals';
    END IF;
END $$;

-- 3. VERIFICAR E LIMPAR multi_signature_requests
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM multi_signature_requests msr
    WHERE msr.requester_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = msr.requester_id);
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Encontrados % registros órfãos em multi_signature_requests', orphaned_count;
        
        DELETE FROM multi_signature_requests 
        WHERE requester_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = requester_id);
        
        RAISE NOTICE 'Removidos % registros órfãos de multi_signature_requests', orphaned_count;
    ELSE
        RAISE NOTICE 'Nenhum registro órfão encontrado em multi_signature_requests';
    END IF;
END $$;

-- 4. VERIFICAR E LIMPAR entities.admin_user_id
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM entities e
    WHERE e.admin_user_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = e.admin_user_id);
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Encontrados % registros órfãos em entities.admin_user_id', orphaned_count;
        
        -- Definir admin_user_id como NULL para registros órfãos
        UPDATE entities 
        SET admin_user_id = NULL
        WHERE admin_user_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = admin_user_id);
        
        RAISE NOTICE 'Corrigidos % registros órfãos em entities.admin_user_id', orphaned_count;
    ELSE
        RAISE NOTICE 'Nenhum registro órfão encontrado em entities.admin_user_id';
    END IF;
END $$;

-- 5. VERIFICAR E LIMPAR documents.author_id
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM documents d
    WHERE d.author_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = d.author_id);
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Encontrados % registros órfãos em documents.author_id', orphaned_count;
        
        -- Para documents, vamos manter os registros mas definir author_id como NULL
        UPDATE documents 
        SET author_id = NULL
        WHERE author_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = author_id);
        
        RAISE NOTICE 'Corrigidos % registros órfãos em documents.author_id', orphaned_count;
    ELSE
        RAISE NOTICE 'Nenhum registro órfão encontrado em documents.author_id';
    END IF;
END $$;

-- 6. VERIFICAR E LIMPAR chat_conversations.created_by
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM chat_conversations cc
    WHERE cc.created_by IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = cc.created_by);
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Encontrados % registros órfãos em chat_conversations', orphaned_count;
        
        -- Remover conversas órfãs (isso removerá mensagens em cascata)
        DELETE FROM chat_conversations 
        WHERE created_by IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = created_by);
        
        RAISE NOTICE 'Removidos % registros órfãos de chat_conversations', orphaned_count;
    ELSE
        RAISE NOTICE 'Nenhum registro órfão encontrado em chat_conversations';
    END IF;
END $$;

-- 7. VERIFICAR E LIMPAR chat_messages.sender_id
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM chat_messages cm
    WHERE cm.sender_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = cm.sender_id);
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Encontrados % registros órfãos em chat_messages', orphaned_count;
        
        DELETE FROM chat_messages 
        WHERE sender_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = sender_id);
        
        RAISE NOTICE 'Removidos % registros órfãos de chat_messages', orphaned_count;
    ELSE
        RAISE NOTICE 'Nenhum registro órfão encontrado em chat_messages';
    END IF;
END $$;

-- 8. VERIFICAR E LIMPAR audit_logs.user_id
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM audit_logs al
    WHERE al.user_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = al.user_id);
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Encontrados % registros órfãos em audit_logs', orphaned_count;
        
        -- Para audit_logs, definir user_id como NULL para manter histórico
        UPDATE audit_logs 
        SET user_id = NULL
        WHERE user_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = user_id);
        
        RAISE NOTICE 'Corrigidos % registros órfãos em audit_logs', orphaned_count;
    ELSE
        RAISE NOTICE 'Nenhum registro órfão encontrado em audit_logs';
    END IF;
END $$;

-- 9. RELATÓRIO FINAL
DO $$
DECLARE
    total_profiles INTEGER;
    total_auth_users INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_profiles FROM profiles;
    SELECT COUNT(*) INTO total_auth_users FROM auth.users;
    
    RAISE NOTICE 'LIMPEZA CONCLUÍDA:';
    RAISE NOTICE '- Perfis na tabela profiles: %', total_profiles;
    RAISE NOTICE '- Usuários em auth.users: %', total_auth_users;
    RAISE NOTICE 'Agora você pode executar fix-foreign-keys-simple.sql';
END $$;