-- ========================================
-- CORREÇÃO COMPLETA: SISTEMA PÁGINA MINHA CONTA
-- ========================================

-- Este script corrige todos os problemas do sistema para que a página "Minha Conta"
-- funcione corretamente para todos os tipos de usuários, baseado na estrutura real da tabela profiles

-- DIAGNÓSTICO INICIAL
SELECT 
    'DIAGNÓSTICO INICIAL' as etapa,
    'Total de usuários' as metrica,
    COUNT(*) as valor
FROM profiles
UNION ALL
SELECT 
    'DIAGNÓSTICO INICIAL',
    'Usuários sem entity_id',
    COUNT(*)
FROM profiles WHERE entity_id IS NULL
UNION ALL
SELECT 
    'DIAGNÓSTICO INICIAL',
    'Usuários sem department_id',
    COUNT(*)
FROM profiles WHERE department_id IS NULL
UNION ALL
SELECT 
    'DIAGNÓSTICO INICIAL',
    'Usuários sem last_login',
    COUNT(*)
FROM profiles WHERE last_login IS NULL;

-- ========================================
-- CORREÇÃO 1: LAST_LOGIN
-- ========================================

-- Criar função para atualizar last_login
CREATE OR REPLACE FUNCTION update_user_last_login()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Usuário não autenticado');
    END IF;

    UPDATE profiles 
    SET last_login = NOW(), updated_at = NOW()
    WHERE id = v_user_id;

    IF FOUND THEN
        RETURN json_build_object('success', true, 'message', 'Last login atualizado', 'user_id', v_user_id);
    ELSE
        RETURN json_build_object('success', false, 'error', 'Usuário não encontrado', 'user_id', v_user_id);
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM, 'user_id', v_user_id);
END;
$$;

-- Corrigir last_login para todos os usuários que não têm
UPDATE profiles 
SET last_login = COALESCE(updated_at, created_at),
    updated_at = NOW()
WHERE last_login IS NULL;

-- ========================================
-- CORREÇÃO 2: ENTITY_ID BASEADO EM REGISTRATION_TYPE
-- ========================================

-- Para usuários entity_admin e entity_user que não têm entity_id
-- Vamos associá-los à primeira entidade disponível se houver apenas uma
DO $$
DECLARE
    v_entity_count INTEGER;
    v_entity_id UUID;
    v_users_affected INTEGER;
BEGIN
    -- Contar quantas entidades existem
    SELECT COUNT(*) INTO v_entity_count FROM entities;
    
    -- Se há exatamente uma entidade, associar usuários de entidade a ela
    IF v_entity_count = 1 THEN
        SELECT id INTO v_entity_id FROM entities LIMIT 1;
        
        -- Atualizar usuários entity_admin e entity_user sem entity_id
        UPDATE profiles 
        SET entity_id = v_entity_id,
            updated_at = NOW()
        WHERE registration_type IN ('entity_admin', 'entity_user')
          AND entity_id IS NULL;
          
        GET DIAGNOSTICS v_users_affected = ROW_COUNT;
        RAISE NOTICE 'Associados % usuários de entidade à entidade %', v_users_affected, v_entity_id;
        
    ELSIF v_entity_count > 1 THEN
        RAISE NOTICE 'Múltiplas entidades encontradas (%). Associação manual necessária.', v_entity_count;
    ELSE
        RAISE NOTICE 'Nenhuma entidade encontrada. Criação de entidade necessária.';
    END IF;
END
$$;

-- ========================================
-- CORREÇÃO 3: DEPARTMENT_ID BASEADO EM USER_DEPARTMENTS
-- ========================================

-- Atualizar department_id no profiles baseado na tabela user_departments
-- Priorizar departamentos primários, depois o primeiro departamento

-- Primeiro: usuários com departamento primário
UPDATE profiles 
SET department_id = (
    SELECT ud.department_id 
    FROM user_departments ud 
    WHERE ud.user_id = profiles.id 
    AND ud.is_primary = true
    LIMIT 1
),
updated_at = NOW()
WHERE EXISTS (
    SELECT 1 FROM user_departments ud 
    WHERE ud.user_id = profiles.id 
    AND ud.is_primary = true
)
AND department_id IS NULL;

-- Segundo: usuários sem departamento primário, usar o primeiro
UPDATE profiles 
SET department_id = (
    SELECT ud.department_id 
    FROM user_departments ud 
    WHERE ud.user_id = profiles.id 
    ORDER BY ud.assigned_at ASC
    LIMIT 1
),
updated_at = NOW()
WHERE department_id IS NULL
  AND EXISTS (
    SELECT 1 FROM user_departments ud 
    WHERE ud.user_id = profiles.id
  );

-- ========================================
-- CORREÇÃO 4: SINCRONIZAR USER_DEPARTMENTS COM PROFILES
-- ========================================

-- Adicionar usuários com department_id à tabela user_departments se não estiverem
INSERT INTO user_departments (user_id, department_id, role_in_department, is_primary, assigned_at, notes)
SELECT 
    p.id,
    p.department_id,
    CASE 
        WHEN p.role IN ('admin', 'super_admin') THEN 'manager'
        WHEN p.role = 'manager' THEN 'supervisor'
        ELSE 'member'
    END,
    true,
    NOW(),
    'Sincronizado automaticamente do profiles.department_id'
FROM profiles p
WHERE p.department_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_departments ud 
    WHERE ud.user_id = p.id AND ud.department_id = p.department_id
  );

-- ========================================
-- CORREÇÃO 5: ASSOCIAR USUÁRIOS DE ENTIDADE A DEPARTAMENTOS
-- ========================================

-- Para usuários de entidade que não têm departamento, associar ao primeiro departamento da entidade
WITH usuarios_sem_dept AS (
    SELECT p.id, p.entity_id, p.role
    FROM profiles p
    WHERE p.entity_id IS NOT NULL
      AND p.department_id IS NULL
      AND p.registration_type IN ('entity_admin', 'entity_user')
),
primeiro_dept_por_entidade AS (
    SELECT DISTINCT ON (d.entity_id) 
           d.entity_id, 
           d.id as department_id
    FROM departments d
    WHERE d.entity_id IS NOT NULL
    ORDER BY d.entity_id, d.created_at ASC
)
UPDATE profiles 
SET department_id = pd.department_id,
    updated_at = NOW()
FROM usuarios_sem_dept usd
JOIN primeiro_dept_por_entidade pd ON usd.entity_id = pd.entity_id
WHERE profiles.id = usd.id;

-- Adicionar esses usuários à tabela user_departments também
INSERT INTO user_departments (user_id, department_id, role_in_department, is_primary, assigned_at, notes)
SELECT 
    p.id,
    p.department_id,
    CASE 
        WHEN p.role IN ('admin', 'super_admin') OR p.registration_type = 'entity_admin' THEN 'manager'
        WHEN p.role = 'manager' THEN 'supervisor'
        ELSE 'member'
    END,
    true,
    NOW(),
    'Usuário de entidade associado automaticamente'
FROM profiles p
WHERE p.entity_id IS NOT NULL
  AND p.department_id IS NOT NULL
  AND p.registration_type IN ('entity_admin', 'entity_user')
  AND NOT EXISTS (
    SELECT 1 FROM user_departments ud 
    WHERE ud.user_id = p.id AND ud.department_id = p.department_id
  );

-- ========================================
-- CORREÇÃO 6: GARANTIR CONSISTÊNCIA DE ROLES
-- ========================================

-- Corrigir entity_role baseado no role principal
UPDATE profiles 
SET entity_role = CASE 
    WHEN role = 'super_admin' THEN 'admin'
    WHEN role = 'admin' THEN 'admin'
    WHEN role = 'manager' THEN 'manager'
    WHEN role = 'viewer' THEN 'viewer'
    ELSE 'user'
END,
updated_at = NOW()
WHERE entity_id IS NOT NULL
  AND (entity_role IS NULL OR entity_role != CASE 
    WHEN role = 'super_admin' THEN 'admin'
    WHEN role = 'admin' THEN 'admin'
    WHEN role = 'manager' THEN 'manager'
    WHEN role = 'viewer' THEN 'viewer'
    ELSE 'user'
END);

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

-- Verificar resultado das correções
SELECT 
    'RESULTADO FINAL' as etapa,
    p.id,
    p.full_name,
    p.email,
    p.role,
    p.registration_type,
    p.entity_role,
    p.entity_id,
    e.name as entity_name,
    p.department_id,
    d.name as department_name,
    p.last_login,
    -- Simular o que aparecerá na página "Minha Conta"
    CASE 
        WHEN e.name IS NOT NULL THEN e.name
        ELSE 'Usuário Individual'
    END as tela_entidade,
    CASE 
        WHEN d.name IS NOT NULL THEN d.name
        ELSE 'N/A'
    END as tela_departamento,
    CASE 
        WHEN p.last_login IS NOT NULL THEN TO_CHAR(p.last_login, 'DD/MM/YYYY HH24:MI')
        ELSE 'N/A'
    END as tela_ultimo_login,
    CASE 
        WHEN p.registration_type = 'individual' THEN 'Individual'
        WHEN p.registration_type = 'entity_admin' THEN 'Admin da Entidade'
        WHEN p.registration_type = 'entity_user' THEN 'Usuário da Entidade'
        ELSE 'N/A'
    END as tela_tipo_registro,
    -- Status da correção
    CASE 
        WHEN p.registration_type = 'individual' AND p.entity_id IS NULL AND p.last_login IS NOT NULL THEN '✅ Individual OK'
        WHEN p.registration_type IN ('entity_admin', 'entity_user') AND p.entity_id IS NOT NULL AND p.department_id IS NOT NULL AND p.last_login IS NOT NULL THEN '✅ Entidade OK'
        ELSE '❌ Precisa revisão'
    END as status_final
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
LEFT JOIN departments d ON p.department_id = d.id
ORDER BY p.registration_type, p.full_name;

-- Resumo estatístico
SELECT 
    'RESUMO ESTATÍSTICO' as categoria,
    'Total de usuários' as metrica,
    COUNT(*) as valor
FROM profiles
UNION ALL
SELECT 
    'RESUMO ESTATÍSTICO',
    'Usuários individuais',
    COUNT(*)
FROM profiles WHERE registration_type = 'individual'
UNION ALL
SELECT 
    'RESUMO ESTATÍSTICO',
    'Admins de entidade',
    COUNT(*)
FROM profiles WHERE registration_type = 'entity_admin'
UNION ALL
SELECT 
    'RESUMO ESTATÍSTICO',
    'Usuários de entidade',
    COUNT(*)
FROM profiles WHERE registration_type = 'entity_user'
UNION ALL
SELECT 
    'RESUMO ESTATÍSTICO',
    'Usuários com entidade',
    COUNT(*)
FROM profiles WHERE entity_id IS NOT NULL
UNION ALL
SELECT 
    'RESUMO ESTATÍSTICO',
    'Usuários com departamento',
    COUNT(*)
FROM profiles WHERE department_id IS NOT NULL
UNION ALL
SELECT 
    'RESUMO ESTATÍSTICO',
    'Usuários com last_login',
    COUNT(*)
FROM profiles WHERE last_login IS NOT NULL
UNION ALL
SELECT 
    'RESUMO ESTATÍSTICO',
    'Usuários totalmente corretos',
    COUNT(*)
FROM profiles p
WHERE (
    (p.registration_type = 'individual' AND p.entity_id IS NULL AND p.last_login IS NOT NULL) OR
    (p.registration_type IN ('entity_admin', 'entity_user') AND p.entity_id IS NOT NULL AND p.department_id IS NOT NULL AND p.last_login IS NOT NULL)
);

-- Comentários das funções
COMMENT ON FUNCTION update_user_last_login IS 'Atualiza o last_login do usuário autenticado - usar no frontend após login';

-- INSTRUÇÕES FINAIS
SELECT 
    'INSTRUÇÕES PARA O FRONTEND' as info,
    'Adicionar chamada após login bem-sucedido:' as instrucao,
    'await supabase.rpc("update_user_last_login")' as codigo;

-- REGRAS DE NEGÓCIO IMPLEMENTADAS:
-- 1. Usuários individuais (registration_type = 'individual'): entity_id = NULL, department_id = NULL
-- 2. Usuários de entidade (registration_type = 'entity_admin' ou 'entity_user'): entity_id preenchido, department_id preenchido
-- 3. Todos os usuários: last_login preenchido
-- 4. Sincronização entre profiles.department_id e user_departments
-- 5. entity_role consistente com role principal