-- ============================================================================
-- TESTE APÓS CORREÇÕES - Verificar se tudo funcionou
-- ============================================================================

-- 1. VERIFICAR SE A TABELA PROFILES EXISTE E TEM A ESTRUTURA CORRETA
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. VERIFICAR SE O TRIGGER EXISTE
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 3. VERIFICAR ALGUMAS FOREIGN KEYS IMPORTANTES
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('documents', 'chat_messages', 'audit_logs', 'entities')
ORDER BY tc.table_name, kcu.column_name;

-- 4. VERIFICAR POLÍTICAS RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- 5. CONTAR REGISTROS EXISTENTES (se houver)
SELECT COUNT(*) as total_profiles FROM profiles;

-- 6. VERIFICAR SE A FUNÇÃO handle_new_user EXISTE
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user'
AND routine_schema = 'public';

-- 7. TESTAR CRIAÇÃO DE UM PERFIL MANUALMENTE (OPCIONAL)
-- DESCOMENTE PARA TESTAR:
/*
INSERT INTO profiles (
    id, 
    full_name, 
    email, 
    role, 
    status,
    entity_role,
    registration_type
) VALUES (
    gen_random_uuid(),
    'Teste Usuario',
    'teste@exemplo.com',
    'user',
    'active',
    'user',
    'individual'
);
*/