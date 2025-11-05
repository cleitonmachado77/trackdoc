-- ========================================
-- ATIVAR USUÁRIOS QUE JÁ FORAM CONFIRMADOS
-- ========================================

-- Problema: Usuários têm email confirmado no auth.users mas perfil inativo

-- 1. Verificar usuários confirmados mas inativos
SELECT 
    p.id,
    p.email,
    p.status,
    p.registration_completed,
    au.email_confirmed_at,
    au.confirmed_at
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE (au.email_confirmed_at IS NOT NULL OR au.confirmed_at IS NOT NULL)
AND p.status != 'active';

-- 2. Ativar todos os usuários confirmados
UPDATE profiles 
SET 
    status = 'active',
    registration_completed = true,
    permissions = '["read", "write"]'::jsonb,
    updated_at = NOW()
FROM auth.users au
WHERE profiles.id = au.id
AND (au.email_confirmed_at IS NOT NULL OR au.confirmed_at IS NOT NULL)
AND profiles.status != 'active';

-- 3. Verificar resultado
SELECT 
    'Usuários ativados:' as resultado,
    COUNT(*) as quantidade
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE (au.email_confirmed_at IS NOT NULL OR au.confirmed_at IS NOT NULL)
AND p.status = 'active';

-- 4. Criar função para ativar automaticamente usuários confirmados
CREATE OR REPLACE FUNCTION activate_confirmed_users()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Ativar usuários confirmados
    UPDATE profiles 
    SET 
        status = 'active',
        registration_completed = true,
        permissions = '["read", "write"]'::jsonb,
        updated_at = NOW()
    FROM auth.users au
    WHERE profiles.id = au.id
    AND (au.email_confirmed_at IS NOT NULL OR au.confirmed_at IS NOT NULL)
    AND profiles.status != 'active';
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'activated_users', v_count,
        'message', 'Usuários confirmados ativados com sucesso'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Dar permissões
GRANT EXECUTE ON FUNCTION activate_confirmed_users TO service_role;

SELECT 'Correção aplicada! Usuários confirmados devem estar ativos agora.' as status;