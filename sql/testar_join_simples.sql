-- ========================================
-- TESTE SIMPLES: JOIN ENTIDADE
-- ========================================

-- Verificar se a entidade existe
SELECT 
    'ENTIDADE EXISTE?' as teste,
    COUNT(*) as resultado
FROM entities 
WHERE id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52';

-- Verificar dados da entidade
SELECT 
    'DADOS DA ENTIDADE' as teste,
    id,
    name,
    legal_name
FROM entities 
WHERE id = 'cdba1355-4ea9-4e3c-8f7a-c282f8c3ad52';

-- Testar JOIN simples
SELECT 
    'JOIN SIMPLES' as teste,
    p.full_name,
    p.entity_id,
    e.name as entity_name
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
WHERE p.email = 'cleitoncr767@gmail.com';

-- Testar consulta exata da página "Minha Conta"
SELECT 
    'CONSULTA EXATA DA PÁGINA' as teste,
    p.*,
    e.name as entity_name,
    e.legal_name as entity_legal_name,
    d.name as department_name
FROM profiles p
LEFT JOIN entities e ON p.entity_id = e.id
LEFT JOIN departments d ON p.department_id = d.id
WHERE p.id = 'e35098e0-b687-41fa-95cb-830c6bb4b86d';