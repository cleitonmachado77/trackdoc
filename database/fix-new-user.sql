-- 🔧 SCRIPT: Corrigir usuário atual sem entidade
-- Usuário: a3fef62a-3b6d-4926-8754-2f6f202a967e (Cleiton Machado)

BEGIN;

DO $$
DECLARE
    v_user_id UUID := 'a3fef62a-3b6d-4926-8754-2f6f202a967e';
    v_entity_name TEXT := 'Empresa do Cleiton'; -- ALTERE AQUI
    v_entity_legal_name TEXT := 'Cleiton Machado ME'; -- ALTERE AQUI
    v_entity_cnpj TEXT := '12345678000199'; -- ALTERE AQUI (apenas números)
    v_entity_phone TEXT := '(11) 99999-9999'; -- ALTERE AQUI
    v_plan_id UUID;
    v_entity_id UUID;
    v_user_email TEXT;
BEGIN
    RAISE NOTICE '🔧 Corrigindo usuário: % (Cleiton Machado)', v_user_id;

    -- 1. Pegar dados do usuário
    SELECT email INTO v_user_email
    FROM profiles WHERE id = v_user_id;
    
    IF v_user_email IS NULL THEN
        RAISE EXCEPTION 'Usuário não encontrado';
    END IF;

    RAISE NOTICE '✅ Usuário encontrado: %', v_user_email;

    -- 2. Verificar se já tem entidade
    IF EXISTS(SELECT 1 FROM profiles WHERE id = v_user_id AND entity_id IS NOT NULL) THEN
        RAISE NOTICE '⚠️ Usuário já possui entidade';
        RETURN;
    END IF;

    -- 3. Buscar plano padrão
    SELECT id INTO v_plan_id 
    FROM plans 
    WHERE is_active = true 
    ORDER BY price_monthly ASC 
    LIMIT 1;

    IF v_plan_id IS NULL THEN
        RAISE EXCEPTION 'Nenhum plano encontrado';
    END IF;

    -- 4. Criar entidade
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
        type
    ) VALUES (
        v_entity_name,
        v_entity_legal_name,
        v_entity_cnpj,
        v_user_email,
        v_entity_phone,
        v_plan_id,
        10,
        v_user_id,
        'active',
        'company'
    ) RETURNING id INTO v_entity_id;

    RAISE NOTICE '✅ Entidade criada: %', v_entity_id;

    -- 5. Atualizar perfil
    UPDATE profiles SET
        entity_id = v_entity_id,
        entity_role = 'admin',
        role = 'admin',
        registration_completed = true,
        updated_at = NOW()
    WHERE id = v_user_id;

    RAISE NOTICE '✅ Perfil atualizado';

    -- 6. Criar assinatura
    INSERT INTO entity_subscriptions (
        entity_id,
        plan_id,
        status,
        is_trial,
        current_period_start,
        current_period_end
    ) VALUES (
        v_entity_id,
        v_plan_id,
        'active',
        true,
        NOW(),
        NOW() + INTERVAL '30 days'
    );

    RAISE NOTICE '✅ Assinatura criada (30 dias trial)';
    RAISE NOTICE '🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!';

END $$;

COMMIT;

-- Verificar resultado
SELECT 
    '🎯 RESULTADO' as status,
    p.full_name,
    p.email,
    p.role,
    p.entity_role,
    p.registration_completed,
    e.name as entity_name,
    e.legal_name,
    CASE 
        WHEN p.entity_id IS NOT NULL AND p.entity_role = 'admin' THEN '✅ CORRIGIDO'
        ELSE '❌ PROBLEMA'
    END as resultado
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
WHERE p.id = 'a3fef62a-3b6d-4926-8754-2f6f202a967e';