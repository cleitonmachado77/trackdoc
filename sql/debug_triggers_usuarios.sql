-- ========================================
-- DEBUG DE TRIGGERS E FUNÇÕES DE USUÁRIOS
-- ========================================

-- Verificar triggers ativos na tabela auth.users
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement,
    action_condition
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users'
ORDER BY trigger_name;

-- Verificar funções relacionadas a usuários
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (routine_name LIKE '%user%' OR routine_name LIKE '%profile%')
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Verificar se há perfis com status incorreto
SELECT 
    id,
    full_name,
    email,
    status,
    registration_completed,
    registration_type,
    created_at
FROM profiles 
WHERE email = 'lgmachado3002@gmail.com'
ORDER BY created_at DESC;

-- Verificar usuário no auth.users
SELECT 
    'Verificar no Supabase Dashboard - tabela auth.users' as instrucao,
    'Procurar por: lgmachado3002@gmail.com' as email_busca;