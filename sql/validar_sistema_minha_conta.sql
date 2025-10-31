-- ========================================
-- VALIDAÇÃO: SISTEMA PÁGINA MINHA CONTA
-- ========================================

-- Este script valida se o sistema está funcionando corretamente após as correções

-- 1. VALIDAÇÃO POR TIPO DE USUÁRIO
SELECT 
    'VALIDAÇÃO POR TIPO' as categoria,
    p.registration_type,
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN p.entity_id IS NOT NULL THEN 1 END) as com_entidade,
    COUNT(CASE WHEN p.department_id IS NOT NULL THEN 1 END) as com_departamento,
    COUNT(CASE WHEN p.last_login IS NOT NULL THEN 1 END) as com_last_login,
    -- Validação das regras de negócio
    COUNT(CASE 
        WHEN p.registration_type = 'individual' AND p.entity_id IS NULL THEN 1 
        WHEN p.registration_type IN ('entity_admin', 'entity_user') AND p.entity_id IS NOT NULL THEN 1
    END) as entidade_correta,
    COUNT(CASE 
        WHEN p.registration_type = 'individual' THEN 1  -- Individual pode ou não ter departamento
        WHEN p.registration_type IN ('entity_admin', 'entity_user') AND p.department_id IS NOT NULL THEN 1
    END) as departamento_correto,
    -- Status geral
    CASE 
        WHEN p.registration_type = 'individual' THEN 
            CASE WHEN COUNT(CASE WHEN p.last_login IS NOT NULL THEN 1 END) = COUNT(*) THEN '✅ OK' ELSE '❌ Falta last_login' END
        ELSE 
            CASE WHEN COUNT(CASE WHEN p.entity_id IS NOT NULL AND p.department_id IS NOT NULL AND p.last_login IS NOT NULL THEN 1 END) = COUNT(*) 
                 THEN '✅ OK' ELSE '❌ Dados incompletos' END
    END as status_validacao
FROM profiles p
GROUP BY p.registration_type
ORDER BY p.registration_type;

-- 2. USUÁRIOS COM PROBLEMAS RESTANTES
SELECT 
    'USUÁRIOS COM PROBLEMAS' as categoria,
    p.full_name,
    p.email,
    p.registration_type,
    p.role,
    p.entity_id,
    e.name as entity_name,
    p.department_id,
    d.name as department_name,
    p.last_login,
    -- Identificar problemas específicos
    CASE 
        WHEN p.registration_type IN ('entity_admin', 'entity_user') AND p.entity_id IS NULL THEN 'Falta entity_id'
        WHEN p.registration_type IN ('entity_admin', 'entity_user') AND p.department_id IS NULL THEN 'Falta department_id'
        WHEN p.last_login IS NULL THEN 'Falta last_login'
        ELSE 'Problema desconhecido'
    END as problema
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
LEFT JOIN departments d ON p.department_id = d.id
WHERE NOT (
    (p.registration_type = 'individual' AND p.last_login IS NOT NULL) OR
    (p.registration_type IN ('entity_admin', 'entity_user') AND p.entity_id IS NOT NULL AND p.department_id IS NOT NULL AND p.last_login IS NOT NULL)
)
ORDER BY p.registration_type, p.full_name;

-- 3. SIMULAÇÃO DA PÁGINA "MINHA CONTA" PARA TODOS OS USUÁRIOS
SELECT 
    'SIMULAÇÃO PÁGINA MINHA CONTA' as categoria,
    p.full_name as usuario,
    p.email,
    -- Dados que aparecerão na tela
    CASE 
        WHEN p.role = 'super_admin' THEN 'Super Admin'
        WHEN p.role = 'admin' THEN 'Administrador'
        WHEN p.role = 'manager' THEN 'Gerente'
        WHEN p.role = 'user' THEN 'Usuário'
        WHEN p.role = 'viewer' THEN 'Visualizador'
        ELSE 'N/A'
    END as tela_funcao,
    CASE 
        WHEN e.name IS NOT NULL THEN e.name
        ELSE 'Usuário Individual'
    END as tela_entidade,
    CASE 
        WHEN d.name IS NOT NULL THEN d.name
        ELSE 'N/A'
    END as tela_departamento,
    CASE 
        WHEN p.registration_type = 'individual' THEN 'Individual'
        WHEN p.registration_type = 'entity_admin' THEN 'Admin da Entidade'
        WHEN p.registration_type = 'entity_user' THEN 'Usuário da Entidade'
        ELSE 'N/A'
    END as tela_tipo_registro,
    CASE 
        WHEN p.last_login IS NOT NULL THEN TO_CHAR(p.last_login, 'DD/MM/YYYY HH24:MI')
        ELSE 'N/A'
    END as tela_ultimo_login,
    TO_CHAR(p.created_at, 'DD/MM/YYYY HH24:MI') as tela_conta_criada,
    -- Status da validação
    CASE 
        WHEN p.registration_type = 'individual' AND e.name IS NULL AND p.last_login IS NOT NULL THEN '✅ Correto'
        WHEN p.registration_type IN ('entity_admin', 'entity_user') AND e.name IS NOT NULL AND d.name IS NOT NULL AND p.last_login IS NOT NULL THEN '✅ Correto'
        ELSE '❌ Incorreto'
    END as status_tela
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
LEFT JOIN departments d ON p.department_id = d.id
ORDER BY p.registration_type, p.full_name;

-- 4. VERIFICAR CONSISTÊNCIA ENTRE PROFILES E USER_DEPARTMENTS
SELECT 
    'CONSISTÊNCIA PROFILES <-> USER_DEPARTMENTS' as categoria,
    COUNT(*) as usuarios_com_department_id,
    COUNT(CASE WHEN ud.user_id IS NOT NULL THEN 1 END) as usuarios_em_user_departments,
    COUNT(CASE WHEN ud.user_id IS NULL THEN 1 END) as inconsistencias,
    CASE 
        WHEN COUNT(CASE WHEN ud.user_id IS NULL THEN 1 END) = 0 THEN '✅ Consistente'
        ELSE '❌ Há inconsistências'
    END as status_consistencia
FROM profiles p
LEFT JOIN user_departments ud ON p.id = ud.user_id AND p.department_id = ud.department_id
WHERE p.department_id IS NOT NULL;

-- 5. VERIFICAR SE A FUNÇÃO DE LAST_LOGIN FOI CRIADA
SELECT 
    'FUNÇÃO LAST_LOGIN' as categoria,
    routine_name,
    routine_type,
    data_type as return_type,
    '✅ Função disponível' as status
FROM information_schema.routines 
WHERE routine_name = 'update_user_last_login'
  AND routine_schema = 'public'
UNION ALL
SELECT 
    'FUNÇÃO LAST_LOGIN',
    'update_user_last_login',
    'FUNCTION',
    'json',
    '❌ Função não encontrada'
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'update_user_last_login'
    AND routine_schema = 'public'
);

-- 6. RESUMO FINAL DA VALIDAÇÃO
SELECT 
    'RESUMO FINAL' as categoria,
    'Total de usuários' as metrica,
    COUNT(*) as valor,
    '100%' as percentual
FROM profiles
UNION ALL
SELECT 
    'RESUMO FINAL',
    'Usuários corretos',
    COUNT(*),
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM profiles), 1) || '%'
FROM profiles p
WHERE (
    (p.registration_type = 'individual' AND p.last_login IS NOT NULL) OR
    (p.registration_type IN ('entity_admin', 'entity_user') AND p.entity_id IS NOT NULL AND p.department_id IS NOT NULL AND p.last_login IS NOT NULL)
)
UNION ALL
SELECT 
    'RESUMO FINAL',
    'Usuários com problemas',
    COUNT(*),
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM profiles), 1) || '%'
FROM profiles p
WHERE NOT (
    (p.registration_type = 'individual' AND p.last_login IS NOT NULL) OR
    (p.registration_type IN ('entity_admin', 'entity_user') AND p.entity_id IS NOT NULL AND p.department_id IS NOT NULL AND p.last_login IS NOT NULL)
);

-- 7. CASOS DE TESTE ESPECÍFICOS
SELECT 
    'CASOS DE TESTE' as categoria,
    'Usuário Individual' as tipo_teste,
    COUNT(*) as quantidade,
    COUNT(CASE WHEN p.entity_id IS NULL AND p.last_login IS NOT NULL THEN 1 END) as corretos,
    CASE 
        WHEN COUNT(*) = COUNT(CASE WHEN p.entity_id IS NULL AND p.last_login IS NOT NULL THEN 1 END) THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as resultado
FROM profiles p
WHERE p.registration_type = 'individual'
UNION ALL
SELECT 
    'CASOS DE TESTE',
    'Admin de Entidade',
    COUNT(*),
    COUNT(CASE WHEN p.entity_id IS NOT NULL AND p.department_id IS NOT NULL AND p.last_login IS NOT NULL THEN 1 END),
    CASE 
        WHEN COUNT(*) = COUNT(CASE WHEN p.entity_id IS NOT NULL AND p.department_id IS NOT NULL AND p.last_login IS NOT NULL THEN 1 END) THEN '✅ PASS'
        ELSE '❌ FAIL'
    END
FROM profiles p
WHERE p.registration_type = 'entity_admin'
UNION ALL
SELECT 
    'CASOS DE TESTE',
    'Usuário de Entidade',
    COUNT(*),
    COUNT(CASE WHEN p.entity_id IS NOT NULL AND p.department_id IS NOT NULL AND p.last_login IS NOT NULL THEN 1 END),
    CASE 
        WHEN COUNT(*) = COUNT(CASE WHEN p.entity_id IS NOT NULL AND p.department_id IS NOT NULL AND p.last_login IS NOT NULL THEN 1 END) THEN '✅ PASS'
        ELSE '❌ FAIL'
    END
FROM profiles p
WHERE p.registration_type = 'entity_user';