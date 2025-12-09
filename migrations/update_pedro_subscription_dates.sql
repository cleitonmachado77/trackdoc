-- =====================================================
-- ATUALIZAR DATAS DA SUBSCRIPTION DO PEDRO
-- =====================================================
-- Atualizar manualmente para testar
-- =====================================================

-- Ver estado atual
SELECT 
  id,
  user_id,
  plan_name,
  status,
  start_date,
  end_date,
  next_billing_date,
  created_at,
  updated_at
FROM subscriptions
WHERE user_id = 'f7f5b07d-ef74-4808-9855-9b7ecf03fa79';

-- Atualizar com nova data de vencimento (30 dias a partir de hoje)
UPDATE subscriptions
SET 
  next_billing_date = (CURRENT_DATE + INTERVAL '30 days')::timestamp with time zone,
  end_date = (CURRENT_DATE + INTERVAL '30 days')::timestamp with time zone,
  status = 'active',
  updated_at = NOW()
WHERE user_id = 'f7f5b07d-ef74-4808-9855-9b7ecf03fa79';

-- Ver resultado
SELECT 
  id,
  user_id,
  plan_name,
  status,
  start_date,
  end_date,
  next_billing_date,
  EXTRACT(DAY FROM (next_billing_date - CURRENT_TIMESTAMP)) as dias_restantes,
  created_at,
  updated_at
FROM subscriptions
WHERE user_id = 'f7f5b07d-ef74-4808-9855-9b7ecf03fa79';

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Deve mostrar:
-- - next_billing_date: data atual + 30 dias
-- - end_date: data atual + 30 dias
-- - status: active
-- - dias_restantes: ~30
-- =====================================================
