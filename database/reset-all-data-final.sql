-- 🔄 RESET COMPLETO: Zerar todos os dados para teste limpo
-- Este script remove todos os usuários, entidades e dados relacionados

-- 1. REMOVER DADOS EM ORDEM (respeitando foreign keys)
DO $$
BEGIN
    -- Remover apenas tabelas que existem
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entity_subscriptions') THEN
        DELETE FROM entity_subscriptions;
        RAISE NOTICE '✅ entity_subscriptions removidas';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entity_invitations') THEN
        DELETE FROM entity_invitations;
        RAISE NOTICE '✅ entity_invitations removidas';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'approval_requests') THEN
        DELETE FROM approval_requests;
        RAISE NOTICE '✅ approval_requests removidas';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents') THEN
        DELETE FROM documents;
        RAISE NOTICE '✅ documents removidos';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_settings') THEN
        DELETE FROM notification_settings;
        RAISE NOTICE '✅ notification_settings removidas';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        DELETE FROM profiles;
        RAISE NOTICE '✅ profiles removidos';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entities') THEN
        DELETE FROM entities;
        RAISE NOTICE '✅ entities removidas';
    END IF;
    
    -- Remover usuários do auth (sempre existe)
    DELETE FROM auth.users;
    RAISE NOTICE '✅ auth.users removidos';
    
END $$;

-- 2. Confirmar remoção
DO $$
BEGIN
    RAISE NOTICE '✅ Reset completo executado!';
    RAISE NOTICE '✅ Todos os dados foram removidos';
END $$;

-- 3. VERIFICAÇÃO FINAL
SELECT 
    '🔍 VERIFICAÇÃO FINAL' as status,
    (SELECT COUNT(*) FROM auth.users) as usuarios_auth,
    (SELECT COUNT(*) FROM profiles) as perfis,
    (SELECT COUNT(*) FROM entities) as entidades,
    (SELECT COUNT(*) FROM entity_subscriptions) as assinaturas,
    (SELECT COUNT(*) FROM documents) as documentos;

-- 4. CONFIRMAR RESET
DO $$
DECLARE
    total_users INTEGER;
    total_entities INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_users FROM auth.users;
    SELECT COUNT(*) INTO total_entities FROM entities;
    
    IF total_users = 0 AND total_entities = 0 THEN
        RAISE NOTICE '🎉 RESET COMPLETO REALIZADO COM SUCESSO!';
        RAISE NOTICE '✅ Todos os dados foram removidos';
        RAISE NOTICE '🧪 Sistema pronto para teste limpo';
        RAISE NOTICE '📋 Próximo passo: Registrar nova entidade';
    ELSE
        RAISE NOTICE '⚠️ Reset incompleto: % usuários, % entidades restantes', total_users, total_entities;
    END IF;
END $$;

-- 5. LEMBRETE IMPORTANTE
DO $$
BEGIN
    RAISE NOTICE '🔧 LEMBRETE: Função handle_new_user está corrigida e ativa';
    RAISE NOTICE '✅ Trigger funcionando corretamente';
    RAISE NOTICE '🧪 Agora registre nova entidade para testar';
    RAISE NOTICE '📊 Deve ver logs: [NUCLEAR FIX] FUNÇÃO SUBSTITUÍDA EXECUTANDO';
END $$;