-- Verificar usuários sem perfil
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    u.created_at,
    'SEM PERFIL' as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- Contar total
SELECT COUNT(*) as total_usuarios_sem_perfil
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;