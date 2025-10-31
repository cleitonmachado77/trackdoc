-- Correção do status dos documentos baseado no campo approval_required
-- Documentos com approval_required = false devem ter status 'approved'
-- Documentos com approval_required = true devem seguir o fluxo de aprovação

-- PASSO 1: Verificar documentos com status inconsistente
SELECT 
    'DIAGNÓSTICO - Status inconsistente' as info,
    d.id,
    d.title,
    d.status,
    d.approval_required,
    d.created_at,
    COUNT(a.id) as total_aprovacoes,
    COUNT(CASE WHEN a.status = 'approved' THEN 1 END) as aprovacoes_aprovadas,
    COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as aprovacoes_pendentes,
    COUNT(CASE WHEN a.status = 'rejected' THEN 1 END) as aprovacoes_rejeitadas,
    CASE 
        WHEN d.approval_required = false THEN 'DEVERIA SER: approved'
        WHEN d.approval_required = true AND COUNT(a.id) = 0 THEN 'DEVERIA SER: pending_approval (sem aprovações criadas)'
        WHEN d.approval_required = true AND COUNT(CASE WHEN a.status = 'rejected' THEN 1 END) > 0 THEN 'DEVERIA SER: rejected'
        WHEN d.approval_required = true AND COUNT(CASE WHEN a.status = 'pending' THEN 1 END) > 0 THEN 'DEVERIA SER: pending_approval'
        WHEN d.approval_required = true AND COUNT(CASE WHEN a.status = 'approved' THEN 1 END) = COUNT(a.id) THEN 'DEVERIA SER: approved'
        ELSE 'STATUS OK'
    END as status_esperado
FROM documents d
LEFT JOIN approvals a ON d.id = a.document_id
GROUP BY d.id, d.title, d.status, d.approval_required, d.created_at
HAVING 
    -- Documentos sem aprovação obrigatória que não estão aprovados
    (d.approval_required = false AND d.status != 'approved')
    OR
    -- Documentos com aprovação obrigatória mas sem aprovações e não estão pending
    (d.approval_required = true AND COUNT(a.id) = 0 AND d.status != 'pending_approval')
    OR
    -- Documentos com aprovações rejeitadas que não estão como rejected
    (COUNT(CASE WHEN a.status = 'rejected' THEN 1 END) > 0 AND d.status != 'rejected')
    OR
    -- Documentos com aprovações pendentes que não estão como pending_approval
    (COUNT(CASE WHEN a.status = 'pending' THEN 1 END) > 0 AND d.status != 'pending_approval')
    OR
    -- Documentos com todas aprovações aprovadas que não estão como approved
    (d.approval_required = true AND COUNT(a.id) > 0 AND COUNT(CASE WHEN a.status = 'approved' THEN 1 END) = COUNT(a.id) AND d.status != 'approved')
ORDER BY d.created_at DESC;

-- PASSO 2: Verificar documentos que deveriam estar como 'approved'
SELECT 
    'DOCUMENTOS QUE DEVERIAM SER APROVADOS' as info,
    d.id,
    d.title,
    d.status as status_atual,
    COUNT(a.id) as total_aprovacoes,
    COUNT(CASE WHEN a.status = 'approved' THEN 1 END) as aprovacoes_aprovadas,
    COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as aprovacoes_pendentes,
    COUNT(CASE WHEN a.status = 'rejected' THEN 1 END) as aprovacoes_rejeitadas
FROM documents d
LEFT JOIN approvals a ON d.id = a.document_id
GROUP BY d.id, d.title, d.status
HAVING 
    -- Documentos sem aprovação (devem ser 'approved')
    (COUNT(a.id) = 0 AND d.status != 'approved')
    OR
    -- Documentos com todas aprovações aprovadas (devem ser 'approved')
    (COUNT(a.id) > 0 AND COUNT(CASE WHEN a.status = 'approved' THEN 1 END) = COUNT(a.id) AND d.status != 'approved')
    OR
    -- Documentos com aprovações pendentes (devem ser 'pending_approval')
    (COUNT(CASE WHEN a.status = 'pending' THEN 1 END) > 0 AND d.status != 'pending_approval')
    OR
    -- Documentos com aprovações rejeitadas (devem ser 'rejected')
    (COUNT(CASE WHEN a.status = 'rejected' THEN 1 END) > 0 AND d.status != 'rejected')
ORDER BY d.created_at DESC;

-- PASSO 3: Corrigir documentos sem aprovação obrigatória (devem ser 'approved')
UPDATE documents 
SET status = 'approved',
    updated_at = NOW()
WHERE approval_required = false 
  AND status != 'approved';

-- PASSO 4: Corrigir documentos com todas aprovações aprovadas
UPDATE documents 
SET status = 'approved',
    updated_at = NOW()
WHERE id IN (
    SELECT d.id
    FROM documents d
    INNER JOIN approvals a ON d.id = a.document_id
    WHERE d.status != 'approved'
    GROUP BY d.id
    HAVING COUNT(a.id) > 0 
       AND COUNT(CASE WHEN a.status = 'approved' THEN 1 END) = COUNT(a.id)
);

-- PASSO 5: Corrigir documentos com aprovações pendentes
UPDATE documents 
SET status = 'pending_approval',
    updated_at = NOW()
WHERE id IN (
    SELECT d.id
    FROM documents d
    INNER JOIN approvals a ON d.id = a.document_id
    WHERE d.status != 'pending_approval'
    GROUP BY d.id
    HAVING COUNT(CASE WHEN a.status = 'pending' THEN 1 END) > 0
);

-- PASSO 6: Corrigir documentos com aprovações rejeitadas
UPDATE documents 
SET status = 'rejected',
    updated_at = NOW()
WHERE id IN (
    SELECT d.id
    FROM documents d
    INNER JOIN approvals a ON d.id = a.document_id
    WHERE d.status != 'rejected'
    GROUP BY d.id
    HAVING COUNT(CASE WHEN a.status = 'rejected' THEN 1 END) > 0
);

-- PASSO 7: Verificação final - mostrar status após correção
SELECT 
    'VERIFICAÇÃO FINAL' as info,
    d.status,
    COUNT(*) as total_documentos,
    COUNT(CASE WHEN a.id IS NULL THEN 1 END) as sem_aprovacao,
    COUNT(CASE WHEN a.status = 'approved' THEN 1 END) as com_aprovacao_aprovada,
    COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as com_aprovacao_pendente,
    COUNT(CASE WHEN a.status = 'rejected' THEN 1 END) as com_aprovacao_rejeitada
FROM documents d
LEFT JOIN approvals a ON d.id = a.document_id
GROUP BY d.status
ORDER BY d.status;

-- PASSO 8: Listar alguns exemplos após correção
SELECT 
    'EXEMPLOS APÓS CORREÇÃO' as info,
    d.id,
    d.title,
    d.status,
    COUNT(a.id) as total_aprovacoes,
    STRING_AGG(a.status, ', ') as status_aprovacoes
FROM documents d
LEFT JOIN approvals a ON d.id = a.document_id
GROUP BY d.id, d.title, d.status
ORDER BY d.created_at DESC
LIMIT 10;