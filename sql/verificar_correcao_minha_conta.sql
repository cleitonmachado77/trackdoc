-- ========================================
-- VERIFICAÇÃO: CORREÇÃO DA PÁGINA MINHA CONTA
-- ========================================

-- Script rápido para verificar se a correção funcionou

-- 1. Verificar dados que aparecerão na página "Minha Conta"
SELECT 
    'DADOS PARA MINHA CONTA' as categoria,
    p.full_name as nome_usuario,
    p.email,
    p.role as funcao,
    -- O que aparecerá na tela:
    CASE 
        WHEN e.name IS NOT NULL THEN e.name
        ELSE 'Usuário Individual'
    END as entidade_na_tela,
    CASE 
        WHEN d.name IS NOT NULL THEN d.name
        ELSE 'N/A'
    END as departamento_na_tela,
    CASE 
        WHEN p.last_login IS NOT NULL THEN TO_CHAR(p.last_login, 'DD/MM/YYYY HH24:MI')
        ELSE 'N/A'
    END as ultimo_login_na_tela,
    CASE 
        WHEN p.registration_type = 'individual' THEN 'Individual'
        WHEN p.registration_type = 'entity_admin' THEN 'Admin da Entidade'
        WHEN p.registration_type = 'entity_user' THEN 'Usuário da Entidade'
        ELSE 'N/A'
    END as tipo_registro_na_tela,
    -- Status da correção:
    CASE 
        WHEN e.name IS NOT NULL AND d.name IS NOT NULL AND p.last_login IS NOT NULL THEN '✅ CORRETO'
        WHEN e.name IS NULL THEN '❌ Falta entidade'
        WHEN d.name IS NULL THEN '❌ Falta departamento'
        WHEN p.last_login IS NULL THEN '❌ Falta last_login'
        ELSE '⚠️ Verificar'
    END as status_correcao
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
LEFT JOIN departments d ON p.department_id = d.id
WHERE (p.role IN ('admin', 'super_admin') 
       OR p.registration_type = 'entity_admin' 
       OR p.entity_role = 'admin')
ORDER BY p.full_name;

-- 2. Verificar se há problemas restantes
SELECT 
    'PROBLEMAS RESTANTES' as categoria,
    COUNT(*) as total_admins,
    COUNT(CASE WHEN p.entity_id IS NULL THEN 1 END) as sem_entidade,
    COUNT(CASE WHEN p.department_id IS NULL THEN 1 END) as sem_departamento,
    COUNT(CASE WHEN p.last_login IS NULL THEN 1 END) as sem_last_login,
    COUNT(CASE WHEN p.entity_id IS NOT NULL AND p.department_id IS NOT NULL AND p.last_login IS NOT NULL THEN 1 END) as corretos
FROM profiles p
WHERE (p.role IN ('admin', 'super_admin') 
       OR p.registration_type = 'entity_admin' 
       OR p.entity_role = 'admin');

-- 3. Mostrar dados específicos do usuário que reportou o problema
-- (Assumindo que é um admin recente ou o único admin)
SELECT 
    'USUÁRIO QUE REPORTOU PROBLEMA' as categoria,
    p.full_name,
    p.email,
    p.role,
    p.entity_id,
    e.name as entity_name,
    p.department_id,
    d.name as department_name,
    p.last_login,
    p.registration_type,
    p.created_at,
    -- Dados que aparecerão na tela:
    '--- DADOS NA TELA ---' as separador,
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
    END as tela_ultimo_login
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
LEFT JOIN departments d ON p.department_id = d.id
WHERE (p.role IN ('admin', 'super_admin') 
       OR p.registration_type = 'entity_admin' 
       OR p.entity_role = 'admin')
ORDER BY p.created_at DESC
LIMIT 1;

-- 4. Verificar se a consulta da página "Minha Conta" funcionará
-- (Simular exatamente a consulta do código)
SELECT 
    'SIMULAÇÃO CONSULTA PÁGINA' as categoria,
    p.*,
    e.name as entity_name,
    e.legal_name as entity_legal_name,
    d.name as department_name
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
LEFT JOIN departments d ON p.department_id = d.id
WHERE (p.role IN ('admin', 'super_admin') 
       OR p.registration_type = 'entity_admin' 
       OR p.entity_role = 'admin')
ORDER BY p.created_at DESC
LIMIT 1;