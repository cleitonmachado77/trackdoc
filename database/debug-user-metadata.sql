-- 🔍 DEBUG: Verificar metadata dos usuários criados

-- 1. Verificar usuários recentes e seus metadados
SELECT 
    '🔍 USUÁRIOS RECENTES' as status,
    u.id,
    u.email,
    u.created_at,
    u.raw_user_meta_data,
    p.registration_type,
    p.entity_role,
    p.role,
    p.entity_id
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.created_at > NOW() - INTERVAL '1 hour'
ORDER BY u.created_at DESC
LIMIT 5;

-- 2. Verificar se a função handle_new_user está sendo executada
SELECT 
    '🔍 TRIGGER STATUS' as status,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 3. Verificar se há entidades criadas recentemente
SELECT 
    '🔍 ENTIDADES RECENTES' as status,
    COUNT(*) as total_entidades,
    MAX(created_at) as ultima_entidade
FROM entities
WHERE created_at > NOW() - INTERVAL '1 hour';

-- 4. Verificar logs do PostgreSQL (se disponível)
-- SHOW log_statement;
-- SHOW log_min_messages;