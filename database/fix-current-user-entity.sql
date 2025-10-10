-- 🔧 SCRIPT: Corrigir usuário atual sem entidade
-- Este script cria uma entidade para o usuário que se registrou mas não teve a entidade criada

-- ⚠️ IMPORTANTE: Substitua os valores abaixo pelos dados corretos do usuário

BEGIN;

-- 1. Dados do usuário atual (SUBSTITUA PELOS DADOS CORRETOS)
-- ID do usuário que precisa da entidade
\set user_id '1f5b71f7-ad71-4d4d-9fd6-b8b2986ab285'

-- Dados da entidade a ser criada (SUBSTITUA PELOS DADOS CORRETOS)
\set entity_name 'Minha Empresa'
\set entity_legal_name 'Minha Empresa Ltda'
\set entity_cnpj '12345678000100'
\set entity_email 'contato@minhaempresa.com'
\set entity_phone '(11) 99999-9999'

-- 2. Buscar um plano padrão (geralmente o primeiro ativo)
DO $$
DECLARE
    v_user_id UUID := :'user_id';
    v_entity_name TEXT := :'entity_name';
    v_entity_legal_name TEXT := :'entity_legal_name';
    v_entity_cnpj TEXT := :'entity_cnpj';
    v_entity_email TEXT := :'entity_email';
    v_entity_phone TEXT := :'entity_phone';
    v_plan_id UUID;
    v_entity_id UUID;
    v_user_exists BOOLEAN;
BEGIN
    -- Verificar se o usuário existe
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = v_user_id) INTO v_user_exists;
    
    IF NOT v_user_exists THEN
        RAISE EXCEPTION 'Usuário com ID % não encontrado', v_user_id;
    END IF;

    -- Buscar um plano padrão
    SELECT id INTO v_plan_id 
    FROM plans 
    WHERE is_active = true 
    ORDER BY price_monthly ASC 
    LIMIT 1;

    IF v_plan_id IS NULL THEN
        RAISE EXCEPTION 'Nenhum plano ativo encontrado';
    END IF;

    RAISE NOTICE '📋 Criando entidade para usuário: %', v_user_id;
    RAISE NOTICE '📋 Plano selecionado: %', v_plan_id;

    -- 3. Criar a entidade
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

    -- 4. Atualizar o perfil do usuário
    UPDATE profiles SET
        entity_id = v_entity_id,
        entity_role = 'admin',
        role = 'admin',
        registration_type = 'entity_admin',
        registration_completed = true,
        updated_at = NOW()
    WHERE id = v_user_id;

    RAISE NOTICE '✅ Perfil do usuário atualizado';

    -- 5. Criar assinatura da entidade (opcional)
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
        true, -- trial
        NOW(),
        NOW() + INTERVAL '30 days',
        NOW(),
        NOW()
    );

    RAISE NOTICE '✅ Assinatura da entidade criada';

    -- 6. Verificar resultado final
    RAISE NOTICE '🔍 Verificando resultado...';
    
    PERFORM 1 FROM profiles p
    JOIN entities e ON p.entity_id = e.id
    WHERE p.id = v_user_id
    AND p.entity_role = 'admin'
    AND e.admin_user_id = v_user_id;

    IF FOUND THEN
        RAISE NOTICE '✅ SUCESSO: Usuário agora é admin da entidade!';
    ELSE
        RAISE EXCEPTION 'ERRO: Falha na verificação final';
    END IF;

END $$;

COMMIT;

-- 7. Verificação final
SELECT 
    p.id as user_id,
    p.full_name,
    p.email,
    p.role,
    p.entity_role,
    p.entity_id,
    e.name as entity_name,
    e.legal_name as entity_legal_name,
    e.admin_user_id
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
WHERE p.id = :'user_id';

-- Mostrar estatísticas
SELECT 
    'Resultado' as status,
    CASE 
        WHEN p.entity_id IS NOT NULL AND p.entity_role = 'admin' THEN '✅ CORRIGIDO'
        ELSE '❌ AINDA COM PROBLEMA'
    END as resultado
FROM profiles p
WHERE p.id = :'user_id';