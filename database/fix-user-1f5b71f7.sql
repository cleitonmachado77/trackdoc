-- 🔧 SCRIPT ESPECÍFICO: Corrigir usuário 1f5b71f7-ad71-4d4d-9fd6-b8b2986ab285
-- Este script cria uma entidade para o usuário específico que se registrou mas não teve a entidade criada

BEGIN;

DO $$
DECLARE
    v_user_id UUID := '1f5b71f7-ad71-4d4d-9fd6-b8b2986ab285';
    v_entity_name TEXT := 'Minha Empresa'; -- ALTERE AQUI
    v_entity_legal_name TEXT := 'Minha Empresa Ltda'; -- ALTERE AQUI
    v_entity_cnpj TEXT := '12345678000100'; -- ALTERE AQUI (apenas números)
    v_entity_email TEXT; -- Será pego do perfil do usuário
    v_entity_phone TEXT := '(11) 99999-9999'; -- ALTERE AQUI
    v_plan_id UUID;
    v_entity_id UUID;
    v_user_exists BOOLEAN;
    v_user_email TEXT;
BEGIN
    RAISE NOTICE '🔧 Iniciando correção para usuário: %', v_user_id;

    -- 1. Verificar se o usuário existe e pegar o email
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = v_user_id), email 
    INTO v_user_exists, v_user_email
    FROM profiles WHERE id = v_user_id;
    
    IF NOT v_user_exists THEN
        RAISE EXCEPTION 'Usuário com ID % não encontrado', v_user_id;
    END IF;

    v_entity_email := v_user_email; -- Usar o email do usuário

    RAISE NOTICE '✅ Usuário encontrado: %', v_user_email;

    -- 2. Verificar se já tem entidade
    IF EXISTS(SELECT 1 FROM profiles WHERE id = v_user_id AND entity_id IS NOT NULL) THEN
        RAISE NOTICE '⚠️ Usuário já possui entidade associada';
        RETURN;
    END IF;

    -- 3. Buscar um plano padrão (o mais barato ativo)
    SELECT id INTO v_plan_id 
    FROM plans 
    WHERE is_active = true 
    ORDER BY price_monthly ASC 
    LIMIT 1;

    IF v_plan_id IS NULL THEN
        RAISE EXCEPTION 'Nenhum plano ativo encontrado';
    END IF;

    RAISE NOTICE '📋 Plano selecionado: %', v_plan_id;

    -- 4. Criar a entidade
    INSERT INTO entities (
        name,
        legal_name,
        cnpj,
        email,
        phone,
        subscription_plan_id,
        max_users,
        admin_user_id,
        status,
        type,
        created_at,
        updated_at
    ) VALUES (
        v_entity_name,
        v_entity_legal_name,
        v_entity_cnpj,
        v_entity_email,
        v_entity_phone,
        v_plan_id,
        10, -- max_users padrão
        v_user_id,
        'active',
        'company',
        NOW(),
        NOW()
    ) RETURNING id INTO v_entity_id;

    RAISE NOTICE '✅ Entidade criada com ID: %', v_entity_id;

    -- 5. Atualizar o perfil do usuário
    UPDATE profiles SET
        entity_id = v_entity_id,
        entity_role = 'admin',
        role = 'admin',
        updated_at = NOW()
    WHERE id = v_user_id;

    RAISE NOTICE '✅ Perfil do usuário atualizado';

    -- 6. Criar assinatura da entidade (trial de 30 dias)
    INSERT INTO entity_subscriptions (
        entity_id,
        plan_id,
        status,
        is_trial,
        current_period_start,
        current_period_end,
        created_at,
        updated_at
    ) VALUES (
        v_entity_id,
        v_plan_id,
        'active',
        true,
        NOW(),
        NOW() + INTERVAL '30 days',
        NOW(),
        NOW()
    );

    RAISE NOTICE '✅ Assinatura da entidade criada (trial 30 dias)';

    -- 7. Verificação final
    IF EXISTS(
        SELECT 1 FROM profiles p
        JOIN entities e ON p.entity_id = e.id
        WHERE p.id = v_user_id
        AND p.entity_role = 'admin'
        AND e.admin_user_id = v_user_id
    ) THEN
        RAISE NOTICE '🎉 SUCESSO TOTAL: Usuário agora é admin da entidade!';
    ELSE
        RAISE EXCEPTION 'ERRO: Falha na verificação final';
    END IF;

END $$;

COMMIT;

-- 8. Mostrar resultado final
SELECT 
    '🎯 RESULTADO FINAL' as status,
    p.id as user_id,
    p.full_name as usuario,
    p.email,
    p.role,
    p.entity_role,
    e.id as entity_id,
    e.name as entity_name,
    e.legal_name,
    e.cnpj,
    CASE 
        WHEN p.entity_id IS NOT NULL AND p.entity_role = 'admin' THEN '✅ CORRIGIDO COM SUCESSO'
        ELSE '❌ AINDA COM PROBLEMA'
    END as resultado
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
WHERE p.id = '1f5b71f7-ad71-4d4d-9fd6-b8b2986ab285';

-- 9. Verificar assinatura
SELECT 
    '📊 ASSINATURA' as status,
    es.id,
    es.status,
    es.is_trial,
    es.current_period_start,
    es.current_period_end,
    p.name as plan_name
FROM entity_subscriptions es
JOIN entities e ON es.entity_id = e.id
JOIN plans p ON es.plan_id = p.id
WHERE e.admin_user_id = '1f5b71f7-ad71-4d4d-9fd6-b8b2986ab285';