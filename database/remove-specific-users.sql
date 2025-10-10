-- ============================================================================
-- REMOVER USUÁRIOS ESPECÍFICOS SEM PERFIL
-- ============================================================================

-- Lista dos usuários que devem ser removidos (baseado na sua consulta)
-- d1cd86a2-5c65-4e4b-a6d5-ab1f91330f4f - cleitoncr76&@gmail.com
-- 7943c9c3-fd52-4131-a254-f50f17cc2df1 - joaoricardofcunha@gmail.com  
-- 7a5bf72c-ab4f-47f6-b34a-f6554738f757 - contato@govtalk.com.br
-- 1ab54ee5-5032-4178-a603-60178e7ddd22 - gamingvorex@gmail.com
-- 1e4799e6-d473-4ffd-ad43-fb669af58be5 - cleitoncr767@gmail.com

-- 1. REMOVER TRIGGER PRIMEIRO
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. LIMPAR REFERÊNCIAS DESSES USUÁRIOS ESPECÍFICOS

-- Chat
DELETE FROM chat_message_reads WHERE user_id IN (
    'd1cd86a2-5c65-4e4b-a6d5-ab1f91330f4f',
    '7943c9c3-fd52-4131-a254-f50f17cc2df1',
    '7a5bf72c-ab4f-47f6-b34a-f6554738f757',
    '1ab54ee5-5032-4178-a603-60178e7ddd22',
    '1e4799e6-d473-4ffd-ad43-fb669af58be5'
);

DELETE FROM chat_messages WHERE sender_id IN (
    'd1cd86a2-5c65-4e4b-a6d5-ab1f91330f4f',
    '7943c9c3-fd52-4131-a254-f50f17cc2df1',
    '7a5bf72c-ab4f-47f6-b34a-f6554738f757',
    '1ab54ee5-5032-4178-a603-60178e7ddd22',
    '1e4799e6-d473-4ffd-ad43-fb669af58be5'
);

DELETE FROM chat_participants WHERE user_id IN (
    'd1cd86a2-5c65-4e4b-a6d5-ab1f91330f4f',
    '7943c9c3-fd52-4131-a254-f50f17cc2df1',
    '7a5bf72c-ab4f-47f6-b34a-f6554738f757',
    '1ab54ee5-5032-4178-a603-60178e7ddd22',
    '1e4799e6-d473-4ffd-ad43-fb669af58be5'
);

DELETE FROM chat_conversations WHERE created_by IN (
    'd1cd86a2-5c65-4e4b-a6d5-ab1f91330f4f',
    '7943c9c3-fd52-4131-a254-f50f17cc2df1',
    '7a5bf72c-ab4f-47f6-b34a-f6554738f757',
    '1ab54ee5-5032-4178-a603-60178e7ddd22',
    '1e4799e6-d473-4ffd-ad43-fb669af58be5'
);

-- Documentos e assinaturas
DELETE FROM document_signatures WHERE user_id IN (
    'd1cd86a2-5c65-4e4b-a6d5-ab1f91330f4f',
    '7943c9c3-fd52-4131-a254-f50f17cc2df1',
    '7a5bf72c-ab4f-47f6-b34a-f6554738f757',
    '1ab54ee5-5032-4178-a603-60178e7ddd22',
    '1e4799e6-d473-4ffd-ad43-fb669af58be5'
);

DELETE FROM multi_signature_approvals WHERE user_id IN (
    'd1cd86a2-5c65-4e4b-a6d5-ab1f91330f4f',
    '7943c9c3-fd52-4131-a254-f50f17cc2df1',
    '7a5bf72c-ab4f-47f6-b34a-f6554738f757',
    '1ab54ee5-5032-4178-a603-60178e7ddd22',
    '1e4799e6-d473-4ffd-ad43-fb669af58be5'
);

DELETE FROM multi_signature_requests WHERE requester_id IN (
    'd1cd86a2-5c65-4e4b-a6d5-ab1f91330f4f',
    '7943c9c3-fd52-4131-a254-f50f17cc2df1',
    '7a5bf72c-ab4f-47f6-b34a-f6554738f757',
    '1ab54ee5-5032-4178-a603-60178e7ddd22',
    '1e4799e6-d473-4ffd-ad43-fb669af58be5'
);

-- Limpar referências em outras tabelas
UPDATE documents SET author_id = NULL WHERE author_id IN (
    'd1cd86a2-5c65-4e4b-a6d5-ab1f91330f4f',
    '7943c9c3-fd52-4131-a254-f50f17cc2df1',
    '7a5bf72c-ab4f-47f6-b34a-f6554738f757',
    '1ab54ee5-5032-4178-a603-60178e7ddd22',
    '1e4799e6-d473-4ffd-ad43-fb669af58be5'
);

UPDATE entities SET admin_user_id = NULL WHERE admin_user_id IN (
    'd1cd86a2-5c65-4e4b-a6d5-ab1f91330f4f',
    '7943c9c3-fd52-4131-a254-f50f17cc2df1',
    '7a5bf72c-ab4f-47f6-b34a-f6554738f757',
    '1ab54ee5-5032-4178-a603-60178e7ddd22',
    '1e4799e6-d473-4ffd-ad43-fb669af58be5'
);

UPDATE departments SET manager_id = NULL WHERE manager_id IN (
    'd1cd86a2-5c65-4e4b-a6d5-ab1f91330f4f',
    '7943c9c3-fd52-4131-a254-f50f17cc2df1',
    '7a5bf72c-ab4f-47f6-b34a-f6554738f757',
    '1ab54ee5-5032-4178-a603-60178e7ddd22',
    '1e4799e6-d473-4ffd-ad43-fb669af58be5'
);

UPDATE audit_logs SET user_id = NULL WHERE user_id IN (
    'd1cd86a2-5c65-4e4b-a6d5-ab1f91330f4f',
    '7943c9c3-fd52-4131-a254-f50f17cc2df1',
    '7a5bf72c-ab4f-47f6-b34a-f6554738f757',
    '1ab54ee5-5032-4178-a603-60178e7ddd22',
    '1e4799e6-d473-4ffd-ad43-fb669af58be5'
);

-- 3. REMOVER PERFIS (se existirem)
DELETE FROM profiles WHERE id IN (
    'd1cd86a2-5c65-4e4b-a6d5-ab1f91330f4f',
    '7943c9c3-fd52-4131-a254-f50f17cc2df1',
    '7a5bf72c-ab4f-47f6-b34a-f6554738f757',
    '1ab54ee5-5032-4178-a603-60178e7ddd22',
    '1e4799e6-d473-4ffd-ad43-fb669af58be5'
);

-- 4. REMOVER USUÁRIOS DO AUTH
DELETE FROM auth.users WHERE id IN (
    'd1cd86a2-5c65-4e4b-a6d5-ab1f91330f4f',
    '7943c9c3-fd52-4131-a254-f50f17cc2df1',
    '7a5bf72c-ab4f-47f6-b34a-f6554738f757',
    '1ab54ee5-5032-4178-a603-60178e7ddd22',
    '1e4799e6-d473-4ffd-ad43-fb669af58be5'
);

-- 5. VERIFICAR SE FORAM REMOVIDOS
SELECT 
    (SELECT COUNT(*) FROM auth.users) as usuarios_restantes,
    (SELECT COUNT(*) FROM profiles) as perfis_restantes,
    'USUÁRIOS ESPECÍFICOS REMOVIDOS' as status;

-- 6. LISTAR USUÁRIOS RESTANTES (se houver)
SELECT 
    u.id,
    u.email,
    u.created_at,
    CASE 
        WHEN EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)
        THEN 'COM PERFIL ✅'
        ELSE 'SEM PERFIL ❌'
    END as status_perfil
FROM auth.users u
ORDER BY u.created_at DESC;