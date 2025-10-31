-- ========================================
-- CORREÇÃO: DADOS DE FUNCIONÁRIOS (SEM MEXER NAS FUNÇÕES)
-- ========================================

-- ESTRATÉGIA: Focar apenas em corrigir os dados da tabela user_departments
-- e deixar as funções como estão por enquanto

-- PASSO 1: Verificar estado atual
SELECT 
    'DIAGNÓSTICO INICIAL' as etapa,
    (SELECT COUNT(*) FROM departments) as total_departamentos,
    (SELECT COUNT(*) FROM profiles) as total_usuarios,
    (SELECT COUNT(*) FROM user_departments) as total_relacionamentos_existentes;

-- PASSO 2: Verificar departamentos sem funcionários
SELECT 
    'DEPARTAMENTOS SEM FUNCIONÁRIOS' as problema,
    d.id,
    d.name,
    d.manager_name,
    d.user_count as contador_cache,
    COUNT(ud.user_id) as funcionarios_reais
FROM departments d
LEFT JOIN user_departments ud ON d.id = ud.department_id
GROUP BY d.id, d.name, d.manager_name, d.user_count
HAVING COUNT(ud.user_id) = 0
ORDER BY d.name;

-- PASSO 3: Adicionar gerentes como funcionários (se não estiverem)
INSERT INTO user_departments (user_id, department_id, role_in_department, is_primary, assigned_at, notes)
SELECT 
    d.manager_id,
    d.id,
    'manager',
    true,
    NOW(),
    'Gerente adicionado automaticamente'
FROM departments d
WHERE d.manager_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_departments ud 
    WHERE ud.user_id = d.manager_id 
    AND ud.department_id = d.id
  );

-- Verificar quantos gerentes foram adicionados
SELECT 
    'GERENTES ADICIONADOS' as resultado,
    COUNT(*) as quantidade_adicionada
FROM departments d
WHERE d.manager_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM user_departments ud 
    WHERE ud.user_id = d.manager_id 
    AND ud.department_id = d.id
    AND ud.notes = 'Gerente adicionado automaticamente'
  );

-- PASSO 4: Adicionar alguns funcionários extras aos departamentos (se houver usuários disponíveis)
-- Isso é opcional, apenas para ter dados de teste

WITH usuarios_sem_departamento AS (
    SELECT 
        p.id,
        p.full_name,
        p.entity_id,
        ROW_NUMBER() OVER (PARTITION BY p.entity_id ORDER BY p.created_at) as rn
    FROM profiles p
    WHERE p.id NOT IN (SELECT DISTINCT user_id FROM user_departments)
),
departamentos_com_poucos_funcionarios AS (
    SELECT 
        d.id,
        d.entity_id,
        COUNT(ud.user_id) as funcionarios_atuais,
        ROW_NUMBER() OVER (PARTITION BY d.entity_id ORDER BY d.created_at) as dept_rn
    FROM departments d
    LEFT JOIN user_departments ud ON d.id = ud.department_id
    GROUP BY d.id, d.entity_id, d.created_at
    HAVING COUNT(ud.user_id) <= 2  -- Departamentos com 2 ou menos funcionários
)
INSERT INTO user_departments (user_id, department_id, role_in_department, is_primary, assigned_at, notes)
SELECT 
    usd.id,
    dpf.id,
    'member',
    false,
    NOW(),
    'Funcionário adicionado para teste'
FROM usuarios_sem_departamento usd
JOIN departamentos_com_poucos_funcionarios dpf ON usd.entity_id = dpf.entity_id
WHERE usd.rn <= 2 AND dpf.dept_rn <= 3  -- Máximo 2 usuários por entidade, máximo 3 departamentos
LIMIT 10;  -- Limitar a 10 inserções para não sobrecarregar

-- PASSO 5: Atualizar contadores nos departamentos
UPDATE departments 
SET user_count = (
    SELECT COUNT(*) 
    FROM user_departments ud 
    WHERE ud.department_id = departments.id
);

-- PASSO 6: Verificar resultado final
SELECT 
    'RESULTADO APÓS CORREÇÃO' as etapa,
    d.name as department_name,
    d.entity_id,
    d.manager_name,
    COUNT(ud.user_id) as funcionarios_atuais,
    d.user_count as contador_atualizado,
    CASE 
        WHEN COUNT(ud.user_id) = 0 THEN '❌ Ainda sem funcionários'
        WHEN COUNT(ud.user_id) != d.user_count THEN '⚠️ Contador divergente'
        ELSE '✅ OK'
    END as status,
    STRING_AGG(p.full_name, ', ' ORDER BY p.full_name) as lista_funcionarios
FROM departments d
LEFT JOIN user_departments ud ON d.id = ud.department_id
LEFT JOIN profiles p ON ud.user_id = p.id
GROUP BY d.id, d.name, d.entity_id, d.manager_name, d.user_count
ORDER BY d.name;

-- PASSO 7: Verificar funcionários disponíveis restantes
SELECT 
    'FUNCIONÁRIOS AINDA DISPONÍVEIS' as info,
    p.entity_id,
    COUNT(*) as quantidade,
    STRING_AGG(p.full_name, ', ' ORDER BY p.full_name) as nomes
FROM profiles p
WHERE p.id NOT IN (SELECT DISTINCT user_id FROM user_departments)
GROUP BY p.entity_id
ORDER BY p.entity_id;

-- PASSO 8: Resumo final
SELECT 
    'RESUMO FINAL' as categoria,
    'Total de departamentos' as metrica,
    COUNT(*) as valor
FROM departments
UNION ALL
SELECT 
    'RESUMO FINAL',
    'Departamentos com funcionários',
    COUNT(*)
FROM departments d
WHERE EXISTS (SELECT 1 FROM user_departments WHERE department_id = d.id)
UNION ALL
SELECT 
    'RESUMO FINAL',
    'Total de relacionamentos user_departments',
    COUNT(*)
FROM user_departments
UNION ALL
SELECT 
    'RESUMO FINAL',
    'Funcionários únicos com departamento',
    COUNT(DISTINCT user_id)
FROM user_departments;

-- INSTRUÇÕES PARA TESTE:
-- 1. Execute este script
-- 2. Vá para a página de departamentos no frontend
-- 3. Clique no botão "Funcionários" de qualquer departamento
-- 4. Deve mostrar os funcionários agora