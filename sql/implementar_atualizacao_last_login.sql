-- ========================================
-- IMPLEMENTAR: ATUALIZAÇÃO AUTOMÁTICA DE LAST_LOGIN
-- ========================================

-- PROBLEMA: O campo last_login não está sendo atualizado automaticamente
-- SOLUÇÃO: Criar função RPC para atualizar last_login no processo de autenticação

-- 1. Função para atualizar last_login do usuário atual
CREATE OR REPLACE FUNCTION update_user_last_login()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
    v_user_id UUID;
BEGIN
    -- Verificar se o usuário está autenticado
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não autenticado'
        );
    END IF;

    -- Atualizar last_login do usuário
    UPDATE profiles 
    SET 
        last_login = NOW(),
        updated_at = NOW()
    WHERE id = v_user_id;

    -- Verificar se a atualização foi bem-sucedida
    IF FOUND THEN
        SELECT json_build_object(
            'success', true,
            'message', 'Last login atualizado com sucesso',
            'user_id', v_user_id,
            'last_login', NOW()
        ) INTO v_result;
    ELSE
        SELECT json_build_object(
            'success', false,
            'error', 'Usuário não encontrado na tabela profiles',
            'user_id', v_user_id
        ) INTO v_result;
    END IF;

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'user_id', v_user_id
        );
END;
$$;

-- 2. Função para atualizar last_login de um usuário específico (para admins)
CREATE OR REPLACE FUNCTION update_user_last_login_admin(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
    v_current_user_id UUID;
    v_current_user_role TEXT;
BEGIN
    -- Verificar se o usuário atual está autenticado
    v_current_user_id := auth.uid();
    
    IF v_current_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não autenticado'
        );
    END IF;

    -- Verificar se o usuário atual é admin
    SELECT role INTO v_current_user_role
    FROM profiles 
    WHERE id = v_current_user_id;

    IF v_current_user_role NOT IN ('admin', 'super_admin') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Permissão negada: apenas administradores podem atualizar last_login de outros usuários'
        );
    END IF;

    -- Atualizar last_login do usuário especificado
    UPDATE profiles 
    SET 
        last_login = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Verificar se a atualização foi bem-sucedida
    IF FOUND THEN
        SELECT json_build_object(
            'success', true,
            'message', 'Last login atualizado com sucesso',
            'user_id', p_user_id,
            'last_login', NOW(),
            'updated_by', v_current_user_id
        ) INTO v_result;
    ELSE
        SELECT json_build_object(
            'success', false,
            'error', 'Usuário não encontrado na tabela profiles',
            'user_id', p_user_id
        ) INTO v_result;
    END IF;

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'user_id', p_user_id,
            'updated_by', v_current_user_id
        );
END;
$$;

-- 3. Atualizar last_login de todos os usuários que não têm (dados históricos)
UPDATE profiles 
SET last_login = created_at
WHERE last_login IS NULL;

-- 4. Verificar resultado
SELECT 
    'VERIFICAÇÃO APÓS ATUALIZAÇÃO' as categoria,
    COUNT(*) as total_usuarios,
    COUNT(last_login) as usuarios_com_last_login,
    COUNT(*) - COUNT(last_login) as usuarios_sem_last_login
FROM profiles;

-- 5. Testar a função
SELECT update_user_last_login() as teste_funcao;

-- 6. Verificar se as funções foram criadas
SELECT 
    'FUNÇÕES CRIADAS' as verificacao,
    routine_name,
    '✅ Função disponível' as status
FROM information_schema.routines 
WHERE routine_name IN ('update_user_last_login', 'update_user_last_login_admin')
  AND routine_schema = 'public';

-- INSTRUÇÕES PARA O FRONTEND:
-- 1. Chamar a função update_user_last_login() após login bem-sucedido
-- 2. Exemplo de uso no JavaScript:
-- 
-- const { data, error } = await supabase.rpc('update_user_last_login')
-- if (data?.success) {
--   console.log('Last login atualizado:', data.last_login)
-- }

-- COMENTÁRIOS:
COMMENT ON FUNCTION update_user_last_login IS 'Atualiza o last_login do usuário autenticado atual';
COMMENT ON FUNCTION update_user_last_login_admin IS 'Permite que admins atualizem o last_login de outros usuários';