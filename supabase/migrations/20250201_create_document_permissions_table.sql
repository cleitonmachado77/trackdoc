-- Criar tabela de permissões de documentos
CREATE TABLE IF NOT EXISTS document_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  permission_type TEXT NOT NULL CHECK (permission_type IN ('read', 'edit', 'upload', 'sign', 'download', 'approve', 'reject')),
  granted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir que pelo menos um de department_id ou user_id seja especificado
  CONSTRAINT check_permission_target CHECK (
    (department_id IS NOT NULL AND user_id IS NULL) OR 
    (department_id IS NULL AND user_id IS NOT NULL)
  ),
  
  -- Evitar permissões duplicadas
  UNIQUE(document_id, department_id, user_id, permission_type)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_document_permissions_document_id ON document_permissions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_permissions_department_id ON document_permissions(department_id);
CREATE INDEX IF NOT EXISTS idx_document_permissions_user_id ON document_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_document_permissions_permission_type ON document_permissions(permission_type);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_document_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_document_permissions_updated_at_trigger
  BEFORE UPDATE ON document_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_document_permissions_updated_at();

-- Função para verificar permissões de documento
CREATE OR REPLACE FUNCTION check_document_permission(
  p_document_id UUID,
  p_user_id UUID,
  p_permission_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  has_permission BOOLEAN := FALSE;
  user_departments UUID[];
  user_primary_dept UUID;
BEGIN
  -- Verificar permissão direta do usuário
  SELECT EXISTS(
    SELECT 1 FROM document_permissions 
    WHERE document_id = p_document_id 
    AND user_id = p_user_id 
    AND permission_type = p_permission_type
    AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO has_permission;
  
  IF has_permission THEN
    RETURN TRUE;
  END IF;
  
  -- Buscar departamento primário do usuário (da tabela profiles)
  SELECT department_id INTO user_primary_dept
  FROM profiles 
  WHERE id = p_user_id;
  
  -- Buscar departamentos adicionais do usuário (da tabela user_departments)
  SELECT ARRAY_AGG(department_id) INTO user_departments
  FROM user_departments 
  WHERE user_id = p_user_id;
  
  -- Combinar departamento primário com departamentos adicionais
  IF user_primary_dept IS NOT NULL THEN
    user_departments := COALESCE(user_departments, ARRAY[]::UUID[]) || user_primary_dept;
  END IF;
  
  -- Verificar permissão por departamento
  IF user_departments IS NOT NULL AND array_length(user_departments, 1) > 0 THEN
    SELECT EXISTS(
      SELECT 1 FROM document_permissions 
      WHERE document_id = p_document_id 
      AND department_id = ANY(user_departments)
      AND permission_type = p_permission_type
      AND (expires_at IS NULL OR expires_at > NOW())
    ) INTO has_permission;
  END IF;
  
  RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas RLS
ALTER TABLE document_permissions ENABLE ROW LEVEL SECURITY;

-- Política para leitura: usuários podem ver permissões de documentos que eles têm acesso
CREATE POLICY "Users can view document permissions they have access to" ON document_permissions
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() = granted_by OR
    department_id IN (
      SELECT department_id FROM user_departments WHERE user_id = auth.uid()
    ) OR
    document_id IN (
      SELECT id FROM documents WHERE author_id = auth.uid()
    )
  );

-- Política para inserção: apenas autores do documento ou admins podem conceder permissões
CREATE POLICY "Document authors can grant permissions" ON document_permissions
  FOR INSERT WITH CHECK (
    auth.uid() = granted_by AND (
      EXISTS(SELECT 1 FROM documents WHERE id = document_id AND author_id = auth.uid()) OR
      EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'entity_admin'))
    )
  );

-- Política para atualização: apenas quem concedeu a permissão pode atualizá-la
CREATE POLICY "Permission granters can update permissions" ON document_permissions
  FOR UPDATE USING (auth.uid() = granted_by);

-- Política para exclusão: apenas quem concedeu a permissão pode revogá-la
CREATE POLICY "Permission granters can revoke permissions" ON document_permissions
  FOR DELETE USING (auth.uid() = granted_by);

-- Conceder permissões
GRANT ALL ON document_permissions TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;