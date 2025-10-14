-- Script para testar o sistema de aprovações
-- Execute este script no SQL Editor do Supabase para verificar se tudo está funcionando

-- 1. Verificar estrutura das tabelas
SELECT 
    'approval_requests' as tabela,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'approval_requests' 
ORDER BY ordinal_position;

-- 2. Verificar foreign keys
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'approval_requests';

-- 3. Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'approval_requests';

-- 4. Verificar dados existentes
SELECT 
    'Dados existentes' as verificacao,
    (SELECT COUNT(*) FROM approval_requests) as total_approval_requests,
    (SELECT COUNT(*) FROM approval_requests WHERE status = 'pending') as pending_approvals,
    (SELECT COUNT(*) FROM documents WHERE status = 'pending_approval') as docs_pending_approval,
    (SELECT COUNT(*) FROM profiles) as total_profiles,
    (SELECT COUNT(*) FROM notifications) as total_notifications;

-- 5. Verificar se há approval_requests órfãos (sem documento ou aprovador)
SELECT 
    'Approval requests órfãos' as problema,
    COUNT(*) as quantidade
FROM approval_requests ar
WHERE ar.document_id IS NULL 
   OR ar.approver_id IS NULL
   OR NOT EXISTS (SELECT 1 FROM documents d WHERE d.id = ar.document_id)
   OR NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = ar.approver_id);

-- 6. Verificar documentos com status pending_approval mas sem approval_requests
SELECT 
    'Documentos sem approval_requests' as problema,
    COUNT(*) as quantidade
FROM documents d
WHERE d.status = 'pending_approval'
  AND NOT EXISTS (
    SELECT 1 FROM approval_requests ar 
    WHERE ar.document_id = d.id AND ar.status = 'pending'
  );

-- 7. Listar approval_requests pendentes com detalhes
SELECT 
    ar.id,
    ar.document_id,
    d.title as document_title,
    ar.approver_id,
    p.full_name as approver_name,
    p.email as approver_email,
    ar.status,
    ar.created_at
FROM approval_requests ar
LEFT JOIN documents d ON ar.document_id = d.id
LEFT JOIN profiles p ON ar.approver_id = p.id
WHERE ar.status = 'pending'
ORDER BY ar.created_at DESC
LIMIT 10;

-- 8. Verificar triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'approval_requests';

-- 9. Testar se as funções existem
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_name IN ('notify_approval_request', 'notify_approval_processed')
ORDER BY routine_name;