-- 🔍 DEBUG: Verificar metadata do usuário real criado

-- 1. Verificar metadata do último usuário
SELECT 
    '🔍 METADATA DO ÚLTIMO USUÁRIO' as status,
    u.id,
    u.email,
    u.created_at,
    u.raw_user_meta_data,
    CASE 
        WHEN u.raw_user_meta_data IS NULL THEN '❌ METADATA NULL'
        WHEN u.raw_user_meta_data = '{}' THEN '❌ METADATA VAZIO'
        WHEN u.raw_user_meta_data->>'registration_type' = 'entity_admin' THEN '✅ ENTITY_ADMIN'
        ELSE '⚠️ METADATA PRESENTE MAS INCORRETO'
    END as metadata_status,
    u.raw_user_meta_data->>'registration_type' as reg_type_metadata,
    u.raw_user_meta_data->>'entity_name' as entity_name_metadata,
    u.raw_user_meta_data->>'entity_legal_name' as entity_legal_metadata
FROM auth.users u
WHERE u.id = '2c97a073-f3d6-4285-9abb-baa5262de808';

-- 2. Verificar perfil correspondente
SELECT 
    '🔍 PERFIL CORRESPONDENTE' as status,
    p.id,
    p.full_name,
    p.email,
    p.registration_type,
    p.entity_role,
    p.role,
    p.entity_id,
    CASE 
        WHEN p.registration_type = 'entity_admin' AND p.entity_id IS NOT NULL THEN '✅ CORRETO'
        WHEN p.registration_type = 'entity_admin' AND p.entity_id IS NULL THEN '⚠️ ENTITY_ADMIN SEM ENTIDADE'
        WHEN p.registration_type = 'individual' THEN '❌ DEVERIA SER ENTITY_ADMIN'
        ELSE '❓ ESTADO DESCONHECIDO'
    END as status_perfil
FROM profiles p
WHERE p.id = '2c97a073-f3d6-4285-9abb-baa5262de808';

-- 3. Verificar entidade criada
SELECT 
    '🔍 ENTIDADE CRIADA' as status,
    e.id,
    e.name,
    e.legal_name,
    e.cnpj,
    e.admin_user_id,
    CASE 
        WHEN e.admin_user_id = '2c97a073-f3d6-4285-9abb-baa5262de808' THEN '✅ USUÁRIO É ADMIN'
        WHEN e.admin_user_id IS NULL THEN '❌ SEM ADMIN DEFINIDO'
        ELSE '⚠️ ADMIN É OUTRO USUÁRIO'
    END as admin_status
FROM entities e
WHERE e.id = '4a13fedc-89e0-4cca-a74c-f4ef8fa476a2';

-- 4. Verificar logs da função (se disponível)
-- Mostrar se a função está sendo executada
DO $$
BEGIN
    RAISE NOTICE '🔍 Verificando se a função handle_new_user está sendo executada...';
    RAISE NOTICE '📋 Se não há logs da função, ela pode não estar sendo chamada';
    RAISE NOTICE '🔧 Ou o metadata não está chegando corretamente';
END $$;