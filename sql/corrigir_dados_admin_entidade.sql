-- ========================================
-- CORREÇÃO: DADOS DO ADMIN DE ENTIDADE
-- ========================================

-- Este script vai corrigir os dados do usuário admin que está vendo informações incorretas

-- PASSO 1: Identificar e corrigir usuários admin sem entity_id
-- (Usuários que são admin mas aparecem como "Usuário Individual")

-- Primeiro, vamos ver quais usuários precisam de correção
SELECT 
    'USUÁRIOS PARA CORRIGIR' as etapa,
    p.id,
    p.full_name,
    p.email,
    p.role,
    p.entity_id,
    p.registration_type,
    p.entity_role,
    'Precisa de entity_id' as acao_necessaria
FROM profiles p
WHERE (p.role IN ('admin', 'super_admin') 
       OR p.registration_type = 'entity_admin' 
       OR p.entity_role = 'admin')
  AND p.entity_id IS NULL;

-- PASSO 2: Se há apenas uma entidade no sistema, associar admin a ela
-- (Caso comum: sistema com uma entidade principal)
DO $$
DECLARE
    v_entity_count INTEGER;
    v_entity_id UUID;
    v_admin_count INTEGER;
BEGIN
    -- Contar quantas entidades existem
    SELECT COUNT(*) INTO v_entity_count FROM entities;
    
    -- Contar quantos admins sem entidade existem
    SELECT COUNT(*) INTO v_admin_count 
    FROM profiles 
    WHERE (role IN ('admin', 'super_admin') 
           OR registration_type = 'entity_admin' 
           OR entity_role = 'admin')
      AND entity_id IS NULL;
    
    RAISE NOTICE 'Encontradas % entidades e % admins sem entidade', v_entity_count, v_admin_count;
    
    -- Se há exatamente uma entidade, associar todos os admins a ela
    IF v_entity_count = 1 AND v_admin_count > 0 THEN
        SELECT id INTO v_entity_id FROM entities LIMIT 1;
        
        UPDATE profiles 
        SET entity_id = v_entity_id,
            updated_at = NOW()
        WHERE (role IN ('admin', 'super_admin') 
               OR registration_type = 'entity_admin' 
               OR entity_role = 'admin')
          AND entity_id IS NULL;
          
        RAISE NOTICE 'Associados % admins à entidade %', v_admin_count, v_entity_id;
    END IF;
END
$$;

-- PASSO 3: Corrigir last_login para usuários que não têm
UPDATE profiles 
SET last_login = COALESCE(updated_at, created_at),
    updated_at = NOW()
WHERE last_login IS NULL;

-- PASSO 4: Associar admins a departamentos se necessário
-- (Admins geralmente devem estar em pelo menos um departamento)

-- Primeiro, verificar se admin tem departamento
WITH admins_sem_dept AS (
    SELECT p.id, p.full_name, p.entity_id
    FROM profiles p
    WHERE (p.role IN ('admin', 'super_admin') 
           OR p.registration_type = 'entity_admin' 
           OR p.entity_role = 'admin')
      AND p.entity_id IS NOT NULL
      AND p.department_id IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM user_departments ud 
        WHERE ud.user_id = p.id
      )
),
primeiro_departamento AS (
    SELECT DISTINCT ON (d.entity_id) 
           d.entity_id, 
           d.id as department_id,
           d.name as department_name
    FROM departments d
    WHERE d.entity_id IS NOT NULL
    ORDER BY d.entity_id, d.created_at ASC
)
-- Associar admin ao primeiro departamento da sua entidade
UPDATE profiles 
SET department_id = pd.department_id,
    updated_at = NOW()
FROM admins_sem_dept asd
JOIN primeiro_departamento pd ON asd.entity_id = pd.entity_id
WHERE profiles.id = asd.id;

-- PASSO 5: Adicionar admin à tabela user_departments se necessário
INSERT INTO user_departments (user_id, department_id, role_in_department, is_primary, assigned_at, notes)
SELECT 
    p.id,
    p.department_id,
    'manager',
    true,
    NOW(),
    'Admin adicionado automaticamente'
FROM profiles p
WHERE (p.role IN ('admin', 'super_admin') 
       OR p.registration_type = 'entity_admin' 
       OR p.entity_role = 'admin')
  AND p.department_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_departments ud 
    WHERE ud.user_id = p.id AND ud.department_id = p.department_id
  );

-- PASSO 6: Verificar resultado final
SELECT 
    'RESULTADO APÓS CORREÇÃO' as etapa,
    p.id,
    p.full_name,
    p.email,
    p.role,
    p.entity_id,
    e.name as entity_name,
    p.department_id,
    d.name as department_name,
    p.last_login,
    p.registration_type,
    p.entity_role,
    -- Simular o que aparecerá na tela
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
        WHEN e.name IS NOT NULL AND d.name IS NOT NULL AND p.last_login IS NOT NULL THEN '✅ Tudo correto'
        ELSE '❌ Ainda há problemas'
    END as status
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
LEFT JOIN departments d ON p.department_id = d.id
WHERE (p.role IN ('admin', 'super_admin') 
       OR p.registration_type = 'entity_admin' 
       OR p.entity_role = 'admin')
ORDER BY p.full_name;

-- PASSO 7: Resumo das correções
SELECT 
    'RESUMO DAS CORREÇÕES' as categoria,
    'Admins com entidade' as metrica,
    COUNT(*) as valor
FROM profiles p
WHERE (p.role IN ('admin', 'super_admin') 
       OR p.registration_type = 'entity_admin' 
       OR p.entity_role = 'admin')
  AND p.entity_id IS NOT NULL
UNION ALL
SELECT 
    'RESUMO DAS CORREÇÕES',
    'Admins com departamento',
    COUNT(*)
FROM profiles p
WHERE (p.role IN ('admin', 'super_admin') 
       OR p.registration_type = 'entity_admin' 
       OR p.entity_role = 'admin')
  AND p.department_id IS NOT NULL
UNION ALL
SELECT 
    'RESUMO DAS CORREÇÕES',
    'Admins com last_login',
    COUNT(*)
FROM profiles p
WHERE (p.role IN ('admin', 'super_admin') 
       OR p.registration_type = 'entity_admin' 
       OR p.entity_role = 'admin')
  AND p.last_login IS NOT NULL;

-- INSTRUÇÕES:
-- 1. Execute este script
-- 2. Recarregue a página "Minha Conta"
-- 3. Verifique se agora mostra:
--    - Entidade: Nome da sua entidade (não "Usuário Individual")
--    - Departamento: Nome do departamento (não "N/A")
--    - Último Login: Data/hora (não "N/A")