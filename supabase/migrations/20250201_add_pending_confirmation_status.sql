-- Migração para adicionar status "pending_confirmation" para usuários aguardando confirmação de email
-- Data: 2025-02-01

-- 1. Adicionar novo valor ao enum de status (se ainda não existir)
DO $$ 
BEGIN
  -- Verificar se o tipo existe
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    -- Adicionar novo valor ao enum se não existir
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumtypid = 'user_status'::regtype 
      AND enumlabel = 'pending_confirmation'
    ) THEN
      ALTER TYPE user_status ADD VALUE 'pending_confirmation';
      RAISE NOTICE 'Status pending_confirmation adicionado ao enum user_status';
    ELSE
      RAISE NOTICE 'Status pending_confirmation já existe no enum';
    END IF;
  ELSE
    -- Se o enum não existe, criar com todos os valores
    CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_confirmation');
    RAISE NOTICE 'Enum user_status criado com todos os status';
  END IF;
END $$;

-- 2. Atualizar usuários existentes que estão inativos e foram criados recentemente
-- (assumindo que são usuários aguardando confirmação)
UPDATE profiles 
SET status = 'pending_confirmation'
WHERE status = 'inactive' 
  AND entity_id IS NOT NULL
  AND created_at > NOW() - INTERVAL '7 days'
  AND updated_at = created_at; -- Nunca foram atualizados = nunca confirmaram

-- 3. Criar índice para melhorar performance de queries por status
CREATE INDEX IF NOT EXISTS idx_profiles_status_pending 
ON profiles (status) 
WHERE status = 'pending_confirmation';

-- 4. Atualizar a view de confirmações pendentes
DROP VIEW IF EXISTS pending_email_confirmations;

CREATE OR REPLACE VIEW pending_email_confirmations AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.entity_id,
  e.name as entity_name,
  p.created_at,
  EXTRACT(EPOCH FROM (NOW() - p.created_at))/3600 as hours_since_creation,
  p.status
FROM profiles p
LEFT JOIN entities e ON e.id = p.entity_id
WHERE p.status = 'pending_confirmation'
  AND p.entity_id IS NOT NULL
ORDER BY p.created_at DESC;

COMMENT ON VIEW pending_email_confirmations IS 
'View para monitorar usuários de entidade aguardando confirmação de email (status: pending_confirmation)';

-- 5. Criar função para limpar confirmações expiradas (opcional - após 7 dias)
CREATE OR REPLACE FUNCTION cleanup_expired_confirmations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Deletar usuários que não confirmaram email em 7 dias
  WITH deleted AS (
    DELETE FROM profiles
    WHERE status = 'pending_confirmation'
      AND created_at < NOW() - INTERVAL '7 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_confirmations() IS 
'Remove usuários com confirmação pendente há mais de 7 dias';

-- 6. Log de conclusão
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Status pending_confirmation implementado!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Novo status disponível: pending_confirmation';
  RAISE NOTICE 'View atualizada: pending_email_confirmations';
  RAISE NOTICE 'Função criada: cleanup_expired_confirmations()';
  RAISE NOTICE '==============================================';
END $$;
