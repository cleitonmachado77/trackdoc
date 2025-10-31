-- ========================================
-- DIAGNÓSTICO: POR QUE O JOIN COM ENTIDADE NÃO FUNCIONA
-- ========================================

-- Problema: Usuário tem entity_id preenchido mas a página mostra "Usuário Individual"
-- Objetivo: Verificar se a entidade existe e por que o JOIN falha

-- 1. Verificar se a entidade existe para o entity_id do usuário
SELECT 
    'ENTIDADE EXISTE?' as categoria,
    e.id,
    e.name,
    e.legal_name,
    e.created_at,
    '✅ Entidade encontrada' as status
FROM entities e
WHERE e.id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52'
UNION ALL
SELECT 
    'ENTIDADE EXISTE?',
    'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52',
    'N/A',
    'N/A',
    NULL,
    '❌ Entidade NÃO encontrada'
WHERE NOT EXISTS (
    SELECT 1 FROM entities WHERE id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52'
);

-- 2. Verificar dados do usuário
SELECT 
    'DADOS DO USUÁRIO' as categoria,
    p.id,
    p.full_name,
    p.email,
    p.entity_id,
    p.registration_type,
    p.role,
    'Dados do perfil' as observacao
FROM profiles p
WHERE p.email = 'cleitoncr767@gmail.com';

-- 3. Testar o JOIN exatamente como a página "Minha Conta" faz
SELECT 
    'TESTE JOIN PÁGINA MINHA CONTA' as categoria,
    p.full_name,
    p.email,
    p.entity_id,
    e.id as entity_id_join,
    e.name as entity_name,
    e.legal_name as entity_legal_name,
    -- Resultado que aparece na tela
    CASE 
        WHEN e.name IS NOT NULL THEN e.name
        ELSE 'Usuário Individual'
    END as resultado_tela
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
WHERE p.email = 'cleitoncr767@gmail.com';

-- 4. Verificar se há problema de tipo de dados (UUID vs TEXT)
SELECT 
    'VERIFICAR TIPOS DE DADOS' as categoria,
    pg_typeof(p.entity_id) as tipo_entity_id_profile,
    pg_typeof(e.id) as tipo_id_entity,
    p.entity_id::text as entity_id_como_texto,
    e.id::text as entity_id_entity_como_texto
FROM profiles p
CROSS JOIN entities e
WHERE p.email = 'cleitoncr767@gmail.com'
  AND e.id::text = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52'
LIMIT 1;

-- 5. Listar todas as entidades disponíveis
SELECT 
    'TODAS AS ENTIDADES' as categoria,
    e.id,
    e.name,
    e.legal_name,
    e.created_at
FROM entities e
ORDER BY e.created_at;

-- 6. Verificar se há usuários vinculados a cada entidade
SELECT 
    'USUÁRIOS POR ENTIDADE' as categoria,
    e.name as entity_name,
    e.id as entity_id,
    COUNT(p.id) as total_usuarios,
    STRING_AGG(p.full_name, ', ' ORDER BY p.full_name) as usuarios
FROM entities e
LEFT JOIN profiles p ON e.id = p.entity_id
GROUP BY e.id, e.name
ORDER BY e.name;

-- 7. Verificar se o problema é específico do seu usuário
SELECT 
    'OUTROS USUÁRIOS ENTITY_ADMIN' as categoria,
    p.full_name,
    p.email,
    p.entity_id,
    e.name as entity_name,
    CASE 
        WHEN e.name IS NOT NULL THEN '✅ JOIN funcionou'
        ELSE '❌ JOIN falhou'
    END as status_join
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
WHERE p.registration_type = 'entity_admin'
ORDER BY status_join DESC, p.full_name;

-- 8. Verificar se há caracteres especiais ou espaços no entity_id
SELECT 
    'VERIFICAR CARACTERES ESPECIAIS' as categoria,
    p.entity_id,
    LENGTH(p.entity_id::text) as tamanho_entity_id,
    TRIM(p.entity_id::text) as entity_id_sem_espacos,
    p.entity_id::text = TRIM(p.entity_id::text) as sem_espacos_extras
FROM profiles p
WHERE p.email = 'cleitoncr767@gmail.com';

-- 9. Forçar JOIN com conversão explícita de tipos
SELECT 
    'JOIN COM CONVERSÃO EXPLÍCITA' as categoria,
    p.full_name,
    p.entity_id::text as entity_id_profile,
    e.id::text as entity_id_entity,
    e.name as entity_name,
    CASE 
        WHEN e.name IS NOT NULL THEN '✅ JOIN funcionou com conversão'
        ELSE '❌ JOIN ainda falhou'
    END as status
FROM profiles p
LEFT JOIN entities e ON p.entity_id::text = e.id::text
WHERE p.email = 'cleitoncr767@gmail.com';

-- 10. Verificar se a consulta da página está correta
-- Esta é exatamente a consulta que a página "Minha Conta" deveria fazer
SELECT 
    'CONSULTA FINAL CORRETA' as categoria,
    p.*,
    e.name as entity_name,
    e.legal_name as entity_legal_name,
    d.name as department_name
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
LEFT JOIN departments d ON p.department_id = d.id
WHERE p.email = 'cleitoncr767@gmail.com';