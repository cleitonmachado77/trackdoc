-- =====================================================
-- CORREÇÃO PARA MOSTRAR DADOS DE USUÁRIOS E ENTIDADES
-- =====================================================
-- Esta migração cria funções para calcular armazenamento
-- tanto para usuários individuais quanto para entidades
-- =====================================================

-- 1. Função para calcular uso por usuário individual
CREATE OR REPLACE FUNCTION get_user_storage_data(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  documents_count INTEGER,
  storage_gb NUMERIC,
  plan_name TEXT,
  max_storage_gb NUMERIC,
  max_documents INTEGER,
  storage_percent INTEGER,
  documents_percent INTEGER
) AS $$
DECLARE
  v_docs_count INTEGER := 0;
  v_storage_gb NUMERIC := 0.0;
  v_plan_name TEXT := 'Sem plano';
  v_max_storage NUMERIC := 0.0;
  v_max_docs INTEGER := 0;
BEGIN
  -- Calcular documentos e armazenamento do usuário
  SELECT 
    COALESCE(COUNT(*), 0),
    COALESCE(SUM(file_size) / (1024.0 * 1024.0 * 1024.0), 0.0)
  INTO v_docs_count, v_storage_gb
  FROM documents d
  WHERE d.created_by = p_user_id
    AND d.status != 'deleted';
  
  -- Buscar informações do plano
  SELECT 
    COALESCE(pl.name, 'Sem plano'),
    COALESCE(pl.max_storage_gb, 0.0),
    COALESCE(pl.max_documents, 0)
  INTO v_plan_name, v_max_storage, v_max_docs
  FROM subscriptions s
  INNER JOIN plans pl ON pl.id = s.plan_id
  WHERE s.user_id = p_user_id
    AND s.status = 'active'
  LIMIT 1;
  
  RETURN QUERY
  SELECT 
    p_user_id,
    v_docs_count,
    v_storage_gb,
    v_plan_name,
    v_max_storage,
    v_max_docs,
    CASE 
      WHEN v_max_storage > 0 THEN LEAST(100, (v_storage_gb * 100 / v_max_storage)::INTEGER)
      ELSE 0 
    END as storage_percent,
    CASE 
      WHEN v_max_docs > 0 THEN LEAST(100, (v_docs_count * 100 / v_max_docs))
      ELSE 0 
    END as documents_percent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Função para calcular uso por entidade
CREATE OR REPLACE FUNCTION get_entity_storage_data(p_entity_id UUID)
RETURNS TABLE (
  entity_id UUID,
  documents_count INTEGER,
  storage_gb NUMERIC,
  users_count INTEGER,
  plan_name TEXT,
  max_storage_gb NUMERIC,
  max_documents INTEGER,
  max_users INTEGER,
  storage_percent INTEGER,
  documents_percent INTEGER,
  users_percent INTEGER
) AS $$
DECLARE
  v_docs_count INTEGER := 0;
  v_storage_gb NUMERIC := 0.0;
  v_users_count INTEGER := 0;
  v_plan_name TEXT := 'Sem plano';
  v_max_storage NUMERIC := 0.0;
  v_max_docs INTEGER := 0;
  v_max_users INTEGER := 0;
BEGIN
  -- Calcular documentos e armazenamento da entidade
  SELECT 
    COALESCE(COUNT(*), 0),
    COALESCE(SUM(file_size) / (1024.0 * 1024.0 * 1024.0), 0.0)
  INTO v_docs_count, v_storage_gb
  FROM documents d
  WHERE d.entity_id = p_entity_id
    AND d.status != 'deleted';
  
  -- Contar usuários da entidade
  SELECT COUNT(*)
  INTO v_users_count
  FROM profiles p
  WHERE p.entity_id = p_entity_id
    AND p.status IN ('active', 'pending_confirmation');
  
  -- Buscar informações do plano (via admin da entidade)
  SELECT 
    COALESCE(pl.name, 'Sem plano'),
    COALESCE(pl.max_storage_gb, 0.0),
    COALESCE(pl.max_documents, 0),
    COALESCE(pl.max_users, 0)
  INTO v_plan_name, v_max_storage, v_max_docs, v_max_users
  FROM profiles admin
  INNER JOIN subscriptions s ON s.user_id = admin.id
  INNER JOIN plans pl ON pl.id = s.plan_id
  WHERE admin.entity_id = p_entity_id
    AND admin.entity_role = 'admin'
    AND s.status = 'active'
  LIMIT 1;
  
  -- Se não encontrou via admin, buscar via entity_subscriptions
  IF v_plan_name = 'Sem plano' THEN
    SELECT 
      COALESCE(pl.name, 'Sem plano'),
      COALESCE(pl.max_storage_gb, 0.0),
      COALESCE(pl.max_documents, 0),
      COALESCE(pl.max_users, 0)
    INTO v_plan_name, v_max_storage, v_max_docs, v_max_users
    FROM entity_subscriptions es
    INNER JOIN plans pl ON pl.id = es.plan_id
    WHERE es.entity_id = p_entity_id
      AND es.status = 'active'
    LIMIT 1;
  END IF;
  
  RETURN QUERY
  SELECT 
    p_entity_id,
    v_docs_count,
    v_storage_gb,
    v_users_count,
    v_plan_name,
    v_max_storage,
    v_max_docs,
    v_max_users,
    CASE 
      WHEN v_max_storage > 0 THEN LEAST(100, (v_storage_gb * 100 / v_max_storage)::INTEGER)
      ELSE 0 
    END as storage_percent,
    CASE 
      WHEN v_max_docs > 0 THEN LEAST(100, (v_docs_count * 100 / v_max_docs))
      ELSE 0 
    END as documents_percent,
    CASE 
      WHEN v_max_users > 0 THEN LEAST(100, (v_users_count * 100 / v_max_users))
      ELSE 0 
    END as users_percent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Função para obter resumo geral de armazenamento
CREATE OR REPLACE FUNCTION get_storage_summary()
RETURNS TABLE (
  total_documents INTEGER,
  total_storage_gb NUMERIC,
  total_users INTEGER,
  total_entities INTEGER,
  users_with_data INTEGER,
  entities_with_data INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM documents WHERE status != 'deleted')::INTEGER as total_documents,
    (SELECT COALESCE(SUM(file_size) / (1024.0 * 1024.0 * 1024.0), 0.0) FROM documents WHERE status != 'deleted')::NUMERIC as total_storage_gb,
    (SELECT COUNT(*) FROM profiles WHERE status IN ('active', 'pending_confirmation'))::INTEGER as total_users,
    (SELECT COUNT(*) FROM entities WHERE status = 'active')::INTEGER as total_entities,
    (SELECT COUNT(DISTINCT created_by) FROM documents WHERE status != 'deleted' AND created_by IS NOT NULL)::INTEGER as users_with_data,
    (SELECT COUNT(DISTINCT entity_id) FROM documents WHERE status != 'deleted' AND entity_id IS NOT NULL)::INTEGER as entities_with_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Conceder permissões
GRANT EXECUTE ON FUNCTION get_user_storage_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_entity_storage_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_storage_summary() TO authenticated;

-- 5. Verificar se as funções foram criadas
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_user_storage_data',
    'get_entity_storage_data', 
    'get_storage_summary'
  )
ORDER BY routine_name;

-- 6. Teste das funções (descomente para testar)
-- SELECT * FROM get_storage_summary();
-- SELECT * FROM get_user_storage_data('e35098e0-b687-41fa-95cb-830c6bb4b86d');
-- SELECT * FROM get_entity_storage_data((SELECT id FROM entities LIMIT 1));