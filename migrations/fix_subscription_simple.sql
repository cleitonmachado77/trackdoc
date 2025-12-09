-- =====================================================
-- CRIAR SUBSCRIPTION SIMPLES PARA USUÁRIO
-- =====================================================
-- Versão simplificada que funciona com qualquer estrutura
-- =====================================================

-- 1. Primeiro, vamos ver a estrutura real da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- 2. Ver os planos disponíveis
SELECT id, name, type, interval FROM plans WHERE is_active = true;

-- 3. Criar subscription para o Pedro
-- AJUSTE: Vamos usar apenas os campos essenciais

DO $$
DECLARE
  v_plan_id UUID;
  v_user_id UUID := 'f7f5b07d-ef74-4808-9855-9b7ecf03fa79';
BEGIN
  -- Buscar ID do plano Básico
  SELECT id INTO v_plan_id
  FROM plans
  WHERE type = 'basico' AND interval = 'monthly'
  LIMIT 1;

  -- Verificar se já existe subscription
  IF EXISTS (SELECT 1 FROM subscriptions WHERE user_id = v_user_id) THEN
    RAISE NOTICE 'Usuário já possui subscription';
  ELSE
    -- Criar subscription com TODOS os campos necessários
    INSERT INTO subscriptions (
      user_id,
      plan_id,
      status,
      start_date,
      current_users,
      current_storage_gb
    ) VALUES (
      v_user_id,
      v_plan_id,
      'active',
      NOW(),
      1,
      0
    );
    
    RAISE NOTICE 'Subscription criada com sucesso!';
  END IF;
END $$;

-- 4. Verificar se foi criada
SELECT 
  s.id,
  s.user_id,
  s.plan_id,
  s.status,
  s.current_users,
  s.current_storage_gb,
  p.name as plan_name,
  p.type as plan_type
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.user_id = 'f7f5b07d-ef74-4808-9855-9b7ecf03fa79';
