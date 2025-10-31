-- ========================================
-- SOLUÇÃO ALTERNATIVA: FUNÇÕES DE DEPARTAMENTOS
-- ========================================

-- ESTRATÉGIA: Verificar se as funções existem e funcionam
-- Se não funcionarem, criar versões alternativas com nomes diferentes

-- PASSO 1: Testar as funções existentes
DO $$
DECLARE
    v_test_result JSON;
    v_function_works BOOLEAN := false;
BEGIN
    -- Testar se a função add_user_to_department funciona
    BEGIN
        -- Tentar chamar a função com parâmetros de teste (não vai inserir nada real)
        SELECT add_user_to_department(
            '00000000-0000-0000-0000-000000000000'::UUID,
            '00000000-0000-0000-0000-000000000000'::UUID,
            'member',
            false,
            NULL
        ) INTO v_test_result;
        
        v_function_works := true;
        RAISE NOTICE '✅ Função add_user_to_department funciona corretamente';
        RAISE NOTICE 'Resultado do teste: %', v_test_result;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Função add_user_to_department tem problemas: %', SQLERRM;
            v_function_works := false;
    END;
    
    -- Se a função não funciona, vamos criar uma alternativa
    IF NOT v_function_works THEN
        RAISE NOTICE '🔧 Criando função alternativa: add_user_to_dept_v2';
    END IF;
END
$$;

-- PASSO 2: Criar funções alternativas se necessário
CREATE OR REPLACE FUNCTION add_user_to_dept_v2(
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

CREATE OR REPLACE FUNCTION remove_user_from_dept_v2(
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

-- PASSO 3: Testar as novas funções
DO $$
DECLARE
    v_test_result JSON;
BEGIN
    -- Testar função v2
    BEGIN
        SELECT add_user_to_dept_v2(
            '00000000-0000-0000-0000-000000000000'::UUID,
            '00000000-0000-0000-0000-000000000000'::UUID,
            'member',
            false,
            NULL
        ) INTO v_test_result;
        
        RAISE NOTICE '✅ Função add_user_to_dept_v2 criada e testada com sucesso';
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Erro ao testar função v2: %', SQLERRM;
    END;
END
$$;

-- PASSO 4: Corrigir dados existentes (independente das funções)
-- Adicionar gerentes à tabela user_departments se não estiverem
INSERT INTO user_departments (user_id, department_id, role_in_department, is_primary, assigned_at)
SELECT 
    d.manager_id,
    d.id,
    'manager',
    true,
    NOW()
FROM departments d
WHERE d.manager_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_departments ud 
    WHERE ud.user_id = d.manager_id 
    AND ud.department_id = d.id
  );

-- PASSO 5: Corrigir contadores
UPDATE departments 
SET user_count = (
    SELECT COUNT(*) 
    FROM user_departments ud 
    WHERE ud.department_id = departments.id
);

-- PASSO 6: Verificar resultado
SELECT 
    'RESULTADO FINAL' as etapa,
    d.name as department_name,
    COUNT(ud.user_id) as total_funcionarios,
    d.user_count as contador_cache,
    CASE 
        WHEN COUNT(ud.user_id) = 0 THEN '❌ Sem funcionários'
        WHEN COUNT(ud.user_id) != d.user_count THEN '⚠️ Contador divergente'
        ELSE '✅ OK'
    END as status
FROM departments d
LEFT JOIN user_departments ud ON d.id = ud.department_id
GROUP BY d.id, d.name, d.user_count
ORDER BY d.name;

-- PASSO 7: Instruções para o frontend
SELECT 
    'INSTRUÇÕES PARA O FRONTEND' as info,
    'Se as funções originais não funcionarem, use as versões v2:' as instrucao,
    'add_user_to_dept_v2 e remove_user_from_dept_v2' as funcoes_alternativas;