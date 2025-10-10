-- 🔄 LIMPAR APENAS DADOS: Remove registros mas mantém estrutura das tabelas

DO $$
BEGIN
    RAISE NOTICE '🔄 Iniciando limpeza de dados...';
    
    -- Remover dados de tabelas relacionadas (respeitando foreign keys)
    
    -- 1. Assinaturas de entidades
    DELETE FROM entity_subscriptions;
    RAISE NOTICE '✅ Dados de entity_subscriptions removidos';
    
    -- 2. Convites de entidades (se existir)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entity_invitations') THEN
        DELETE FROM entity_invitations;
        RAISE NOTICE '✅ Dados de entity_invitations removidos';
    END IF;
    
    -- 3. Solicitações de aprovação (se existir)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'approval_requests') THEN
        DELETE FROM approval_requests;
        RAISE NOTICE '✅ Dados de approval_requests removidos';
    END IF;
    
    -- 4. Documentos (se existir)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents') THEN
        DELETE FROM documents;
        RAISE NOTICE '✅ Dados de documents removidos';
    END IF;
    
    -- 5. Configurações de notificação (se existir)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_settings') THEN
        DELETE FROM notification_settings;
        RAISE NOTICE '✅ Dados de notification_settings removidos';
    END IF;
    
    -- 6. Perfis de usuários
    DELETE FROM profiles;
    RAISE NOTICE '✅ Dados de profiles removidos';
    
    -- 7. Entidades
    DELETE FROM entities;
    RAISE NOTICE '✅ Dados de entities removidos';
    
    -- 8. Usuários do sistema de autenticação
    DELETE FROM auth.users;
    RAISE NOTICE '✅ Dados de auth.users removidos';
    
    RAISE NOTICE '🎉 LIMPEZA DE DADOS CONCLUÍDA!';
    RAISE NOTICE '✅ Todas as tabelas mantidas, apenas dados removidos';
    
END $$;

-- Verificar resultado
SELECT 
    '🔍 VERIFICAÇÃO' as status,
    (SELECT COUNT(*) FROM auth.users) as usuarios,
    (SELECT COUNT(*) FROM profiles) as perfis,
    (SELECT COUNT(*) FROM entities) as entidades,
    (SELECT COUNT(*) FROM entity_subscriptions) as assinaturas;

-- Confirmar limpeza
DO $$
DECLARE
    total_users INTEGER;
    total_entities INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_users FROM auth.users;
    SELECT COUNT(*) INTO total_entities FROM entities;
    
    IF total_users = 0 AND total_entities = 0 THEN
        RAISE NOTICE '🎉 LIMPEZA COMPLETA REALIZADA!';
        RAISE NOTICE '✅ Todos os dados de cadastro foram removidos';
        RAISE NOTICE '📋 Estrutura das tabelas mantida';
        RAISE NOTICE '🧪 Sistema pronto para novos cadastros';
    ELSE
        RAISE NOTICE '⚠️ Limpeza incompleta: % usuários, % entidades restantes', total_users, total_entities;
    END IF;
END $$;