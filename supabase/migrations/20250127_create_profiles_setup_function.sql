-- Função RPC para configurar a tabela profiles
CREATE OR REPLACE FUNCTION setup_profiles_table()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Criar tabela profiles se não existir
  CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    company TEXT,
    role TEXT DEFAULT 'user',
    status TEXT DEFAULT 'active',
    permissions JSONB DEFAULT '["read", "write"]',
    avatar_url TEXT,
    entity_id UUID,
    department_id UUID,
    position TEXT,
    last_login TIMESTAMP WITH TIME ZONE,
    registration_type TEXT,
    entity_role TEXT,
    registration_completed BOOLEAN DEFAULT false,
    selected_plan_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Habilitar RLS
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

  -- Criar índices se não existirem
  CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
  CREATE INDEX IF NOT EXISTS idx_profiles_entity_id ON profiles(entity_id);
  CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
  CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

  -- Políticas RLS para profiles

  -- Política para SELECT: Usuários podem ver seus próprios perfis
  DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
  CREATE POLICY "Users can view profiles" ON profiles
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

  -- Política para INSERT: Usuários podem criar seus próprios perfis
  DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
  CREATE POLICY "Users can create their own profile" ON profiles
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

  -- Política para UPDATE: Usuários podem atualizar seus próprios perfis
  DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
  CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

  -- Política para DELETE: Usuários podem deletar seus próprios perfis (apenas admins)
  DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
  CREATE POLICY "Users can delete their own profile" ON profiles
  FOR DELETE 
  TO authenticated
  USING (auth.uid() = id AND role IN ('admin', 'super_admin'));

  -- Função para atualizar updated_at automaticamente
  CREATE OR REPLACE FUNCTION update_profiles_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- Trigger para atualizar updated_at
  DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
  CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profiles_updated_at();

  -- Grant permissions
  GRANT USAGE ON SCHEMA public TO authenticated;
  GRANT ALL ON profiles TO authenticated;
  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

  RETURN 'Tabela profiles configurada com sucesso';
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION setup_profiles_table() TO authenticated, service_role;
