-- =====================================================
-- TRIGGER PARA CRIAR SUBSCRIPTION AUTOMATICAMENTE
-- =====================================================
-- Este trigger cria automaticamente uma subscription
-- quando um novo usuário é criado no sistema
-- =====================================================

-- Função que será executada pelo trigger
CREATE OR REPLACE FUNCTION auto_create_subscription()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_id UUID;
  v_plan_name TEXT;
  v_plan_price NUMERIC;
  v_plan_type TEXT;
  v_default_plan_type VARCHAR := 'basico'; -- Plano padrão para novos usuários
BEGIN
  -- Buscar TODOS os dados do plano padrão
  SELECT id, name, price_monthly, type
  INTO v_plan_id, v_plan_name, v_plan_price, v_plan_type
  FROM plans
  WHERE type = v_default_plan_type 
    AND interval = 'monthly'
    AND is_active = true
  LIMIT 1;

  -- Se encontrou o plano, criar a subscription
  IF v_plan_id IS NOT NULL THEN
    INSERT INTO subscriptions (
      user_id,
      plan_id,
      plan_name,
      plan_price,
      plan_type,
      status,
      start_date,
      current_users,
      current_storage_gb,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      v_plan_id,
      v_plan_name,
      v_plan_price,
      v_plan_type,
      'active',
      NOW(),
      1,  -- Começar com 1 usuário (o próprio)
      0,  -- Começar com 0 GB usado
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Subscription criada automaticamente para usuário % com plano % (R$ %)', NEW.id, v_plan_name, v_plan_price;
  ELSE
    RAISE WARNING 'Plano padrão % não encontrado. Subscription não foi criada.', v_default_plan_type;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar o trigger
DROP TRIGGER IF EXISTS trigger_auto_create_subscription ON profiles;

CREATE TRIGGER trigger_auto_create_subscription
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_subscription();

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON FUNCTION auto_create_subscription IS 
  'Cria automaticamente uma subscription com plano Básico quando um novo usuário é criado';

COMMENT ON TRIGGER trigger_auto_create_subscription ON profiles IS 
  'Trigger que executa auto_create_subscription após inserção de novo perfil';

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar se o trigger foi criado
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_create_subscription';

-- Verificar se a função foi criada
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name = 'auto_create_subscription'
  AND routine_schema = 'public';

-- =====================================================
-- TESTE (OPCIONAL)
-- =====================================================
-- Para testar, você pode criar um usuário de teste:
-- 
-- INSERT INTO profiles (id, full_name, email, role, status)
-- VALUES (
--   gen_random_uuid(),
--   'Usuário Teste',
--   'teste@example.com',
--   'user',
--   'active'
-- );
--
-- Depois verificar se a subscription foi criada:
-- SELECT * FROM subscriptions WHERE user_id = (
--   SELECT id FROM profiles WHERE email = 'teste@example.com'
-- );
-- =====================================================

-- =====================================================
-- CONFIGURAÇÃO DO PLANO PADRÃO
-- =====================================================
-- Se quiser mudar o plano padrão para novos usuários,
-- edite a variável v_default_plan_type na função acima:
-- 
-- 'basico' = Plano Básico (padrão)
-- 'profissional' = Plano Profissional
-- 'enterprise' = Plano Enterprise
-- =====================================================
