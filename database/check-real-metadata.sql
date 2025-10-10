-- 🔍 VERIFICAR: Metadata real dos últimos usuários criados

-- Verificar metadata dos últimos 3 usuários
SELECT 
    '🔍 METADATA REAL DOS USUÁRIOS' as status,
    u.email,
    u.created_at,
    u.raw_user_meta_data,
    CASE 
        WHEN u.raw_user_meta_data IS NULL THEN '❌ METADATA NULL'
        WHEN u.raw_user_meta_data = '{}' THEN '❌ METADATA VAZIO'  
        WHEN u.raw_user_meta_data->>'registration_type' = 'entity_admin' THEN '✅ ENTITY_ADMIN'
        WHEN u.raw_user_meta_data->>'registration_type' = 'individual' THEN '➖ INDIVIDUAL'
        ELSE '❓ OUTRO: ' || (u.raw_user_meta_data->>'registration_type')
    END as metadata_status,
    u.raw_user_meta_data->>'registration_type' as reg_type,
    u.raw_user_meta_data->>'role' as role_meta,
    u.raw_user_meta_data->>'entity_role' as entity_role_meta,
    u.raw_user_meta_data->>'entity_name' as entity_name_meta,
    u.raw_user_meta_data->>'full_name' as full_name_meta
FROM auth.users u
WHERE u.created_at > NOW() - INTERVAL '3 hours'
ORDER BY u.created_at DESC
LIMIT 3;

-- Verificar se há discrepância entre metadata e perfil criado
SELECT 
    '🔍 COMPARAÇÃO METADATA vs PERFIL' as status,
    u.email,
    u.raw_user_meta_data->>'registration_type' as metadata_reg_type,
    p.registration_type as profile_reg_type,
    u.raw_user_meta_data->>'entity_name' as metadata_entity_name,
    CASE 
        WHEN u.raw_user_meta_data->>'registration_type' = p.registration_type THEN '✅ CONSISTENTE'
        ELSE '❌ INCONSISTENTE'
    END as consistencia
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.created_at > NOW() - INTERVAL '3 hours'
ORDER BY u.created_at DESC
LIMIT 3;