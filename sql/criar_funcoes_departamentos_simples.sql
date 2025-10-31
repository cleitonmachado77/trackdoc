-- ========================================
-- CRIAÇÃO DAS FUNÇÕES PARA DEPARTAMENTOS
-- ========================================

-- FUNÇÃO: add_user_to_department
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
BEGIN
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
        assigned_at = NOW();

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

-- FUNÇÃO: remove_user_from_department
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
    v_rows_affected INTEGER;
BEGIN
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

-- Verificar se as funções foram criadas
SELECT 
    'Funções criadas com sucesso!' as status,
    routine_name
FROM information_schema.routines 
WHERE routine_name IN ('add_user_to_department', 'remove_user_from_department')
  AND routine_schema = 'public';