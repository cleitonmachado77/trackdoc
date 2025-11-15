-- ============================================
-- DIAGNÓSTICO SIMPLIFICADO - USUÁRIO ESPECÍFICO
-- ============================================
-- INSTRUÇÕES:
-- 1. Substitua 'email@do.usuario' pelo email do usuário com problema
-- 2. Execute cada query separadamente no Supabase SQL Editor
-- 3. Anote os resultados de cada query

-- ============================================
-- QUERY 1: VERIFICAR PERFIL DO USUÁRIO
-- ============================================
-- Esta query mostra todas as informações do perfil do usuário
-- IMPORTANTE: Verifique se entity_role = 'admin' e status = 'active'

SELECT 
  id,
  email,
  full_name,
  entity_id,
  entity_role,
  status,
  created_at,
  updated_at
FROM profiles
WHERE email = 'email@do.usuario';  -- ⚠️ SUBSTITUIR AQUI


-- ============================================
-- QUERY 2: VERIFICAR ENTIDADE
-- ============================================
-- Esta query verifica se a entidade existe e está válida

SELECT 
  p.email,
  p.entity_role,
  p.status,
  e.id as entity_id,
  e.name as entity_name,
  e.current_users
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
WHERE p.email = 'email@do.usuario';  -- ⚠️ SUBSTITUIR AQUI


-- ============================================
-- QUERY 3: COMPARAR COM OUTROS ADMINS
-- ============================================
-- Esta query mostra todos os admins da mesma entidade
-- Use para comparar com um admin que funciona

SELECT 
  p.email,
  p.full_name,
  p.entity_role,
  p.status,
  p.entity_id
FROM profiles p
WHERE p.entity_id = (
  SELECT entity_id 
  FROM profiles 
  WHERE email = 'email@do.usuario'  -- ⚠️ SUBSTITUIR AQUI
)
AND p.entity_role = 'admin'
ORDER BY p.email;


-- ============================================
-- QUERY 4: VERIFICAR DUPLICATAS
-- ============================================
-- Esta query verifica se há múltiplos registros do mesmo usuário

SELECT 
  email,
  COUNT(*) as total_registros,
  string_agg(id::text, ', ') as ids
FROM profiles
WHERE email = 'email@do.usuario'  -- ⚠️ SUBSTITUIR AQUI
GROUP BY email
HAVING COUNT(*) > 1;


-- ============================================
-- QUERY 5: VERIFICAR SINCRONIZAÇÃO
-- ============================================
-- Esta query verifica se o usuário existe em auth.users

SELECT 
  'profiles' as origem,
  p.id,
  p.email,
  p.entity_role,
  p.status,
  CASE 
    WHEN au.id IS NOT NULL THEN 'Existe em auth.users'
    ELSE '❌ NÃO existe em auth.users'
  END as status_auth
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.email = 'email@do.usuario';  -- ⚠️ SUBSTITUIR AQUI


-- ============================================
-- ANÁLISE DOS RESULTADOS
-- ============================================

-- ✅ O QUE DEVE ESTAR CORRETO:
-- 
-- QUERY 1:
--   - entity_role = 'admin'
--   - status = 'active'
--   - entity_id = UUID válido (não NULL)
--
-- QUERY 2:
--   - entity_name deve aparecer (não NULL)
--   - entity_id deve ser o mesmo da QUERY 1
--
-- QUERY 3:
--   - Deve mostrar pelo menos 2 admins (incluindo o problemático)
--   - Compare os campos com um admin que funciona
--
-- QUERY 4:
--   - Não deve retornar nenhum resultado (sem duplicatas)
--   - Se retornar algo, há duplicatas que precisam ser removidas
--
-- QUERY 5:
--   - status_auth deve ser 'Existe em auth.users'
--   - Se for '❌ NÃO existe em auth.users', há problema de sincronização


-- ============================================
-- CORREÇÕES RÁPIDAS
-- ============================================

-- ⚠️ ATENÇÃO: Execute apenas UMA correção por vez
-- ⚠️ Sempre faça backup antes de executar UPDATE ou DELETE

-- CORREÇÃO 1: Se entity_role não for 'admin'
-- UPDATE profiles 
-- SET entity_role = 'admin'
-- WHERE email = 'email@do.usuario';

-- CORREÇÃO 2: Se entity_id for NULL (substitua pelo ID correto da entidade)
-- UPDATE profiles 
-- SET entity_id = 'COLE_AQUI_O_ID_DA_ENTIDADE'
-- WHERE email = 'email@do.usuario';

-- CORREÇÃO 3: Se status não for 'active'
-- UPDATE profiles 
-- SET status = 'active'
-- WHERE email = 'email@do.usuario';

-- CORREÇÃO 4: Se houver duplicatas (remove os mais recentes, mantém o mais antigo)
-- DELETE FROM profiles 
-- WHERE id IN (
--   SELECT id FROM profiles 
--   WHERE email = 'email@do.usuario'
--   ORDER BY created_at DESC
--   OFFSET 1
-- );


-- ============================================
-- APÓS APLICAR CORREÇÕES
-- ============================================
-- 1. Execute a QUERY 1 novamente para confirmar
-- 2. Usuário deve fazer LOGOUT
-- 3. Limpar cache do navegador
-- 4. Fazer LOGIN novamente
-- 5. Testar as ações de inativar/excluir
