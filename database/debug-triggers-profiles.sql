-- 🔍 DEBUG: Verificar triggers na tabela profiles

-- 1. Verificar todos os triggers na tabela profiles
SELECT 
    '🔍 TRIGGERS NA TABELA PROFILES' as status,
    trigger_name,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles'
AND event_object_schema = 'public'
ORDER BY trigger_name;

-- 2. Verificar se a função create_entity_from_user_metadata existe
SELECT 
    '🔍 FUNÇÃO create_entity_from_user_metadata' as status,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'create_entity_from_user_metadata' 
AND routine_schema = 'public';

-- 3. Verificar se a função handle_new_user existe (na tabela auth.users)
SELECT 
    '🔍 TRIGGERS NA TABELA AUTH.USERS' as status,
    trigger_name,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users'
AND event_object_schema = 'auth'
ORDER BY trigger_name;

-- 4. Verificar último usuário criado
SELECT 
    '🔍 ÚLTIMO USUÁRIO CRIADO' as status,
    u.id,
    u.email,
    u.raw_user_meta_data->>'registration_type' as metadata_reg_type,
    u.raw_user_meta_data->>'entity_name' as metadata_entity_name,
    p.registration_type as profile_reg_type,
    p.entity_id,
    p.entity_role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 1;

-- 5. Diagnóstico
DO $$
BEGIN
    RAISE NOTICE '🔍 DIAGNÓSTICO:';
    RAISE NOTICE '1. Frontend envia metadata correto ✅';
    RAISE NOTICE '2. Há triggers na tabela profiles para criar entidade';
    RAISE NOTICE '3. Mas entidade não está sendo criada ❌';
    RAISE NOTICE '4. Possível problema: função create_entity_from_user_metadata';
    RAISE NOTICE '5. Ou: trigger handle_new_user não está executando';
END $$;