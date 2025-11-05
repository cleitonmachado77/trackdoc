-- Correção para erro "Database error saving new user"
-- Este script corrige problemas comuns que impedem a criação de usuários

-- 1. Verificar e corrigir constraints da tabela profiles
ALTER TABLE profiles ALTER COLUMN registration_completed SET DEFAULT true;
ALTER TABLE profiles ALTER COLUMN status SET DEFAULT 'active';
ALTER TABLE profiles ALTER COLUMN permissions SET DEFAULT '["read", "write"]'::jsonb;

-- 2. Garantir que a função de trigger existe e está correta
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    role,
    status,
    permissions,
    entity_id,
    entity_role,
    registration_type,
    registration_completed,
    phone,
    position
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'user',
    'inactive', -- Será ativado após confirmação de email
    '["read"]'::jsonb,
    (NEW.raw_user_meta_data->>'entity_id')::UUID,
    COALESCE(NEW.raw_user_meta_data->>'entity_role', 'user'),
    COALESCE(NEW.raw_user_meta_data->>'registration_type', 'entity_user'),
    false, -- Será true após confirmação
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'position'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    email = EXCLUDED.email,
    entity_id = COALESCE(EXCLUDED.entity_id, profiles.entity_id),
    entity_role = COALESCE(EXCLUDED.entity_role, profiles.entity_role),
    registration_type = COALESCE(EXCLUDED.registration_type, profiles.registration_type),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    position = COALESCE(EXCLUDED.position, profiles.position),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Verificar se a tabela entity_invitations existe
CREATE TABLE IF NOT EXISTS entity_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  entity_role TEXT DEFAULT 'user',
  status TEXT DEFAULT 'pending',
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- 5. Garantir que as políticas RLS estão corretas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção de perfis
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;
CREATE POLICY "Allow profile creation" ON profiles
FOR INSERT 
TO authenticated, service_role
WITH CHECK (true);

-- Política para permitir leitura de perfis da mesma entidade
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
CREATE POLICY "Users can view profiles" ON profiles
FOR SELECT 
TO authenticated
USING (
  auth.uid() = id OR 
  (entity_id IS NOT NULL AND entity_id = (SELECT entity_id FROM profiles WHERE id = auth.uid()))
);

-- Política para permitir atualização de perfis
DROP POLICY IF EXISTS "Users can update profiles" ON profiles;
CREATE POLICY "Users can update profiles" ON profiles
FOR UPDATE 
TO authenticated, service_role
USING (
  auth.uid() = id OR 
  (entity_id IS NOT NULL AND entity_id = (SELECT entity_id FROM profiles WHERE id = auth.uid()))
);

-- 6. Grants necessários
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT ALL ON profiles TO authenticated, service_role;
GRANT ALL ON entities TO authenticated, service_role;
GRANT ALL ON entity_invitations TO authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- 7. Verificação final
SELECT 'Correções aplicadas com sucesso!' as status;

-- Verificar se a função está funcionando
SELECT 
  'Trigger configurado corretamente' as trigger_status,
  COUNT(*) as total_triggers
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';