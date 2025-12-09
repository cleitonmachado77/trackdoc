-- =====================================================
-- CRIAR SUBSCRIPTION PARA O PEDRO - VERSÃO ULTRA SIMPLES
-- =====================================================
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

DO $$
DECLARE
  v_plan_id UUID;
  v_plan_name TEXT;
  v_plan_price NUMERIC;
  v_plan_type TEXT;
  v_user_id UUID := 'f7f5b07d-ef74-4808-9855-9b7ecf03fa79';
BEGIN
  -- Buscar TODOS os dados do plano Básico
  SELECT id, name, price_monthly, type 
  INTO v_plan_id, v_plan_name, v_plan_price, v_plan_type
  FROM plans
  WHERE type = 'basico' 
    AND interval = 'monthly' 
    AND is_active = true
  LIMIT 1;

  -- Verificar se encontrou o plano
  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION 'Plano Básico não encontrado! Execute primeiro: migrations/update_plans_config.sql';
  END IF;

  -- Verificar se já existe subscription
  IF EXISTS (SELECT 1 FROM subscriptions WHERE user_id = v_user_id) THEN
    RAISE NOTICE 'Usuário já possui subscription. Nada a fazer.';
    RETURN;
  END IF;

  -- Criar subscription com TODOS os campos obrigatórios
  INSERT INTO subscriptions (
    user_id, 
    plan_id, 
    plan_name,
    plan_price,
    plan_type,
    status, 
    start_date, 
    current_users, 
    current_storage_gb
  ) VALUES (
    v_user_id, 
    v_plan_id, 
    v_plan_name,
    v_plan_price,
    v_plan_type,
    'active', 
    NOW(), 
    1, 
    0
  );

  RAISE NOTICE '✅ Subscription criada com sucesso!';
  RAISE NOTICE 'Usuário: %', v_user_id;
  RAISE NOTICE 'Plano: % (R$ %)', v_plan_name, v_plan_price;
END $$;

-- Verificar o resultado
SELECT 
  'Subscription criada!' as status,
  s.id as subscription_id,
  s.status as subscription_status,
  s.current_users,
  s.current_storage_gb,
  p.name as plan_name,
  p.type as plan_type,
  p.price_monthly as price
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.user_id = 'f7f5b07d-ef74-4808-9855-9b7ecf03fa79';

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- Deve mostrar uma linha com:
-- - status: Subscription criada!
-- - subscription_status: active
-- - current_users: 1
-- - current_storage_gb: 0
-- - plan_name: Básico
-- - plan_type: basico
-- - price: 149.00
-- =====================================================
