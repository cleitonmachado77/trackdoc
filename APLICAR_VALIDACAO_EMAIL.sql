-- ============================================
-- SCRIPT PARA APLICAR VALIDAÇÃO DE EMAIL ÚNICO
-- ============================================
-- Execute este script no SQL Editor do Supabase Dashboard
-- para garantir que emails não possam ser duplicados

-- PASSO 1: Verificar se há emails duplicados atualmente
SELECT 
  LOWER(email) as email_normalizado,
  COUNT(*) as quantidade,
  STRING_AGG(id::text, ', ') as user_ids
FROM profiles
WHERE email IS NOT NULL
GROUP BY LOWER(email)
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- Se a query acima retornar resultados, há duplicatas!
-- O script abaixo irá remover as duplicatas mantendo apenas o registro mais recente

-- PASSO 2: Remover duplicatas (mantém o mais recente)
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

-- PASSO 3: Criar índice único (case-insensitive)
DROP INDEX IF EXISTS idx_profiles_email_unique;
CREATE UNIQUE INDEX idx_profiles_email_unique ON profiles (LOWER(email));

-- PASSO 4: Criar função de validação
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
      USING ERRCODE = '23505';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASSO 5: Criar trigger
DROP TRIGGER IF EXISTS validate_email_before_insert ON profiles;
CREATE TRIGGER validate_email_before_insert
  BEFORE INSERT OR UPDATE OF email ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_unique_email();

-- PASSO 6: Adicionar comentários
COMMENT ON INDEX idx_profiles_email_unique IS 'Garante que não existam emails duplicados (case-insensitive)';
COMMENT ON FUNCTION validate_unique_email() IS 'Valida que o email seja único antes de inserir ou atualizar';

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Verificar se o índice foi criado
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'profiles' 
AND indexname = 'idx_profiles_email_unique';

-- Verificar se a função foi criada
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'validate_unique_email';

-- Verificar se o trigger foi criado
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'validate_email_before_insert';

-- ============================================
-- TESTE (OPCIONAL)
-- ============================================

-- Tentar inserir um email duplicado (deve falhar)
-- DESCOMENTE AS LINHAS ABAIXO PARA TESTAR:

-- INSERT INTO profiles (id, email, full_name)
-- VALUES (
--   gen_random_uuid(),
--   (SELECT email FROM profiles LIMIT 1), -- Pega um email existente
--   'Teste Duplicado'
-- );

-- Se o teste acima falhar com erro "Este email já está cadastrado no sistema"
-- significa que a validação está funcionando corretamente! ✅
