-- ========================================
-- CORREÇÃO SIMPLES: FUNCIONÁRIOS DOS DEPARTAMENTOS
-- ========================================

-- PROBLEMA: O botão "Funcionários" nos cards não mostra nada
-- CAUSA: Tabela user_departments está vazia ou incompleta
-- SOLUÇÃO: Adicionar os dados necessários

-- PASSO 1: Verificar estado atual
SELECT 
    'ANTES DA CORREÇÃO' as etapa,
    (SELECT COUNT(*) FROM departments) as total_departamentos,
    (SELECT COUNT(*) FROM user_departments) as total_relacionamentos,
    (SELECT COUNT(*) FROM departments WHERE manager_id IS NOT NULL) as departamentos_com_gerente;

-- PASSO 2: Adicionar gerentes como funcionários dos seus departamentos
-- (Isso é essencial para que apareçam na lista de funcionários)
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

-- PASSO 3: Verificar quantos gerentes foram adicionados
SELECT 
    'GERENTES ADICIONADOS' as resultado,
    COUNT(*) as quantidade
FROM user_departments
WHERE notes = 'Gerente adicionado automaticamente';

-- PASSO 4: Adicionar alguns funcionários extras para teste (opcional)
-- Pegar usuários que não têm departamento e adicionar aos primeiros departamentos
WITH usuarios_disponiveis AS (
    SELECT 
        p.id,
        p.full_name,
        p.entity_id,
        ROW_NUMBER() OVER (PARTITION BY p.entity_id ORDER BY p.created_at) as rn
    FROM profiles p
    WHERE NOT EXISTS (
        SELECT 1 FROM user_departments ud WHERE ud.user_id = p.id
    )
),
departamentos_ordenados AS (
    SELECT 
        d.id,
        d.name,
        d.entity_id,
        ROW_NUMBER() OVER (PARTITION BY d.entity_id ORDER BY d.created_at) as dept_rn
    FROM departments d
    WHERE d.status = 'active'
)
INSERT INTO user_departments (user_id, department_id, role_in_department, is_primary, assigned_at, notes)
SELECT 
    ud.id,
    do.id,
    'member',
    false,
    NOW(),
    'Funcionário de teste'
FROM usuarios_disponiveis ud
JOIN departamentos_ordenados do ON ud.entity_id = do.entity_id
WHERE ud.rn <= 3 AND do.dept_rn <= 2  -- Máximo 3 usuários, primeiros 2 departamentos por entidade
LIMIT 6;  -- Limitar total de inserções

-- PASSO 5: Verificar resultado final
SELECT 
    'APÓS CORREÇÃO' as etapa,
    d.name as department_name,
    d.entity_id,
    COUNT(ud.user_id) as total_funcionarios,
    STRING_AGG(
        p.full_name || ' (' || ud.role_in_department || ')', 
        ', ' 
        ORDER BY ud.is_primary DESC, p.full_name
    ) as funcionarios
FROM departments d
LEFT JOIN user_departments ud ON d.id = ud.department_id
LEFT JOIN profiles p ON ud.user_id = p.id
GROUP BY d.id, d.name, d.entity_id
ORDER BY d.name;

-- PASSO 6: Verificar se ainda há usuários sem departamento
SELECT 
    'USUÁRIOS AINDA DISPONÍVEIS' as info,
    COUNT(*) as quantidade,
    STRING_AGG(p.full_name, ', ' ORDER BY p.full_name) as nomes
FROM profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM user_departments ud WHERE ud.user_id = p.id
);

-- PASSO 7: Resumo final
SELECT 
    'RESUMO FINAL' as categoria,
    'Departamentos com funcionários' as metrica,
    COUNT(*) as valor
FROM departments d
WHERE EXISTS (
    SELECT 1 FROM user_departments ud WHERE ud.department_id = d.id
)
UNION ALL
SELECT 
    'RESUMO FINAL',
    'Total de relacionamentos criados',
    COUNT(*)
FROM user_departments
UNION ALL
SELECT 
    'RESUMO FINAL',
    'Funcionários únicos alocados',
    COUNT(DISTINCT user_id)
FROM user_departments;

-- INSTRUÇÕES:
-- 1. Execute este script
-- 2. Vá para a página de departamentos
-- 3. Clique no botão "Funcionários" de qualquer departamento
-- 4. Agora deve mostrar pelo menos o gerente do departamento