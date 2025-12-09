-- =====================================================
-- CRIAR SUBSCRIPTION DE FORMA SEGURA
-- =====================================================
-- Este script detecta automaticamente os campos da tabela
-- e cria a subscription corretamente
-- =====================================================

-- PASSO 1: Ver estrutura da tabela
-- (Descomente para ver a estrutura)
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'subscriptions' AND table_schema = 'public'
-- ORDER BY ordinal_position;

-- PASSO 2: Ver planos disponíveis
-- (Descomente para ver os planos)
-- SELECT id, name, type, interval FROM plans WHERE is_active = true;

-- PASSO 3: Criar subscription
-- IMPORTANTE: Se a tabela tiver campo 'plan_name', precisamos preenchê-lo

DO $$
DECLARE
  v_plan_id UUID;
  v_plan_name TEXT;
  v_user_id UUID := 'f7f5b07d-ef74-4808-9855-9b7ecf03fa79';
  v_has_plan_name_column BOOLEAN;
BEGIN
  -- Verificar se a coluna plan_name existe
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'subscriptions' 
      AND column_name = 'plan_name'
  ) INTO v_has_plan_name_column;

  -- Buscar plano Básico
  SELECT id, name INTO v_plan_id, v_plan_name
  FROM plans
  WHERE type = 'basico' AND interval = 'monthly' AND is_active = true
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION 'Plano Básico não encontrado!';
  END IF;

  -- Verificar se já existe subscription
  IF EXISTS (SELECT 1 FROM subscriptions WHERE user_id = v_user_id) THEN
    RAISE NOTICE 'Usuário já possui subscription';
    RETURN;
  END IF;

  -- Criar subscription com ou sem plan_name
  IF v_has_plan_name_column THEN
    -- Tabela TEM campo plan_name
    EXECUTE format(
      'INSERT INTO subscriptions (user_id, plan_id, plan_name, status, start_date, current_users, current_storage_gb) 
       VALUES ($1, $2, $3, $4, NOW(), 1, 0)'
    ) USING v_user_id, v_plan_id, v_plan_name, 'active';
    
    RAISE NOTICE 'Subscription criada COM plan_name: %', v_plan_name;
  ELSE
    -- Tabela NÃO TEM campo plan_name
    INSERT INTO subscriptions (user_id, plan_id, status, start_date, current_users, current_storage_gb)
    VALUES (v_user_id, v_plan_id, 'active', NOW(), 1, 0);
    
    RAISE NOTICE 'Subscription criada SEM plan_name';
  END IF;

  RAISE NOTICE 'Subscription criada com sucesso para usuário %', v_user_id;
END $$;

-- PASSO 4: Verificar resultado
SELECT 
  s.id,
  s.user_id,
  s.plan_id,
  s.status,
  s.current_users,
  s.current_storage_gb,
  p.name as plan_name_from_join,
  p.type as plan_type
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.user_id = 'f7f5b07d-ef74-4808-9855-9b7ecf03fa79';

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- Deve mostrar:
-- - status: active
-- - current_users: 1
-- - current_storage_gb: 0
-- - plan_name_from_join: Básico
-- - plan_type: basico
-- =====================================================
