-- =====================================================
-- CORREÇÃO SIMPLES DOS CONTADORES - VERSÃO FUNCIONAL
-- =====================================================
-- Esta versão usa apenas tipos básicos para evitar conflitos
-- =====================================================

-- 1. Remover função problemática
DROP FUNCTION IF EXISTS check_user_plan_limits(UUID);

-- 2. Criar função simples que funciona
CREATE OR REPLACE FUNCTION get_user_usage_stats(p_user_id UUID)
RETURNS TABLE (
  documents_count INTEGER,
  storage_gb NUMERIC,
  plan_name TEXT,
  max_storage_gb NUMERIC,
  max_documents INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(COUNT(d.id)::INTEGER, 0) as documents_count,
    COALESCE(SUM(d.file_size) / (1024.0 * 1024.0 * 1024.0), 0.0)::NUMERIC as storage_gb,
    COALESCE(pl.name, 'Sem plano')::TEXT as plan_name,
    COALESCE(pl.max_storage_gb, 0.0)::NUMERIC as max_storage_gb,
    COALESCE(pl.max_documents, 0)::INTEGER as max_documents
  FROM documents d
  RIGHT JOIN profiles pr ON pr.id = p_user_id
  LEFT JOIN subscriptions s ON s.user_id = p_user_id AND s.status = 'active'
  LEFT JOIN plans pl ON pl.id = s.plan_id
  WHERE d.created_by = p_user_id AND (d.status IS NULL OR d.status != 'deleted')
  GROUP BY pl.name, pl.max_storage_gb, pl.max_documents;
  
  -- Se não retornou nada, retornar zeros
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      0 as documents_count,
      0.0::NUMERIC as storage_gb,
      'Sem plano'::TEXT as plan_name,
      0.0::NUMERIC as max_storage_gb,
      0 as max_documents;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Função para atualizar contadores na tabela subscriptions
CREATE OR REPLACE FUNCTION update_user_counters(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_docs_count INTEGER;
  v_storage_gb NUMERIC;
BEGIN
  -- Calcular valores reais
  SELECT 
    COALESCE(COUNT(*), 0),
    COALESCE(SUM(file_size) / (1024.0 * 1024.0 * 1024.0), 0.0)
  INTO v_docs_count, v_storage_gb
  FROM documents
  WHERE created_by = p_user_id
    AND status != 'deleted';
  
  -- Atualizar subscription se existir
  UPDATE subscriptions
  SET 
    current_storage_gb = v_storage_gb,
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND status = 'active';
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger simples para manter contadores atualizados
CREATE OR REPLACE FUNCTION simple_update_counters()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM update_user_counters(NEW.created_by);
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    IF OLD.file_size != NEW.file_size OR OLD.status != NEW.status THEN
      PERFORM update_user_counters(NEW.created_by);
    END IF;
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    PERFORM update_user_counters(OLD.created_by);
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger se não existir
DROP TRIGGER IF EXISTS simple_update_counters_trigger ON documents;
CREATE TRIGGER simple_update_counters_trigger
  AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION simple_update_counters();

-- 6. Atualizar todos os contadores existentes
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT user_id 
    FROM subscriptions 
    WHERE status = 'active' AND user_id IS NOT NULL
  LOOP
    PERFORM update_user_counters(user_record.user_id);
  END LOOP;
END $$;

-- 7. Conceder permissões
GRANT EXECUTE ON FUNCTION get_user_usage_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_counters(UUID) TO authenticated;

-- 8. Verificar se funcionou
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_user_usage_stats', 'update_user_counters')
ORDER BY routine_name;

-- 9. Teste com um usuário (descomente para testar)
-- SELECT * FROM get_user_usage_stats('e35098e0-b687-41fa-95cb-830c6bb4b86d');