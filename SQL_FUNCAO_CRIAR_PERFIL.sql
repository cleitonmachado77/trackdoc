-- 🔧 Função para criar perfil de usuário com privilégios elevados
-- Esta função roda com SECURITY DEFINER (privilégios do criador)

CREATE OR REPLACE FUNCTION create_entity_user_profile(
  user_id UUID,
  user_email TEXT,
  full_name TEXT,
  entity_id UUID,
  entity_role TEXT DEFAULT 'user',
  phone TEXT DEFAULT NULL,
  position TEXT DEFAULT NULL
) 
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Roda com privilégios do criador (bypass RLS)
AS $$
DECLARE
  result JSON;
  admin_entity_id UUID;
BEGIN
  -- Verificar se o usuário logado é admin da entidade
  SELECT e.id INTO admin_entity_id
  FROM profiles p
  JOIN entities e ON e.admin_user_id = p.id
  WHERE p.id = auth.uid() AND e.id = entity_id;
  
  -- Se não é admin da entidade, retornar erro
  IF admin_entity_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não é admin desta entidade'
    );
  END IF;
  
  -- Verificar se perfil já existe
  IF EXISTS (SELECT 1 FROM profiles WHERE id = user_id) THEN
    -- Atualizar perfil existente
    UPDATE profiles SET
      full_name = create_entity_user_profile.full_name,
      email = user_email,
      entity_id = create_entity_user_profile.entity_id,
      entity_role = create_entity_user_profile.entity_role,
      phone = create_entity_user_profile.phone,
      position = create_entity_user_profile.position,
      registration_type = 'entity_user',
      registration_completed = true,
      status = 'active',
      updated_at = NOW()
    WHERE id = user_id;
    
    result := json_build_object(
      'success', true,
      'action', 'updated',
      'user_id', user_id
    );
  ELSE
    -- Criar novo perfil
    INSERT INTO profiles (
      id, full_name, email, entity_id, entity_role, phone, position,
      registration_type, registration_completed, status, role, permissions,
      created_at, updated_at
    ) VALUES (
      user_id, full_name, user_email, entity_id, entity_role, phone, position,
      'entity_user', true, 'active', 'user', '["read", "write"]'::jsonb,
      NOW(), NOW()
    );
    
    result := json_build_object(
      'success', true,
      'action', 'created',
      'user_id', user_id
    );
  END IF;
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Dar permissão para usuários autenticados executarem a função
GRANT EXECUTE ON FUNCTION create_entity_user_profile TO authenticated;