-- Correção para ativar usuários que confirmaram email mas ainda estão com status inactive
-- Este script identifica e corrige usuários que:
-- 1. Têm status 'inactive' na tabela profiles
-- 2. Mas já confirmaram o email no auth.users (email_confirmed_at não é null)

-- Primeiro, vamos verificar quantos usuários estão nesta situação
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.status as profile_status,
    p.registration_completed,
    au.email_confirmed_at,
    au.confirmed_at,
    CASE 
        WHEN au.email_confirmed_at IS NOT NULL THEN 'Email confirmado'
        WHEN au.confirmed_at IS NOT NULL THEN 'Usuário confirmado'
        ELSE 'Não confirmado'
    END as auth_status
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE p.status = 'inactive'
    AND (au.email_confirmed_at IS NOT NULL OR au.confirmed_at IS NOT NULL);

-- Agora vamos corrigir estes usuários, ativando-os automaticamente
UPDATE profiles 
SET 
    status = 'active',
    registration_completed = true,
    permissions = COALESCE(permissions, '["read", "write"]'::jsonb),
    updated_at = NOW()
WHERE id IN (
    SELECT p.id
    FROM profiles p
    JOIN auth.users au ON p.id = au.id
    WHERE p.status = 'inactive'
        AND (au.email_confirmed_at IS NOT NULL OR au.confirmed_at IS NOT NULL)
);

-- Verificar o resultado da correção
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.status as profile_status,
    p.registration_completed,
    p.updated_at,
    au.email_confirmed_at
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE p.id IN (
    SELECT p2.id
    FROM profiles p2
    JOIN auth.users au2 ON p2.id = au2.id
    WHERE (au2.email_confirmed_at IS NOT NULL OR au2.confirmed_at IS NOT NULL)
        AND p2.entity_id IS NOT NULL
)
ORDER BY p.updated_at DESC;

-- Atualizar contadores das entidades afetadas
UPDATE entities 
SET 
    current_users = (
        SELECT COUNT(*)
        FROM profiles 
        WHERE entity_id = entities.id 
            AND status = 'active'
    ),
    updated_at = NOW()
WHERE id IN (
    SELECT DISTINCT entity_id
    FROM profiles
    WHERE entity_id IS NOT NULL
        AND status = 'active'
);

-- Verificar contadores atualizados
SELECT 
    e.id,
    e.name,
    e.current_users,
    COUNT(p.id) as usuarios_ativos_real
FROM entities e
LEFT JOIN profiles p ON e.id = p.entity_id AND p.status = 'active'
GROUP BY e.id, e.name, e.current_users
ORDER BY e.name;