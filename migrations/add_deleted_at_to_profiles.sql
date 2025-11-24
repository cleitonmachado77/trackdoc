-- Adicionar coluna deleted_at para soft delete de usuários
-- Isso permite manter dados históricos e rastreabilidade

-- Passo 1: Adicionar 'deleted' aos valores permitidos no status (se houver constraint)
DO $$ 
BEGIN
  -- Verificar se existe constraint de check no status
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'profiles' AND column_name = 'status'
  ) THEN
    -- Remover constraint antiga
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
    
    -- Adicionar nova constraint com 'deleted'
    ALTER TABLE profiles ADD CONSTRAINT profiles_status_check 
    CHECK (status IN ('active', 'inactive', 'suspended', 'pending_confirmation', 'deleted'));
    
    RAISE NOTICE 'Constraint profiles_status_check atualizada com sucesso';
  END IF;
END $$;

-- Passo 2: Adicionar coluna deleted_at se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN deleted_at TIMESTAMPTZ;
    COMMENT ON COLUMN profiles.deleted_at IS 'Data de exclusão lógica do usuário (soft delete)';
    RAISE NOTICE 'Coluna deleted_at criada com sucesso';
  ELSE
    RAISE NOTICE 'Coluna deleted_at já existe';
  END IF;
END $$;

-- Passo 3: Criar índice para melhorar performance de queries que filtram usuários não excluídos
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at) WHERE deleted_at IS NULL;

-- Passo 4: Atualizar status para 'deleted' em usuários que já foram marcados como excluídos
-- (caso existam usuários com deleted_at preenchido)
UPDATE profiles 
SET status = 'deleted' 
WHERE deleted_at IS NOT NULL AND status != 'deleted';
