-- 🔧 CORREÇÃO: Usuário atual + teste do sistema

-- 1. Corrigir usuário atual que foi criado incorretamente
DO $$
DECLARE
    v_user_id UUID := 'b9b0a9e5-5c3a-4b0b-8391-18570f9064a7';
    v_entity_name TEXT := 'Prefeitura Santa Amelia';
    v_entity_legal_name TEXT := 'SA Melia';
    v_entity_cnpj TEXT := '06125758900010';
    v_entity_phone TEXT := '43991879783';
    v_plan_id UUID;
    v_entity_id UUID;
    v_user_exists BOOLEAN;
BEGIN
    -- Verificar se usuário existe
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = v_user_id) INTO v_user_exists;
    
    IF NOT v_user_exists THEN
        RAISE NOTICE '❌ Usuário não encontrado';
        RETURN;
    END IF;
    
    RAISE NOTICE '🔧 Corrigindo usuário atual...';
    
    -- Buscar plano
    SELECT id INTO v_plan_id FROM plans WHERE is_active = true ORDER BY price_monthly ASC LIMIT 1;
    
    -- Criar entidade
    INSERT INTO entities (name, legal_name, cnpj, email, phone, subscription_plan_id, max_users, admin_user_id, status, type)
    VALUES (v_entity_name, v_entity_legal_name, v_entity_cnpj, 'cleitoncr767@gmail.com', v_entity_phone, v_plan_id, 10, v_user_id, 'active', 'company')
    RETURNING id INTO v_entity_id;
    
    -- Atualizar perfil
    UPDATE profiles SET
        registration_type = 'entity_admin',
        entity_role = 'admin',
        role = 'admin',
        entity_id = v_entity_id,
        registration_completed = true,
        updated_at = NOW()
    WHERE id = v_user_id;
    
    -- Criar assinatura
    INSERT INTO entity_subscriptions (entity_id, plan_id, status, is_trial, current_period_start, current_period_end)
    VALUES (v_entity_id, v_plan_id, 'active', true, NOW(), NOW() + INTERVAL '30 days');
    
    RAISE NOTICE '✅ Usuário corrigido: % com entidade %', 'cleitoncr767@gmail.com', v_entity_name;
    
END $$;

-- 2. Verificar resultado da correção
SELECT 
    '🎯 USUÁRIO CORRIGIDO' as status,
    p.full_name,
    p.email,
    p.registration_type,
    p.entity_role,
    p.role,
    e.name as entity_name,
    CASE 
        WHEN p.entity_id IS NOT NULL AND p.entity_role = 'admin' THEN '✅ CORRIGIDO'
        ELSE '❌ PROBLEMA'
    END as resultado
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
WHERE p.id = 'b9b0a9e5-5c3a-4b0b-8391-18570f9064a7';

-- 3. Testar se trigger está funcionando para novos usuários
DO $$
BEGIN
    RAISE NOTICE '🧪 TESTE DO TRIGGER:';
    RAISE NOTICE '1. Usuário atual foi corrigido manualmente';
    RAISE NOTICE '2. Para testar o trigger, registre NOVO usuário';
    RAISE NOTICE '3. Deve ver logs: [TRIGGER RECRIADO] Processando';
    RAISE NOTICE '4. Se não ver logs, trigger não está executando';
END $$;

-- 4. Verificar se trigger está realmente ativo
SELECT 
    '🔍 VERIFICAÇÃO FINAL DO TRIGGER' as status,
    trigger_name,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'auth'
AND event_object_table = 'users'
AND trigger_name LIKE '%handle_new_user%';

-- 5. Instruções finais
DO $$
BEGIN
    RAISE NOTICE '📋 PRÓXIMOS PASSOS:';
    RAISE NOTICE '1. ✅ Usuário atual corrigido';
    RAISE NOTICE '2. 🧪 Teste com NOVO usuário (email diferente)';
    RAISE NOTICE '3. 📊 Verifique logs do PostgreSQL';
    RAISE NOTICE '4. 🎯 Se não funcionar, há problema no trigger';
END $$;