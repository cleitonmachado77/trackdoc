-- Adicionar constraint UNIQUE no email da tabela profiles
-- Isso garante que não seja possível ter emails duplicados no sistema

-- 1. Primeiro, limpar possíveis duplicatas existentes (se houver)
-- Manter apenas o registro mais recente de cada email duplicado
WITH duplicates AS (
  SELECT 
    id,
    email,
    ROW_NUMBER() OVER (PARTITION BY LOWER(email) ORDER BY created_at DESC) as rn
  FROM profiles
  WHERE email IS NOT NULL
)
DELETE FROM profiles
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- 2. Criar índice único no email (case-insensitive)
-- Isso impede a criação de novos registros com emails duplicados
DROP INDEX IF EXISTS idx_profiles_email_unique;
CREATE UNIQUE INDEX idx_profiles_email_unique ON profiles (LOWER(email));

-- 3. Adicionar comentário explicativo
COMMENT ON INDEX idx_profiles_email_unique IS 'Garante que não existam emails duplicados na tabela profiles (case-insensitive)';

-- 4. Criar função para validar email antes de inserir/atualizar
CREATE OR REPLACE FUNCTION validate_unique_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se já existe outro usuário com o mesmo email (case-insensitive)
  IF EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE LOWER(email) = LOWER(NEW.email) 
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Este email já está cadastrado no sistema'
      USING ERRCODE = '23505'; -- Código de erro para violação de constraint única
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger para validar email antes de inserir/atualizar
DROP TRIGGER IF EXISTS validate_email_before_insert ON profiles;
CREATE TRIGGER validate_email_before_insert
  BEFORE INSERT OR UPDATE OF email ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_unique_email();

-- 6. Adicionar comentário na função
COMMENT ON FUNCTION validate_unique_email() IS 'Valida que o email seja único na tabela profiles antes de inserir ou atualizar';
