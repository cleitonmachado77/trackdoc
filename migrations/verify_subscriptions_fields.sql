-- =====================================================
-- VERIFICAR CAMPOS DA TABELA SUBSCRIPTIONS
-- =====================================================

-- Ver estrutura completa da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'subscriptions'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Ver dados da subscription do Pedro
SELECT 
  id,
  user_id,
  plan_name,
  status,
  start_date,
  end_date,
  next_billing_date,
  current_period_start,
  current_period_end,
  created_at,
  updated_at
FROM subscriptions
WHERE user_id = 'f7f5b07d-ef74-4808-9855-9b7ecf03fa79';

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Deve mostrar se os campos next_billing_date e end_date existem
-- e seus valores atuais
-- =====================================================
