-- ========================================
-- SOLUÇÃO COMPLETA: FUNCIONÁRIOS DOS DEPARTAMENTOS
-- ========================================

-- PROBLEMA IDENTIFICADO:
-- 1. Funções SQL add_user_to_department e remove_user_from_department não existiam
-- 2. Gerentes não estavam na tabela user_departments
-- 3. Contadores de funcionários desatualizados
-- 4. Possíveis problemas de isolamento por entidade

-- PASSO 1: Criar as funções SQL necessárias
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

    SELECT json_build_object(
        'success', true,
        'message', 'Usuário adicionado ao departamento com sucesso'
    ) INTO v_result;

    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

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
    DELETE FROM user_departments 
    WHERE user_id = p_user_id AND department_id = p_department_id;

    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

    -- Se o usuário era gerente, remover da tabela departments
    UPDATE departments 
    SET manager_id = NULL 
    WHERE id = p_department_id AND manager_id = p_user_id;

    SELECT json_build_object(
        'success', true,
        'message', 'Usuário removido do departamento com sucesso',
        'rows_affected', v_rows_affected
    ) INTO v_result;

    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- PASSO 2: Adicionar gerentes à tabela user_departments
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

-- PASSO 3: Corrigir contadores de funcionários
UPDATE departments 
SET user_count = (
    SELECT COUNT(*) 
    FROM user_departments ud 
    WHERE ud.department_id = departments.id
);

-- PASSO 4: Remover relacionamentos com entidades diferentes (limpeza)
DELETE FROM user_departments 
WHERE id IN (
    SELECT ud.id
    FROM user_departments ud
    JOIN profiles p ON ud.user_id = p.id
    JOIN departments d ON ud.department_id = d.id
    WHERE p.entity_id != d.entity_id
);

-- PASSO 5: Verificar resultado final
SELECT 
    'VERIFICAÇÃO FINAL' as etapa,
    d.name as department_name,
    d.entity_id,
    COUNT(ud.user_id) as total_funcionarios,
    d.user_count as contador_cache,
    CASE 
        WHEN COUNT(ud.user_id) = 0 THEN '❌ Sem funcionários'
        WHEN COUNT(ud.user_id) != d.user_count THEN '⚠️ Contador divergente'
        ELSE '✅ OK'
    END as status,
    STRING_AGG(p.full_name, ', ' ORDER BY p.full_name) as funcionarios
FROM departments d
LEFT JOIN user_departments ud ON d.id = ud.department_id
LEFT JOIN profiles p ON ud.user_id = p.id
GROUP BY d.id, d.name, d.entity_id, d.user_count
ORDER BY d.name;

-- PASSO 6: Verificar funções criadas
SELECT 
    'FUNÇÕES CRIADAS' as verificacao,
    routine_name,
    '✅ Função disponível' as status
FROM information_schema.routines 
WHERE routine_name IN ('add_user_to_department', 'remove_user_from_department')
  AND routine_schema = 'public';

-- RESUMO DA SOLUÇÃO:
-- ✅ Funções SQL criadas
-- ✅ Gerentes adicionados à tabela user_departments  
-- ✅ Contadores atualizados
-- ✅ Isolamento por entidade verificado
-- ✅ Modal de funcionários deve funcionar agora