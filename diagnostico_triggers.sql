-- ========================================
-- DIAGNÓSTICO DO PROBLEMA DE CONFIRMAÇÃO
-- ========================================

-- 1. Verificar triggers ativos na tabela auth.users
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users'
ORDER BY trigger_name;

-- 2. Verificar função handle_new_user
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%handle_new_user%';

-- 3. Verificar usuários sem perfil
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    u.created_at,
    p.id as profile_exists
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC
LIMIT 10;

-- 4. Verificar estrutura da tabela profiles
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;