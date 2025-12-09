-- =====================================================
-- CORREÇÃO DA FUNÇÃO RPC get_user_active_subscription
-- =====================================================
-- Atualiza a função para usar os nomes corretos dos campos:
-- - max_users (não max_usuarios)
-- - max_storage_gb (não armazenamento_gb)
-- - price_monthly (não price)
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_active_subscription(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  entity_id UUID,
  plan_id UUID,
  status VARCHAR,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  trial_start_date TIMESTAMP WITH TIME ZONE,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  current_users INTEGER,
  current_storage_gb DECIMAL,
  plan_name VARCHAR,
  plan_type VARCHAR,
  plan_price DECIMAL,
  plan_features JSONB,
  max_usuarios INTEGER,
  armazenamento_gb INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    s.entity_id,
    s.plan_id,
    s.status,
    s.start_date,
    s.end_date,
    s.trial_start_date,
    s.trial_end_date,
    s.current_users,
    s.current_storage_gb,
    p.name as plan_name,
    p.type as plan_type,
    p.price_monthly as plan_price,
    p.features as plan_features,
    p.max_users as max_usuarios,
    p.max_storage_gb as armazenamento_gb
  FROM subscriptions s
  INNER JOIN plans p ON s.plan_id = p.id
  WHERE s.user_id = p_user_id
    AND s.status IN ('active', 'trial')
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name = 'get_user_active_subscription'
  AND routine_schema = 'public';

-- Resultado esperado:
-- routine_name: get_user_active_subscription
-- routine_type: FUNCTION
-- =====================================================
