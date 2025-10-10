-- 🔧 CORREÇÃO IMEDIATA: Corrigir usuário e entidade criados incorretamente

BEGIN;

-- IDs do usuário e entidade problemáticos
-- Usuário: 2c97a073-f3d6-4285-9abb-baa5262de808
-- Entidade: 4a13fedc-89e0-4cca-a74c-f4ef8fa476a2

-- 1. Corrigir perfil do usuário
UPDATE profiles 
SET 
    registration_type = 'entity_admin',
    entity_role = 'admin',
    role = 'admin',
    entity_id = '4a13fedc-89e0-4cca-a74c-f4ef8fa476a2',
    registration_completed = true,
    updated_at = NOW()
WHERE id = '2c97a073-f3d6-4285-9abb-baa5262de808';

-- 2. Corrigir entidade (associar ao usuário)
UPDATE entities 
SET 
    admin_user_id = '2c97a073-f3d6-4285-9abb-baa5262de808',
    updated_at = NOW()
WHERE id = '4a13fedc-89e0-4cca-a74c-f4ef8fa476a2';

COMMIT;

-- 3. Verificar correção
SELECT 
    '🎯 CORREÇÃO APLICADA' as status,
    p.full_name,
    p.email,
    p.registration_type,
    p.entity_role,
    p.role,
    e.name as entity_name,
    e.admin_user_id,
    CASE 
        WHEN p.entity_id IS NOT NULL AND p.entity_role = 'admin' AND e.admin_user_id = p.id THEN '✅ CORRIGIDO'
        ELSE '❌ AINDA COM PROBLEMA'
    END as resultado
FROM profiles p
JOIN entities e ON p.entity_id = e.id
WHERE p.id = '2c97a073-f3d6-4285-9abb-baa5262de808';

-- 4. Mostrar status final
DO $$
BEGIN
    RAISE NOTICE '✅ Usuário corrigido: agora é admin da entidade';
    RAISE NOTICE '🔧 Mas ainda precisamos corrigir o problema do metadata';
    RAISE NOTICE '📋 Próximo passo: investigar por que metadata não chega na função';
END $$;