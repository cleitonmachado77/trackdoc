-- =====================================================
-- CRIAR SUBSCRIPTION PARA O PEDRO - VERSÃO 2
-- =====================================================
-- Baseado na estrutura REAL da tabela subscriptions
-- =====================================================

DO $$
DECLARE
  v_plan_id UUID;
  v_plan_name TEXT;
  v_plan_description TEXT;
  v_plan_price NUMERIC;
  v_plan_type VARCHAR;
  v_user_id UUID := 'f7f5b07d-ef74-4808-9855-9b7ecf03fa79';
  v_subscription_exists BOOLEAN;
BEGIN
  -- Verificar se já existe subscription
  SELECT EXISTS (
    SELECT 1 FROM subscriptions WHERE user_id = v_user_id
  ) INTO v_subscription_exists;

  IF v_subscription_exists THEN
    RAISE NOTICE '⚠️  Usuário já possui subscription. Nada a fazer.';
    RETURN;
  END IF;

  -- Buscar TODOS os dados do plano Básico
  SELECT 
    id, 
    name, 
    description,
    price_monthly, 
    type
  INTO 
    v_plan_id, 
    v_plan_name, 
    v_plan_description,
    v_plan_price, 
    v_plan_type
  FROM plans
  WHERE type = 'basico' 
    AND interval = 'monthly' 
    AND is_active = true
  LIMIT 1;

  -- Verificar se encontrou o plano
  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION '❌ Plano Básico não encontrado! Execute primeiro: migrations/update_plans_config.sql';
  END IF;

  RAISE NOTICE '📋 Plano encontrado: % (ID: %)', v_plan_name, v_plan_id;
  RAISE NOTICE '💰 Preço: R$ %', v_plan_price;

  -- Criar subscription com TODOS os campos da estrutura real
  INSERT INTO subscriptions (
    -- Campos obrigatórios
    user_id,
    plan_id,
    plan_name,
    plan_description,
    plan_price,
    status,
    
    -- Campos de controle de uso
    current_users,
    current_storage_gb,
    
    -- Campos de data
    start_date,
    created_at,
    updated_at,
    
    -- Campos opcionais com valores padrão
    auto_renew,
    is_trial
  ) VALUES (
    -- Campos obrigatórios
    v_user_id,
    v_plan_id,
    v_plan_name,
    v_plan_description,
    v_plan_price,
    'active',
    
    -- Campos de controle de uso
    1,  -- current_users: começar com 1 (o próprio Pedro)
    0,  -- current_storage_gb: começar com 0 GB
    
    -- Campos de data
    NOW(),  -- start_date
    NOW(),  -- created_at
    NOW(),  -- updated_at
    
    -- Campos opcionais
    true,   -- auto_renew
    false   -- is_trial
  );

  RAISE NOTICE '✅ Subscription criada com sucesso!';
  RAISE NOTICE '👤 Usuário: %', v_user_id;
  RAISE NOTICE '📦 Plano: % (R$ %)', v_plan_name, v_plan_price;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '❌ Erro ao criar subscription: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END $$;

-- =====================================================
-- VERIFICAR O RESULTADO
-- =====================================================

SELECT 
  '✅ SUBSCRIPTION CRIADA COM SUCESSO!' as status,
  s.id as subscription_id,
  s.user_id,
  s.plan_id,
  s.plan_name,
  s.plan_description,
  s.plan_price,
  s.status as subscription_status,
  s.current_users,
  s.current_storage_gb,
  s.start_date,
  s.is_trial,
  s.auto_renew,
  p.name as plan_name_from_table,
  p.type as plan_type,
  p.max_users,
  p.max_storage_gb
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.user_id = 'f7f5b07d-ef74-4808-9855-9b7ecf03fa79';

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Deve mostrar uma linha com:
-- - status: ✅ SUBSCRIPTION CRIADA COM SUCESSO!
-- - subscription_status: active
-- - current_users: 1
-- - current_storage_gb: 0
-- - plan_name: Básico
-- - plan_type: basico
-- - plan_price: 149.00
-- - max_users: 15
-- - max_storage_gb: 10
-- - is_trial: false
-- - auto_renew: true
-- =====================================================
