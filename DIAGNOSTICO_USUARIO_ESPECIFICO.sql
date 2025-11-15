-- ============================================
-- DIAGNÓSTICO DE USUÁRIO ESPECÍFICO
-- ============================================
-- Este script verifica problemas com um usuário administrador específico
-- que não consegue inativar ou excluir outros usuários

-- 1. VERIFICAR PERFIL DO USUÁRIO PROBLEMÁTICO
-- Substitua 'email@do.usuario' pelo email do usuário com problema
SELECT 
  id,
  email,
  full_name,
  entity_id,
  entity_role,
  status,
  created_at,
  updated_at,
  phone,
  position,
  avatar_url
FROM profiles
WHERE email = 'email@do.usuario';  -- SUBSTITUIR PELO EMAIL DO USUÁRIO

-- 2. VERIFICAR SE O USUÁRIO TEM ENTITY_ID VÁLIDO
SELECT 
  p.id as profile_id,
  p.email,
  p.entity_id,
  p.entity_role,
  e.id as entity_exists,
  e.name as entity_name
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
WHERE p.email = 'email@do.usuario';  -- SUBSTITUIR PELO EMAIL DO USUÁRIO

-- 3. VERIFICAR OUTROS USUÁRIOS DA MESMA ENTIDADE
-- (Para comparar com usuários que funcionam)
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.entity_role,
  p.status,
  p.entity_id
FROM profiles p
WHERE p.entity_id = (
  SELECT entity_id 
  FROM profiles 
  WHERE email = 'email@do.usuario'  -- SUBSTITUIR PELO EMAIL DO USUÁRIO
)
ORDER BY p.entity_role, p.email;

-- 4. VERIFICAR SE HÁ MÚLTIPLOS REGISTROS DO MESMO USUÁRIO
SELECT 
  email,
  COUNT(*) as total_registros,
  array_agg(id) as ids,
  array_agg(entity_id) as entity_ids,
  array_agg(entity_role) as roles
FROM profiles
WHERE email = 'email@do.usuario'  -- SUBSTITUIR PELO EMAIL DO USUÁRIO
GROUP BY email;

-- 5. VERIFICAR PERMISSÕES NA TABELA auth.users
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  au.banned_until,
  au.created_at as auth_created_at,
  p.entity_role,
  p.status,
  p.entity_id
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email = 'email@do.usuario';  -- SUBSTITUIR PELO EMAIL DO USUÁRIO

-- 6. VERIFICAR SE HÁ PROBLEMAS DE SINCRONIZAÇÃO
-- (Usuário existe em auth.users mas não em profiles, ou vice-versa)
SELECT 
  'auth.users' as tabela,
  au.id,
  au.email,
  NULL as entity_role,
  NULL as status
FROM auth.users au
WHERE au.email = 'email@do.usuario'  -- SUBSTITUIR PELO EMAIL DO USUÁRIO
  AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = au.id
  )

UNION ALL

SELECT 
  'profiles' as tabela,
  p.id,
  p.email,
  p.entity_role,
  p.status
FROM profiles p
WHERE p.email = 'email@do.usuario'  -- SUBSTITUIR PELO EMAIL DO USUÁRIO
  AND NOT EXISTS (
    SELECT 1 FROM auth.users au WHERE au.id = p.id
  );

-- ============================================
-- POSSÍVEIS SOLUÇÕES
-- ============================================

-- SOLUÇÃO 1: Se o entity_role não for 'admin', corrigir:
-- UPDATE profiles 
-- SET entity_role = 'admin'
-- WHERE email = 'email@do.usuario';

-- SOLUÇÃO 2: Se o entity_id estiver NULL ou inválido, corrigir:
-- UPDATE profiles 
-- SET entity_id = 'ID_DA_ENTIDADE_CORRETA'
-- WHERE email = 'email@do.usuario';

-- SOLUÇÃO 3: Se houver múltiplos registros, remover duplicatas:
-- DELETE FROM profiles 
-- WHERE id IN (
--   SELECT id FROM profiles 
--   WHERE email = 'email@do.usuario'
--   ORDER BY created_at DESC
--   OFFSET 1
-- );

-- SOLUÇÃO 4: Se o status estiver incorreto:
-- UPDATE profiles 
-- SET status = 'active'
-- WHERE email = 'email@do.usuario';

-- SOLUÇÃO 5: Recriar o perfil do zero (ÚLTIMO RECURSO):
-- Primeiro, salvar os dados importantes:
-- SELECT * FROM profiles WHERE email = 'email@do.usuario';
-- 
-- Depois, deletar e recriar:
-- DELETE FROM profiles WHERE email = 'email@do.usuario';
-- INSERT INTO profiles (id, email, full_name, entity_id, entity_role, status)
-- VALUES (
--   'ID_DO_AUTH_USERS',
--   'email@do.usuario',
--   'Nome Completo',
--   'ID_DA_ENTIDADE',
--   'admin',
--   'active'
-- );
