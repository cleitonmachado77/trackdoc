-- =====================================================
-- CORRIGIR FUNÇÃO RPC get_user_active_subscription
-- =====================================================
-- Esta função é usada pelo frontend para buscar a subscription
-- =====================================================

-- Remover função antiga
DROP FUNCTION IF EXISTS get_user_active_subscription(UUID);

-- Criar função atualizada
CREATE OR REPLACE FUNCTION get_user_active_subscription(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  entity_id UUID,
  plan_id UUID,
  status TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  trial_start_date TIMESTAMP WITH TIME ZONE,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  current_users INTEGER,
  current_storage_gb NUMERIC,
  plan_name TEXT,
  plan_type VARCHAR,
  plan_price NUMERIC,
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

-- Adicionar comentário
COMMENT ON FUNCTION get_user_active_subscription IS 
  'Retorna a subscription ativa do usuário com dados do plano. Usado pelo frontend.';

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

SELECT 
  '=== FUNÇÃO CRIADA ===' as info;

SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name = 'get_user_active_subscription'
  AND routine_schema = 'public';

-- =====================================================
-- TESTAR A FUNÇÃO
-- =====================================================

SELECT 
  '=== TESTE COM USUÁRIO PEDRO ===' as info;

SELECT * FROM get_user_active_subscription('f7f5b07d-ef74-4808-9855-9b7ecf03fa79');

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Deve retornar:
-- - id: UUID da subscription
-- - user_id: f7f5b07d-ef74-4808-9855-9b7ecf03fa79
-- - plan_name: Básico
-- - plan_type: basico
-- - plan_price: 149.00
-- - status: active
-- - current_users: 1
-- - current_storage_gb: 0
-- - max_usuarios: 15
-- - armazenamento_gb: 10
-- - plan_features: {...}
-- =====================================================
