-- =====================================================
-- TRIGGER PARA CRIAR SUBSCRIPTION AUTOMATICAMENTE - V2
-- =====================================================
-- Baseado na estrutura REAL da tabela subscriptions
-- =====================================================

-- Remover trigger e função existentes (se houver)
DROP TRIGGER IF EXISTS trigger_auto_create_subscription ON profiles;
DROP FUNCTION IF EXISTS auto_create_subscription();

-- Criar função que será executada pelo trigger
CREATE OR REPLACE FUNCTION auto_create_subscription()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_id UUID;
  v_plan_name TEXT;
  v_plan_description TEXT;
  v_plan_price NUMERIC;
  v_plan_type VARCHAR;
  v_default_plan_type VARCHAR := 'basico'; -- Plano padrão para novos usuários
BEGIN
  -- Buscar TODOS os dados do plano padrão
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
  WHERE type = v_default_plan_type 
    AND interval = 'monthly'
    AND is_active = true
  LIMIT 1;

  -- Se encontrou o plano, criar a subscription
  IF v_plan_id IS NOT NULL THEN
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
      NEW.id,
      v_plan_id,
      v_plan_name,
      v_plan_description,
      v_plan_price,
      'active',
      
      -- Campos de controle de uso
      1,  -- current_users: começar com 1 (o próprio usuário)
      0,  -- current_storage_gb: começar com 0 GB
      
      -- Campos de data
      NOW(),  -- start_date
      NOW(),  -- created_at
      NOW(),  -- updated_at
      
      -- Campos opcionais
      true,   -- auto_renew
      false   -- is_trial
    );
    
    RAISE NOTICE '✅ Subscription criada automaticamente para usuário % (%)', NEW.full_name, NEW.email;
    RAISE NOTICE '📦 Plano: % (R$ %)', v_plan_name, v_plan_price;
  ELSE
    RAISE WARNING '⚠️  Plano padrão "%" não encontrado. Subscription não foi criada para usuário %.', v_default_plan_type, NEW.email;
  END IF;

  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Não falhar a criação do usuário se houver erro na subscription
    RAISE WARNING '❌ Erro ao criar subscription para %: % (SQLSTATE: %)', NEW.email, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar o trigger
CREATE TRIGGER trigger_auto_create_subscription
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_subscription();

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON FUNCTION auto_create_subscription IS 
  'Cria automaticamente uma subscription com plano Básico quando um novo usuário é criado. Baseado na estrutura real da tabela subscriptions.';

COMMENT ON TRIGGER trigger_auto_create_subscription ON profiles IS 
  'Trigger que executa auto_create_subscription após inserção de novo perfil';

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

SELECT 
  '=== TRIGGER CRIADO ===' as info;

SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_create_subscription';

SELECT 
  '=== FUNÇÃO CRIADA ===' as info;

SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name = 'auto_create_subscription'
  AND routine_schema = 'public';

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Deve mostrar:
-- 1. Trigger: trigger_auto_create_subscription
--    - event_manipulation: INSERT
--    - event_object_table: profiles
--    - action_timing: AFTER
--
-- 2. Função: auto_create_subscription
--    - routine_type: FUNCTION
--    - data_type: trigger
-- =====================================================
