-- ========================================
-- SOLUÇÃO FINAL SIMPLES - SEM BYPASS DE TRIGGERS
-- ========================================

-- Função que cria usuário diretamente (versão simplificada)
CREATE OR REPLACE FUNCTION create_user_entity_final(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_entity_id UUID,
  p_entity_role TEXT DEFAULT 'user',
  p_phone TEXT DEFAULT NULL,
  p_position TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_entity_exists BOOLEAN;
  v_encrypted_password TEXT;
BEGIN
  -- Verificar se a entidade existe
  SELECT EXISTS(SELECT 1 FROM entities WHERE id = p_entity_id) INTO v_entity_exists;
  
  IF NOT v_entity_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Entidade não encontrada'
    );
  END IF;
  
  -- Verificar se email já existe
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Este email já está cadastrado no sistema'
    );
  END IF;
  
  -- Verificar se email já existe em profiles
  IF EXISTS (SELECT 1 FROM profiles WHERE email = p_email) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Este email já está cadastrado no sistema'
    );
  END IF;
  
  -- Gerar ID único
  v_user_id := gen_random_uuid();
  
  -- Garantir que o ID é único
  WHILE EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id) LOOP
    v_user_id := gen_random_uuid();
  END LOOP;
  
  -- Criptografar senha
  v_encrypted_password := crypt(p_password, gen_salt('bf'));
  
  -- Inserir no auth.users (deixar triggers funcionarem)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    last_sign_in_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    p_email,
    v_encrypted_password,
    NOW(), -- Email já confirmado
    '',
    '',
    '',
    '',
    '{"provider": "email", "providers": ["email"]}',
    json_build_object(
      'full_name', p_full_name,
      'entity_id', p_entity_id,
      'entity_role', p_entity_role,
      'phone', p_phone,
      'position', p_position,
      'registration_type', 'entity_user'
    ),
    false,
    NOW(),
    NOW(),
    p_phone,
    CASE WHEN p_phone IS NOT NULL THEN NOW() ELSE NULL END,
    '',
    '',
    '',
    0,
    NULL,
    '',
    NULL,
    NULL
  );
  
  -- Aguardar um pouco para triggers processarem
  PERFORM pg_sleep(0.5);
  
  -- Verificar se perfil foi criado pelo trigger
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id) THEN
    -- Se não foi criado, criar manualmente
    INSERT INTO profiles (
      id,
      full_name,
      email,
      phone,
      role,
      status,
      permissions,
      entity_id,
      entity_role,
      position,
      registration_type,
      registration_completed,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      p_full_name,
      p_email,
      p_phone,
      'user',
      'active',
      '["read", "write"]'::jsonb,
      p_entity_id,
      p_entity_role,
      p_position,
      'entity_user',
      true,
      NOW(),
      NOW()
    );
  ELSE
    -- Se foi criado, atualizar com dados da entidade
    UPDATE profiles SET
      full_name = p_full_name,
      entity_id = p_entity_id,
      entity_role = p_entity_role,
      phone = p_phone,
      position = p_position,
      registration_type = 'entity_user',
      registration_completed = true,
      status = 'active',
      permissions = '["read", "write"]'::jsonb,
      updated_at = NOW()
    WHERE id = v_user_id;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'user_id', v_user_id,
    'message', 'Usuário criado com sucesso'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Dar permissões para service_role
GRANT EXECUTE ON FUNCTION create_user_entity_final TO service_role;

-- Garantir política RLS para service_role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Service role can manage all profiles'
  ) THEN
    CREATE POLICY "Service role can manage all profiles" ON profiles
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

SELECT 'Função final criada com sucesso!' as status;