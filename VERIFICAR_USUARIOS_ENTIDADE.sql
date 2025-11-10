-- ========================================
-- VERIFICAR: Usuários e suas Entidades
-- ========================================
-- Execute no Supabase SQL Editor para diagnosticar
-- ========================================

-- 1. Ver todos os usuários e suas entidades
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
    ELSE '✅ TEM ENTIDADE'
  END as tem_entidade
FROM profiles
ORDER BY full_name;

-- 2. Ver usuários específicos que estão aparecendo
SELECT 
  id,
  full_name,
  email,
  entity_id,
  registration_type
FROM profiles
WHERE email IN (
  'adtechnegocios@gmail.com',
  'lgmachado3002@gmail.com'
);

-- 3. Ver qual é a entidade do usuário logado
-- Substitua 'SEU_EMAIL_AQUI' pelo seu email
SELECT 
  p.id as user_id,
  p.full_name,
  p.email,
  p.entity_id,
  e.name as entity_name
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
WHERE p.email = 'SEU_EMAIL_AQUI';

-- 4. Ver todos os departamentos e suas entidades
SELECT 
  d.id,
  d.name as department_name,
  d.entity_id,
  e.name as entity_name,
  CASE 
    WHEN d.entity_id IS NULL THEN '❌ SEM ENTIDADE'
    ELSE '✅ TEM ENTIDADE'
  END as tem_entidade
FROM departments d
LEFT JOIN entities e ON d.entity_id = e.id
ORDER BY d.name;

-- ========================================
-- DIAGNÓSTICO ESPERADO:
-- ========================================
-- Se ADTECH e Luana aparecem com entity_id = NULL,
-- eles são usuários SOLO e não deveriam aparecer
-- para usuários que TÊM entidade.
-- ========================================
