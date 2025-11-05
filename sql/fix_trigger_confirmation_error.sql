-- ========================================
-- CORREÇÃO DO ERRO DE CONFIRMAÇÃO DE USUÁRIO
-- ========================================

-- O erro "Error confirming user" indica que há um problema no trigger
-- que processa novos usuários. Vamos investigar e corrigir.

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

-- 2. Verificar se há função handle_new_user problemática
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%handle_new_user%';

-- 3. SOLUÇÃO TEMPORÁRIA: Desabilitar trigger problemático
-- (Execute apenas se identificar o trigger problemático)
/*
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
*/

-- 4. Criar função de confirmação manual mais robusta
CREATE OR REPLACE FUNCTION manual_confirm_and_activate_user(
  p_email TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_user RECORD;
  v_profile RECORD;
  v_result JSON;
BEGIN
  -- Buscar usuário no auth.users
  SELECT * INTO v_auth_user
  FROM auth.users 
  WHERE email = p_email;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não encontrado no auth.users'
    );
  END IF;
  
  -- Verificar se já está confirmado
  IF v_auth_user.email_confirmed_at IS NOT NULL THEN
    -- Buscar perfil
    SELECT * INTO v_profile
    FROM profiles 
    WHERE id = v_auth_user.id;
    
    IF FOUND THEN
      -- Ativar perfil se necessário
      IF v_profile.status != 'active' THEN
        UPDATE profiles 
        SET 
          status = 'active',
          registration_completed = true,
          permissions = '["read", "write"]'::jsonb,
          updated_at = NOW()
        WHERE id = v_auth_user.id;
        
        RETURN json_build_object(
          'success', true,
          'message', 'Usuário já confirmado, perfil ativado',
          'user_id', v_auth_user.id,
          'action', 'profile_activated'
        );
      ELSE
        RETURN json_build_object(
          'success', true,
          'message', 'Usuário já confirmado e ativo',
          'user_id', v_auth_user.id,
          'action', 'already_active'
        );
      END IF;
    ELSE
      -- Criar perfil se não existir
      INSERT INTO profiles (
        id,
        full_name,
        email,
        role,
        status,
        permissions,
        registration_type,
        registration_completed,
        created_at,
        updated_at
      ) VALUES (
        v_auth_user.id,
        COALESCE(v_auth_user.raw_user_meta_data->>'full_name', split_part(v_auth_user.email, '@', 1)),
        v_auth_user.email,
        'user',
        'active',
        '["read", "write"]'::jsonb,
        COALESCE(v_auth_user.raw_user_meta_data->>'registration_type', 'individual'),
        true,
        NOW(),
        NOW()
      );
      
      RETURN json_build_object(
        'success', true,
        'message', 'Usuário confirmado, perfil criado e ativado',
        'user_id', v_auth_user.id,
        'action', 'profile_created_and_activated'
      );
    END IF;
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'Email ainda não foi confirmado no auth.users'
    );
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Dar permissões
GRANT EXECUTE ON FUNCTION manual_confirm_and_activate_user TO service_role;

-- 5. Função para forçar confirmação de email (apenas para testes)
CREATE OR REPLACE FUNCTION force_confirm_user_email(
  p_email TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Buscar ID do usuário
  SELECT id INTO v_user_id
  FROM auth.users 
  WHERE email = p_email;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não encontrado'
    );
  END IF;
  
  -- Forçar confirmação de email
  UPDATE auth.users 
  SET 
    email_confirmed_at = NOW(),
    updated_at = NOW()
  WHERE id = v_user_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Email confirmado forçadamente',
    'user_id', v_user_id
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
GRANT EXECUTE ON FUNCTION force_confirm_user_email TO service_role;

SELECT 'Funções de correção criadas com sucesso!' as status;