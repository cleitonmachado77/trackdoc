-- Script para adicionar status 'pending_confirmation' ao constraint da tabela profiles
-- Execute este script no SQL Editor do Supabase

-- 1. Remover o constraint antigo
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_status_check;

-- 2. Adicionar novo constraint com o status 'pending_confirmation'
ALTER TABLE profiles 
ADD CONSTRAINT profiles_status_check 
CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'suspended'::text, 'pending_confirmation'::text]));

-- 3. Criar índice para o novo status
CREATE INDEX IF NOT EXISTS idx_profiles_status_pending 
ON profiles (status) 
WHERE status = 'pending_confirmation';

-- 4. Atualizar usuários existentes que estão inativos e foram criados recentemente
UPDATE profiles 
SET status = 'pending_confirmation'
WHERE status = 'inactive' 
  AND entity_id IS NOT NULL
  AND created_at > NOW() - INTERVAL '7 days'
  AND updated_at = created_at;

-- 5. Verificar o resultado
SELECT 
  status, 
  COUNT(*) as total
FROM profiles
GROUP BY status
ORDER BY status;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Status pending_confirmation adicionado com sucesso!';
  RAISE NOTICE 'Agora você pode criar usuários com status pending_confirmation';
END $$;
