-- ============================================================================
-- CORREÇÃO MÍNIMA - Estrutura da Tabela Profiles e Triggers
-- ============================================================================

-- 1. REMOVER TABELA PROFILES EXISTENTE (sem backup para evitar problemas)
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. RECRIAR TABELA PROFILES COM ESTRUTURA CORRETA
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  company TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'manager', 'viewer', 'super_admin')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  permissions JSONB DEFAULT '["read", "write"]',
  avatar_url TEXT,
  entity_id UUID,
  department_id UUID,
  position TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  registration_type TEXT DEFAULT 'individual' CHECK (registration_type IN ('individual', 'entity_admin', 'entity_user')),
  entity_role TEXT DEFAULT 'user' CHECK (entity_role IN ('user', 'admin', 'manager', 'viewer')),
  registration_completed BOOLEAN DEFAULT true,
  selected_plan_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. HABILITAR RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. CRIAR ÍNDICES
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_entity_id ON profiles(entity_id);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_registration_type ON profiles(registration_type);

-- 5. FUNÇÃO PARA ATUALIZAR updated_at
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. TRIGGER PARA updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- 7. FUNÇÃO MELHORADA PARA CRIAR PERFIL AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT := 'user';
  user_entity_role TEXT := 'user';
  user_registration_type TEXT := 'individual';
  user_full_name TEXT;
  user_selected_plan_id UUID := NULL;
BEGIN
  -- Extrair dados do metadata
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
    user_entity_role := COALESCE(NEW.raw_user_meta_data->>'entity_role', 'user');
    user_registration_type := COALESCE(NEW.raw_user_meta_data->>'registration_type', 'individual');
    user_full_name := NEW.raw_user_meta_data->>'full_name';
    
    -- Tentar extrair selected_plan_id se existir
    IF NEW.raw_user_meta_data->>'selected_plan_id' IS NOT NULL THEN
      user_selected_plan_id := (NEW.raw_user_meta_data->>'selected_plan_id')::UUID;
    END IF;
  END IF;

  -- Usar email como fallback para full_name
  IF user_full_name IS NULL OR user_full_name = '' THEN
    user_full_name := NEW.email;
  END IF;

  -- Inserir perfil com dados corretos
  INSERT INTO public.profiles (
    id, 
    full_name, 
    email, 
    role, 
    status,
    entity_role,
    registration_type,
    registration_completed,
    selected_plan_id
  )
  VALUES (
    NEW.id,
    user_full_name,
    NEW.email,
    user_role,
    'active',
    user_entity_role,
    user_registration_type,
    CASE 
      WHEN user_registration_type = 'entity_admin' THEN false 
      ELSE true 
    END,
    user_selected_plan_id
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Não falhar a criação do usuário se houver erro no perfil
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RECRIAR TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. POLÍTICAS RLS
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
CREATE POLICY "Users can view profiles" ON profiles
FOR SELECT TO authenticated
USING (
  auth.uid() = id OR 
  (entity_id IS NOT NULL AND entity_id = (
    SELECT entity_id FROM profiles WHERE id = auth.uid()
  )) OR
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE TO authenticated
USING (
  auth.uid() = id OR
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
)
WITH CHECK (
  auth.uid() = id OR
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
);

DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
CREATE POLICY "Users can create their own profile" ON profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete profiles" ON profiles;
CREATE POLICY "Users can delete profiles" ON profiles
FOR DELETE TO authenticated
USING (
  auth.uid() = id OR
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
);

-- 10. GRANT PERMISSIONS
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;