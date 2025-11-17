-- Script para atualizar o status do usuário criado incorretamente
-- Execute este script no SQL Editor do Supabase

-- Atualizar usuários recém-criados que estão com status incorreto
UPDATE profiles 
SET status = 'pending_confirmation'
WHERE email = 'lgmachado3002@gmail.com'
  AND status != 'active';

-- Verificar o resultado
SELECT 
  id,
  full_name,
  email,
  status,
  entity_id,
  created_at
FROM profiles
WHERE email = 'lgmachado3002@gmail.com';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Status do usuário atualizado para pending_confirmation!';
END $$;
