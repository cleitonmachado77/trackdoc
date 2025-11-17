-- Migração para corrigir recursão infinita nas policies de profiles
-- Data: 2025-02-01

-- Remover policies que causam recursão infinita
DROP POLICY IF EXISTS "entity_admins_can_view_entity_users" ON profiles;
DROP POLICY IF EXISTS "entity_admins_can_update_entity_users" ON profiles;

-- Log de conclusão
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Policies problemáticas removidas com sucesso!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'As policies existentes de profiles continuam ativas';
  RAISE NOTICE 'e fornecem o acesso necessário sem recursão.';
  RAISE NOTICE '==============================================';
END $$;
