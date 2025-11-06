-- Substitua 'seu@email.com' pelo email do usuário com problema
SELECT manual_confirm_and_activate_user_v2('seu@email.com');

-- Verificar se foi corrigido
SELECT 
    u.email,
    u.email_confirmed_at,
    p.status,
    p.registration_completed
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'seu@email.com';