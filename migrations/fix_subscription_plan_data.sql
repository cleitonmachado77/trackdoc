-- =====================================================
-- CORREÇÃO: DADOS DO PLANO NA SUBSCRIPTION
-- =====================================================
-- Esta migração corrige a função RPC para retornar todos
-- os dados do plano corretamente, incluindo preços adicionais
-- =====================================================

-- Remover função antiga
DROP FUNCTION IF EXISTS get_user_active_subscription(UUID);

-- Criar função atualizada com todos os campos do plano
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
  plan_price_yearly NUMERIC,
  plan_features JSONB,
  max_usuarios INTEGER,
  armazenamento_gb INTEGER,
  max_documentos INTEGER,
  usuario_adicional_preco NUMERIC,
  armazenamento_extra_preco NUMERIC,
  plan_description TEXT,
  plan_interval VARCHAR
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
    p.price_yearly as plan_price_yearly,
    p.features as plan_features,
    p.max_users as max_usuarios,
    p.max_storage_gb as armazenamento_gb,
    p.max_documents as max_documentos,
    p.usuario_adicional_preco,
    p.armazenamento_extra_preco,
    p.description as plan_description,
    p.interval as plan_interval
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
  'Retorna a subscription ativa do usuário com TODOS os dados do plano. Atualizado para incluir preços adicionais.';

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

SELECT '=== FUNÇÃO ATUALIZADA ===' as info;

SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name = 'get_user_active_subscription'
  AND routine_schema = 'public';

-- =====================================================
-- TESTE (substitua pelo ID do usuário real)
-- =====================================================
-- SELECT * FROM get_user_active_subscription('seu-user-id-aqui');
