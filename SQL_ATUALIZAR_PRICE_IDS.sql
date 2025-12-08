-- ============================================================================
-- SQL PARA ATUALIZAR PRICE IDS DO STRIPE
-- Execute este SQL no Supabase SQL Editor
-- ============================================================================

-- Atualizar Plano Gratuito (Trial)
UPDATE plans 
SET 
  stripe_price_id = 'price_1Saode9dhzvo9jaq7Y6rHXMg',
  stripe_product_id = 'prod_TXuSEzfsYFf5Fc',
  price_monthly = 0.00,
  trial_days = 14,
  is_trial = true
WHERE name = 'Plano Gratuito' OR type = 'trial';

-- Atualizar Plano Básico
UPDATE plans 
SET 
  stripe_price_id = 'price_1SZXBt9dhzvo9jaq2gH6ncQW',
  stripe_product_id = 'prod_TWaMiqZxQMncWI',
  price_monthly = 149.00,
  type = 'basico',
  name = 'Básico'
WHERE name = 'Plano Básico' OR type = 'basico';

-- Atualizar Plano Profissional
UPDATE plans 
SET 
  stripe_price_id = 'price_1SZXCK9dhzvo9jaqDyRdF66a',
  stripe_product_id = 'prod_TWaNL1rq6Td3R9',
  price_monthly = 349.00,
  type = 'profissional',
  name = 'Profissional'
WHERE name = 'Plano Profissional' OR name = 'Professional' OR type = 'profissional';

-- Atualizar Plano Enterprise
UPDATE plans 
SET 
  stripe_price_id = 'price_1SZXCz9dhzvo9jaqMVpEeIYf',
  stripe_product_id = 'prod_TWaNhjKQCq5PyL',
  price_monthly = 649.00,
  type = 'enterprise',
  name = 'Enterprise'
WHERE name = 'Plano Enterprise' OR name = 'Enterprise' OR type = 'enterprise';

-- ============================================================================
-- VERIFICAR RESULTADOS
-- ============================================================================

-- Ver todos os planos atualizados
SELECT 
  id,
  name,
  type,
  price_monthly,
  stripe_price_id,
  stripe_product_id,
  is_active,
  is_trial
FROM plans
ORDER BY price_monthly;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- Plano Gratuito    | trial         | R$ 0    | price_1Saode... | ✓ trial
-- Básico            | basico        | R$ 149  | price_1SZXBt... | ✓ active
-- Profissional      | profissional  | R$ 349  | price_1SZXCK... | ✓ active
-- Enterprise        | enterprise    | R$ 649  | price_1SZXCz... | ✓ active
-- ============================================================================

-- Verificar se todos têm Price ID
SELECT 
  COUNT(*) as total_planos,
  COUNT(stripe_price_id) as com_price_id,
  COUNT(*) - COUNT(stripe_price_id) as sem_price_id
FROM plans
WHERE type IN ('trial', 'basico', 'profissional', 'enterprise');

-- Se "sem_price_id" = 0, está tudo certo! ✓

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. O Plano Gratuito é o trial de 14 dias
-- 2. Após 14 dias, o acesso é bloqueado automaticamente
-- 3. O preço do Enterprise foi mantido em R$ 649 (como está no Stripe)
-- 4. Todos os planos agora têm Price ID configurado
-- ============================================================================
