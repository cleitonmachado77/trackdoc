-- ========================================
-- VERIFICAR: Usuários que aparecem incorretamente
-- ========================================

-- 1. Ver os usuários específicos que estão aparecendo
SELECT 
  id,
  full_name,
  email,
  entity_id,
  registration_type,
  role,
  status,
  CASE 
    WHEN entity_id IS NULL THEN '❌ SEM ENTIDADE (SOLO)'
    WHEN entity_id = 'ebfc8f63-1a4a-40e0-ab1b-ac341f099334' THEN '✅ ADTECH NEGÓCIOS'
    WHEN entity_id = '7378b7b1-50c5-4d51-8170-017838ce5b27' THEN '✅ Empresa do João'
    WHEN entity_id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52' THEN '✅ Camara Municipal'
    ELSE '⚠️ OUTRA ENTIDADE: ' || entity_id
  END as situacao
FROM profiles
WHERE email IN (
  'adtechnegocios@gmail.com',
  'lgmachado3002@gmail.com'
)
OR full_name IN (
  'ADTECH',
  'Luana Gabriela Machado'
);

-- 2. Ver TODOS os usuários e suas entidades
SELECT 
  id,
  full_name,
  email,
  entity_id,
  registration_type,
  CASE 
    WHEN entity_id IS NULL THEN '❌ SOLO'
    WHEN entity_id = 'ebfc8f63-1a4a-40e0-ab1b-ac341f099334' THEN 'ADTECH'
    WHEN entity_id = '7378b7b1-50c5-4d51-8170-017838ce5b27' THEN 'João'
    WHEN entity_id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52' THEN 'Camara'
    ELSE 'OUTRA'
  END as entidade_nome
FROM profiles
ORDER BY 
  CASE WHEN entity_id IS NULL THEN 1 ELSE 0 END,
  full_name;

-- 3. Ver qual usuário está logado (substitua o email)
-- Execute com SEU email para ver sua entity_id
SELECT 
  id,
  full_name,
  email,
  entity_id,
  CASE 
    WHEN entity_id IS NULL THEN '❌ VOCÊ É USUÁRIO SOLO'
    WHEN entity_id = 'ebfc8f63-1a4a-40e0-ab1b-ac341f099334' THEN '✅ VOCÊ É DA ADTECH'
    WHEN entity_id = '7378b7b1-50c5-4d51-8170-017838ce5b27' THEN '✅ VOCÊ É DA EMPRESA DO JOÃO'
    WHEN entity_id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52' THEN '✅ VOCÊ É DA CAMARA'
    ELSE '⚠️ VOCÊ É DE OUTRA ENTIDADE'
  END as sua_situacao
FROM profiles
WHERE email = 'SEU_EMAIL_AQUI'; -- SUBSTITUA PELO SEU EMAIL

-- ========================================
-- RESULTADO ESPERADO:
-- ========================================
-- Se ADTECH e Luana têm entity_id diferente do seu,
-- eles NÃO deveriam aparecer na lista.
-- 
-- Se eles têm entity_id = NULL e você TEM entity_id,
-- eles NÃO deveriam aparecer.
-- ========================================
