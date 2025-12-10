-- =====================================================
-- CORREÇÃO DOS TIPOS DA FUNÇÃO check_user_plan_limits
-- =====================================================
-- Esta correção resolve o erro de tipos incompatíveis
-- =====================================================

-- Remover função existente se houver
DROP FUNCTION IF EXISTS check_user_plan_limits(UUID);

-- Recriar função com tipos corretos
CREATE OR REPLACE FUNCTION check_user_plan_limits(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  plan_name VARCHAR(255),
  plan_type VARCHAR(50),
  -- Limites do plano
  max_users INTEGER,
  max_storage_gb NUMERIC,
  max_documents INTEGER,
  -- Uso atual
  current_users INTEGER,
  current_storage_gb NUMERIC,
  current_documents INTEGER,
  -- Status dos limites
  users_limit_reached BOOLEAN,
  storage_limit_reached BOOLEAN,
  documents_limit_reached BOOLEAN,
  -- Percentuais de uso
  users_usage_percent INTEGER,
  storage_usage_percent INTEGER,
  documents_usage_percent INTEGER
) AS $$
DECLARE
  v_subscription_id UUID;
  v_plan_id UUID;
  v_entity_id UUID;
BEGIN
  -- Buscar subscription do usuário
  SELECT s.id, s.plan_id, p.entity_id
  INTO v_subscription_id, v_plan_id, v_entity_id
  FROM subscriptions s
  INNER JOIN profiles p ON p.id = s.user_id
  WHERE s.user_id = p_user_id
    AND s.status = 'active'
  LIMIT 1;
  
  -- Se não encontrou subscription individual, buscar por entidade
  IF v_subscription_id IS NULL AND v_entity_id IS NOT NULL THEN
    SELECT s.id, s.plan_id
    INTO v_subscription_id, v_plan_id
    FROM subscriptions s
    WHERE s.entity_id = v_entity_id
      AND s.status = 'active'
    LIMIT 1;
  END IF;
  
  -- Se ainda não encontrou, retornar valores padrão
  IF v_subscription_id IS NULL THEN
    RETURN QUERY
    SELECT 
      p_user_id,
      'Sem plano'::VARCHAR(255),
      'none'::VARCHAR(50),
      0, 0.0::NUMERIC, 0,
      0, 0.0::NUMERIC, 0,
      false, false, false,
      0, 0, 0;
    RETURN;
  END IF;
  
  -- Retornar dados completos
  RETURN QUERY
  WITH plan_data AS (
    SELECT 
      pl.name::VARCHAR(255) as plan_name,
      pl.type::VARCHAR(50) as plan_type,
      pl.max_users,
      pl.max_storage_gb,
      pl.max_documents
    FROM plans pl
    WHERE pl.id = v_plan_id
  ),
  usage_data AS (
    SELECT 
      s.current_users,
      s.current_storage_gb,
      COALESCE(doc_count.documents_count, 0) as current_documents
    FROM subscriptions s
    LEFT JOIN (
      SELECT 
        created_by,
        COUNT(*) as documents_count
      FROM documents 
      WHERE created_by = p_user_id 
        AND status != 'deleted'
      GROUP BY created_by
    ) doc_count ON doc_count.created_by = p_user_id
    WHERE s.id = v_subscription_id
  )
  SELECT 
    p_user_id,
    pd.plan_name,
    pd.plan_type,
    pd.max_users,
    pd.max_storage_gb,
    pd.max_documents,
    ud.current_users,
    ud.current_storage_gb,
    ud.current_documents,
    -- Status dos limites
    (ud.current_users >= pd.max_users) as users_limit_reached,
    (ud.current_storage_gb >= pd.max_storage_gb) as storage_limit_reached,
    (ud.current_documents >= pd.max_documents) as documents_limit_reached,
    -- Percentuais
    CASE 
      WHEN pd.max_users > 0 THEN LEAST(100, (ud.current_users * 100 / pd.max_users))
      ELSE 0 
    END as users_usage_percent,
    CASE 
      WHEN pd.max_storage_gb > 0 THEN LEAST(100, (ud.current_storage_gb * 100 / pd.max_storage_gb)::INTEGER)
      ELSE 0 
    END as storage_usage_percent,
    CASE 
      WHEN pd.max_documents > 0 THEN LEAST(100, (ud.current_documents * 100 / pd.max_documents))
      ELSE 0 
    END as documents_usage_percent
  FROM plan_data pd, usage_data ud;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION check_user_plan_limits(UUID) TO authenticated;

-- Comentário
COMMENT ON FUNCTION check_user_plan_limits IS 'Verifica limites do plano e status de uso atual com tipos corretos';

-- Verificar se a função foi criada
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'check_user_plan_limits';