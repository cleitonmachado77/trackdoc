-- ============================================================================
-- CORREÇÃO DOS ERROS DE CONSOLE - Verificar e Corrigir Dados Inconsistentes
-- ============================================================================

-- PARTE 1: VERIFICAR USUÁRIO PROBLEMÁTICO
-- ============================================================================

-- Verificar se o usuário existe em auth.users mas não em profiles
DO $$
DECLARE
    user_exists_auth BOOLEAN;
    user_exists_profiles BOOLEAN;
    problematic_user_id UUID := '1e4799e6-d473-4ffd-ad43-fb669af58be5';
BEGIN
    -- Verificar em auth.users
    SELECT EXISTS (
        SELECT 1 FROM auth.users WHERE id = problematic_user_id
    ) INTO user_exists_auth;
    
    -- Verificar em profiles
    SELECT EXISTS (
        SELECT 1 FROM profiles WHERE id = problematic_user_id
    ) INTO user_exists_profiles;
    
    RAISE NOTICE 'Usuário % - Auth: %, Profiles: %', 
                 problematic_user_id, user_exists_auth, user_exists_profiles;
    
    -- Se existe em auth mas não em profiles, criar perfil
    IF user_exists_auth AND NOT user_exists_profiles THEN
        INSERT INTO profiles (
            id, 
            full_name, 
            email, 
            role, 
            status,
            entity_role,
            registration_type,
            registration_completed
        )
        SELECT 
            id,
            COALESCE(raw_user_meta_data->>'full_name', email),
            email,
            'user',
            'active',
            'user',
            'individual',
            true
        FROM auth.users 
        WHERE id = problematic_user_id;
        
        RAISE NOTICE 'Perfil criado para usuário órfão: %', problematic_user_id;
    END IF;
    
    -- Se não existe em auth, limpar referências
    IF NOT user_exists_auth THEN
        -- Limpar documentos órfãos
        UPDATE documents SET author_id = NULL WHERE author_id = problematic_user_id;
        
        -- Limpar outras referências
        DELETE FROM document_signatures WHERE user_id = problematic_user_id;
        DELETE FROM chat_messages WHERE sender_id = problematic_user_id;
        DELETE FROM chat_participants WHERE user_id = problematic_user_id;
        
        RAISE NOTICE 'Referências limpas para usuário inexistente: %', problematic_user_id;
    END IF;
END $$;

-- PARTE 2: VERIFICAR E CORRIGIR CONSULTAS PROBLEMÁTICAS
-- ============================================================================

-- Verificar se approval_requests ainda tem dados órfãos
DO $$
DECLARE
    orphaned_approvals INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_approvals
    FROM approval_requests ar
    WHERE ar.approver_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = ar.approver_id);
    
    IF orphaned_approvals > 0 THEN
        -- Limpar approval_requests órfãos
        DELETE FROM approval_requests 
        WHERE approver_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = approver_id);
        
        RAISE NOTICE 'Removidos % approval_requests órfãos', orphaned_approvals;
    ELSE
        RAISE NOTICE 'Nenhum approval_request órfão encontrado';
    END IF;
END $$;

-- PARTE 3: VERIFICAR FOREIGN KEYS PROBLEMÁTICAS
-- ============================================================================

-- Verificar se departments tem manager_id órfão
DO $$
DECLARE
    orphaned_managers INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'departments') THEN
        SELECT COUNT(*) INTO orphaned_managers
        FROM departments d
        WHERE d.manager_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = d.manager_id);
        
        IF orphaned_managers > 0 THEN
            UPDATE departments 
            SET manager_id = NULL
            WHERE manager_id IS NOT NULL 
            AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = manager_id);
            
            RAISE NOTICE 'Corrigidos % departments com manager_id órfão', orphaned_managers;
        END IF;
    END IF;
END $$;

-- PARTE 4: VERIFICAR ENTIDADES E SEUS RELACIONAMENTOS
-- ============================================================================

-- Verificar se entities tem admin_user_id órfão
DO $$
DECLARE
    orphaned_admins INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_admins
    FROM entities e
    WHERE e.admin_user_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = e.admin_user_id);
    
    IF orphaned_admins > 0 THEN
        UPDATE entities 
        SET admin_user_id = NULL
        WHERE admin_user_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = admin_user_id);
        
        RAISE NOTICE 'Corrigidas % entities com admin_user_id órfão', orphaned_admins;
    END IF;
END $$;

-- PARTE 5: VERIFICAR DOCUMENTOS E SUAS REFERÊNCIAS
-- ============================================================================

-- Verificar documentos com referências órfãs
DO $$
DECLARE
    orphaned_docs INTEGER;
    orphaned_categories INTEGER;
    orphaned_types INTEGER;
BEGIN
    -- Documentos com author_id órfão
    SELECT COUNT(*) INTO orphaned_docs
    FROM documents d
    WHERE d.author_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = d.author_id);
    
    IF orphaned_docs > 0 THEN
        UPDATE documents 
        SET author_id = NULL
        WHERE author_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = author_id);
        
        RAISE NOTICE 'Corrigidos % documentos com author_id órfão', orphaned_docs;
    END IF;
    
    -- Documentos com category_id órfão
    SELECT COUNT(*) INTO orphaned_categories
    FROM documents d
    WHERE d.category_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM categories c WHERE c.id = d.category_id);
    
    IF orphaned_categories > 0 THEN
        UPDATE documents 
        SET category_id = NULL
        WHERE category_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM categories c WHERE c.id = category_id);
        
        RAISE NOTICE 'Corrigidos % documentos com category_id órfão', orphaned_categories;
    END IF;
    
    -- Documentos com document_type_id órfão
    SELECT COUNT(*) INTO orphaned_types
    FROM documents d
    WHERE d.document_type_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM document_types dt WHERE dt.id = d.document_type_id);
    
    IF orphaned_types > 0 THEN
        UPDATE documents 
        SET document_type_id = NULL
        WHERE document_type_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM document_types dt WHERE dt.id = document_type_id);
        
        RAISE NOTICE 'Corrigidos % documentos com document_type_id órfão', orphaned_types;
    END IF;
END $$;

-- PARTE 6: VERIFICAR FUNÇÕES RPC
-- ============================================================================

-- Verificar se a função get_entity_stats existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'get_entity_stats'
        AND routine_schema = 'public'
    ) THEN
        -- Criar função básica se não existir
        CREATE OR REPLACE FUNCTION public.get_entity_stats(entity_uuid UUID)
        RETURNS JSON AS $$
        DECLARE
            result JSON;
        BEGIN
            SELECT json_build_object(
                'total_documents', COALESCE((SELECT COUNT(*) FROM documents WHERE entity_id = entity_uuid), 0),
                'total_users', COALESCE((SELECT COUNT(*) FROM profiles WHERE entity_id = entity_uuid), 0),
                'pending_approvals', 0
            ) INTO result;
            
            RETURN result;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        
        RAISE NOTICE 'Função get_entity_stats criada';
    ELSE
        RAISE NOTICE 'Função get_entity_stats já existe';
    END IF;
END $$;

-- PARTE 7: RELATÓRIO FINAL
-- ============================================================================

DO $$
DECLARE
    total_profiles INTEGER;
    total_auth_users INTEGER;
    total_documents INTEGER;
    total_entities INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_profiles FROM profiles;
    SELECT COUNT(*) INTO total_auth_users FROM auth.users;
    SELECT COUNT(*) INTO total_documents FROM documents;
    SELECT COUNT(*) INTO total_entities FROM entities;
    
    RAISE NOTICE '=== VERIFICAÇÃO DE CONSISTÊNCIA CONCLUÍDA ===';
    RAISE NOTICE 'Usuários em auth.users: %', total_auth_users;
    RAISE NOTICE 'Perfis em profiles: %', total_profiles;
    RAISE NOTICE 'Total de documentos: %', total_documents;
    RAISE NOTICE 'Total de entidades: %', total_entities;
    
    -- Verificar se há discrepância
    IF total_auth_users != total_profiles THEN
        RAISE NOTICE 'ATENÇÃO: Discrepância entre auth.users (%) e profiles (%)', 
                     total_auth_users, total_profiles;
    ELSE
        RAISE NOTICE 'OK: auth.users e profiles estão sincronizados';
    END IF;
END $$;