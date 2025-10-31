-- ========================================
-- CRIAÇÃO DE FUNÇÕES PARA DEPARTAMENTOS
-- ========================================

-- Verificar se a tabela user_departments existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_departments') THEN
        -- Criar tabela user_departments se não existir
        CREATE TABLE user_departments (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
            role_in_department TEXT DEFAULT 'member',
            is_primary BOOLEAN DEFAULT false,
            assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            assigned_by UUID REFERENCES profiles(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            -- Garantir que um usuário não seja adicionado duas vezes ao mesmo departamento
            UNIQUE(user_id, department_id)
        );

        -- Criar índices para performance
        CREATE INDEX idx_user_departments_user_id ON user_departments(user_id);
        CREATE INDEX idx_user_departments_department_id ON user_departments(department_id);
        CREATE INDEX idx_user_departments_is_primary ON user_departments(is_primary);

        -- Habilitar RLS
        ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;

        -- Política para permitir que usuários vejam apenas dados da sua entidade
        CREATE POLICY "Users can view user_departments from their entity" ON user_departments
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM profiles p1 
                    WHERE p1.id = user_id 
                    AND p1.entity_id = (
                        SELECT p2.entity_id FROM profiles p2 WHERE p2.id = auth.uid()
                    )
                )
            );

        -- Política para permitir inserção apenas na própria entidade
        CREATE POLICY "Users can insert user_departments in their entity" ON user_departments
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM profiles p1 
                    WHERE p1.id = user_id 
                    AND p1.entity_id = (
                        SELECT p2.entity_id FROM profiles p2 WHERE p2.id = auth.uid()
                    )
                )
            );

        -- Política para permitir atualização apenas na própria entidade
        CREATE POLICY "Users can update user_departments in their entity" ON user_departments
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM profiles p1 
                    WHERE p1.id = user_id 
                    AND p1.entity_id = (
                        SELECT p2.entity_id FROM profiles p2 WHERE p2.id = auth.uid()
                    )
                )
            );

        -- Política para permitir exclusão apenas na própria entidade
        CREATE POLICY "Users can delete user_departments in their entity" ON user_departments
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM profiles p1 
                    WHERE p1.id = user_id 
                    AND p1.entity_id = (
                        SELECT p2.entity_id FROM profiles p2 WHERE p2.id = auth.uid()
                    )
                )
            );

        RAISE NOTICE 'Tabela user_departments criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela user_departments já existe';
    END IF;
END
$$;

-- ========================================
-- FUNÇÃO: add_user_to_department
-- ========================================
CREATE OR REPLACE FUNCTION add_user_to_department(
    p_user_id UUID,
    p_department_id UUID,
    p_role_in_department TEXT DEFAULT 'member',
    p_is_primary BOOLEAN DEFAULT false,
    p_assigned_by UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
    v_user_entity_id UUID;
    v_department_entity_id UUID;
    v_current_user_entity_id UUID;
BEGIN
    -- Verificar se o usuário atual está autenticado
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Buscar entity_id do usuário atual
    SELECT entity_id INTO v_current_user_entity_id
    FROM profiles 
    WHERE id = auth.uid();

    -- Buscar entity_id do usuário a ser adicionado
    SELECT entity_id INTO v_user_entity_id
    FROM profiles 
    WHERE id = p_user_id;

    -- Buscar entity_id do departamento
    SELECT entity_id INTO v_department_entity_id
    FROM departments 
    WHERE id = p_department_id;

    -- Verificar se todos pertencem à mesma entidade
    IF v_user_entity_id != v_current_user_entity_id OR 
       v_department_entity_id != v_current_user_entity_id THEN
        RAISE EXCEPTION 'Usuário e departamento devem pertencer à mesma entidade';
    END IF;

    -- Inserir ou atualizar o relacionamento
    INSERT INTO user_departments (
        user_id,
        department_id,
        role_in_department,
        is_primary,
        assigned_by,
        assigned_at
    ) VALUES (
        p_user_id,
        p_department_id,
        p_role_in_department,
        p_is_primary,
        COALESCE(p_assigned_by, auth.uid()),
        NOW()
    )
    ON CONFLICT (user_id, department_id) 
    DO UPDATE SET
        role_in_department = EXCLUDED.role_in_department,
        is_primary = EXCLUDED.is_primary,
        assigned_by = EXCLUDED.assigned_by,
        updated_at = NOW();

    -- Retornar resultado
    SELECT json_build_object(
        'success', true,
        'message', 'Usuário adicionado ao departamento com sucesso',
        'user_id', p_user_id,
        'department_id', p_department_id
    ) INTO v_result;

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'user_id', p_user_id,
            'department_id', p_department_id
        );
END;
$$;

-- ========================================
-- FUNÇÃO: remove_user_from_department
-- ========================================
CREATE OR REPLACE FUNCTION remove_user_from_department(
    p_user_id UUID,
    p_department_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
    v_user_entity_id UUID;
    v_department_entity_id UUID;
    v_current_user_entity_id UUID;
    v_rows_affected INTEGER;
BEGIN
    -- Verificar se o usuário atual está autenticado
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Buscar entity_id do usuário atual
    SELECT entity_id INTO v_current_user_entity_id
    FROM profiles 
    WHERE id = auth.uid();

    -- Buscar entity_id do usuário a ser removido
    SELECT entity_id INTO v_user_entity_id
    FROM profiles 
    WHERE id = p_user_id;

    -- Buscar entity_id do departamento
    SELECT entity_id INTO v_department_entity_id
    FROM departments 
    WHERE id = p_department_id;

    -- Verificar se todos pertencem à mesma entidade
    IF v_user_entity_id != v_current_user_entity_id OR 
       v_department_entity_id != v_current_user_entity_id THEN
        RAISE EXCEPTION 'Usuário e departamento devem pertencer à mesma entidade';
    END IF;

    -- Remover o relacionamento
    DELETE FROM user_departments 
    WHERE user_id = p_user_id AND department_id = p_department_id;

    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

    -- Verificar se o usuário era gerente do departamento e remover se necessário
    UPDATE departments 
    SET manager_id = NULL 
    WHERE id = p_department_id AND manager_id = p_user_id;

    -- Retornar resultado
    SELECT json_build_object(
        'success', true,
        'message', CASE 
            WHEN v_rows_affected > 0 THEN 'Usuário removido do departamento com sucesso'
            ELSE 'Usuário não estava no departamento'
        END,
        'user_id', p_user_id,
        'department_id', p_department_id,
        'rows_affected', v_rows_affected
    ) INTO v_result;

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'user_id', p_user_id,
            'department_id', p_department_id
        );
END;
$$;

-- ========================================
-- FUNÇÃO: get_department_employees
-- ========================================
CREATE OR REPLACE FUNCTION get_department_employees(p_department_id UUID)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    email TEXT,
    role TEXT,
    entity_id UUID,
    role_in_department TEXT,
    is_primary BOOLEAN,
    assigned_at TIMESTAMP WITH TIME ZONE,
    is_manager BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_user_entity_id UUID;
    v_department_entity_id UUID;
    v_manager_id UUID;
BEGIN
    -- Verificar se o usuário atual está autenticado
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Buscar entity_id do usuário atual
    SELECT p.entity_id INTO v_current_user_entity_id
    FROM profiles p 
    WHERE p.id = auth.uid();

    -- Buscar entity_id e manager_id do departamento
    SELECT d.entity_id, d.manager_id INTO v_department_entity_id, v_manager_id
    FROM departments d 
    WHERE d.id = p_department_id;

    -- Verificar se o departamento pertence à mesma entidade
    IF v_department_entity_id != v_current_user_entity_id THEN
        RAISE EXCEPTION 'Departamento não pertence à sua entidade';
    END IF;

    -- Retornar funcionários do departamento
    RETURN QUERY
    SELECT 
        p.id as user_id,
        p.full_name,
        p.email,
        p.role,
        p.entity_id,
        ud.role_in_department,
        ud.is_primary,
        ud.assigned_at,
        (p.id = v_manager_id) as is_manager
    FROM profiles p
    INNER JOIN user_departments ud ON p.id = ud.user_id
    WHERE ud.department_id = p_department_id
      AND p.entity_id = v_current_user_entity_id
    ORDER BY p.full_name;
END;
$$;

-- ========================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ========================================
COMMENT ON FUNCTION add_user_to_department IS 'Adiciona um usuário a um departamento com validação de entidade';
COMMENT ON FUNCTION remove_user_from_department IS 'Remove um usuário de um departamento com validação de entidade';
COMMENT ON FUNCTION get_department_employees IS 'Retorna todos os funcionários de um departamento com informações completas';

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================
SELECT 
    'Funções criadas com sucesso!' as status,
    COUNT(*) as total_funcoes
FROM information_schema.routines 
WHERE routine_name IN ('add_user_to_department', 'remove_user_from_department', 'get_department_employees')
  AND routine_schema = 'public';