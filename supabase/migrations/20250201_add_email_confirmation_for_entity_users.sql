-- Migração para adicionar suporte a confirmação de email para usuários de entidades
-- Data: 2025-02-01

-- 1. Garantir que emails sejam únicos na tabela profiles
DO $$ 
BEGIN
  -- Verificar se a constraint já existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_email_unique'
  ) THEN
    -- Adicionar constraint de email único
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_email_unique UNIQUE (email);
    
    RAISE NOTICE 'Constraint profiles_email_unique criada com sucesso';
  ELSE
    RAISE NOTICE 'Constraint profiles_email_unique já existe';
  END IF;
END $$;

-- 2. Adicionar índice para melhorar performance de buscas por email
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower 
ON profiles (LOWER(email));

-- 3. Adicionar índice para status e entity_id (para queries de usuários de entidade)
CREATE INDEX IF NOT EXISTS idx_profiles_entity_status 
ON profiles (entity_id, status) 
WHERE entity_id IS NOT NULL;

-- 4. Criar função para verificar email duplicado antes de criar usuário
CREATE OR REPLACE FUNCTION check_email_unique()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se já existe um usuário com este email (case-insensitive)
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE LOWER(email) = LOWER(NEW.email) 
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Email % já está cadastrado no sistema', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger para validar email único
DROP TRIGGER IF EXISTS trigger_check_email_unique ON profiles;
CREATE TRIGGER trigger_check_email_unique
  BEFORE INSERT OR UPDATE OF email ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_email_unique();

-- 6. Adicionar comentários para documentação
COMMENT ON CONSTRAINT profiles_email_unique ON profiles IS 
'Garante que cada email seja único no sistema';

COMMENT ON INDEX idx_profiles_email_lower IS 
'Índice para buscas case-insensitive por email';

COMMENT ON INDEX idx_profiles_entity_status IS 
'Índice para queries de usuários de entidade por status';

COMMENT ON FUNCTION check_email_unique() IS 
'Valida que o email é único antes de inserir ou atualizar um perfil';

COMMENT ON TRIGGER trigger_check_email_unique ON profiles IS 
'Trigger que valida email único antes de inserir ou atualizar';

-- 7. Nota sobre RLS policies
-- As policies RLS para profiles já existem e não devem ser modificadas aqui
-- para evitar recursão infinita. As policies existentes já cobrem o acesso necessário.

-- 8. Criar view para monitorar usuários aguardando confirmação
CREATE OR REPLACE VIEW pending_email_confirmations AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.entity_id,
  e.name as entity_name,
  p.created_at,
  EXTRACT(EPOCH FROM (NOW() - p.created_at))/3600 as hours_since_creation
FROM profiles p
LEFT JOIN entities e ON e.id = p.entity_id
WHERE p.status = 'inactive'
  AND p.entity_id IS NOT NULL
ORDER BY p.created_at DESC;

COMMENT ON VIEW pending_email_confirmations IS 
'View para monitorar usuários de entidade aguardando confirmação de email';

-- 9. Criar função para reenviar email de confirmação (para uso futuro)
CREATE OR REPLACE FUNCTION resend_confirmation_email(user_email TEXT)
RETURNS JSON AS $$
DECLARE
  user_record RECORD;
  result JSON;
BEGIN
  -- Buscar usuário
  SELECT id, email, full_name, status 
  INTO user_record
  FROM profiles 
  WHERE LOWER(email) = LOWER(user_email)
  LIMIT 1;
  
  -- Verificar se usuário existe
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não encontrado'
    );
  END IF;
  
  -- Verificar se já está ativo
  IF user_record.status = 'active' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário já está ativo'
    );
  END IF;
  
  -- Retornar informações para reenvio (o reenvio real será feito pela API)
  RETURN json_build_object(
    'success', true,
    'user_id', user_record.id,
    'email', user_record.email,
    'full_name', user_record.full_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION resend_confirmation_email(TEXT) IS 
'Prepara informações para reenvio de email de confirmação';

-- 10. Adicionar log de auditoria
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Migração de confirmação de email concluída!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Recursos adicionados:';
  RAISE NOTICE '- Constraint de email único';
  RAISE NOTICE '- Índices para performance';
  RAISE NOTICE '- Trigger de validação de email';
  RAISE NOTICE '- View de confirmações pendentes';
  RAISE NOTICE '- Função de reenvio de confirmação';
  RAISE NOTICE '==============================================';
END $$;
