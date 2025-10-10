-- 🔍 SQL para verificar se as políticas RLS foram aplicadas corretamente

-- 1. Verificar todas as políticas da tabela profiles
SELECT 
    schemaname,
    tablename, 
    policyname, 
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname;

-- 2. Verificar se RLS está habilitado na tabela profiles
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    forcerowsecurity as force_rls
FROM pg_tables 
WHERE tablename = 'profiles';

-- 3. Testar se as políticas estão funcionando
-- (Execute este comando como um usuário admin de entidade)
SELECT 
    'Teste de política' as teste,
    current_user as usuario_atual,
    auth.uid() as user_id;

-- 4. Se as políticas não estiverem funcionando, recriar elas:
-- (Descomente e execute se necessário)

/*
-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Entity admins can create profiles for their entity users" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile or entity admins can update entity users" ON profiles;

-- Recriar política de INSERT
CREATE POLICY "Entity admins can create profiles for their entity users" 
ON profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (
  -- Permitir se é o próprio usuário criando seu perfil
  auth.uid() = id
  OR
  -- Ou se o usuário logado é admin de uma entidade e está criando para sua entidade
  EXISTS (
    SELECT 1 
    FROM profiles admin_profile 
    JOIN entities e ON e.admin_user_id = admin_profile.id 
    WHERE admin_profile.id = auth.uid() 
    AND e.id = entity_id
  )
);

-- Recriar política de UPDATE
CREATE POLICY "Users can update their own profile or entity admins can update entity users" 
ON profiles 
FOR UPDATE 
TO authenticated 
USING (
  -- Próprio usuário pode atualizar seu perfil
  auth.uid() = id 
  OR 
  -- Admin da entidade pode atualizar perfis de usuários da sua entidade
  EXISTS (
    SELECT 1 
    FROM profiles admin_profile 
    JOIN entities e ON e.admin_user_id = admin_profile.id 
    WHERE admin_profile.id = auth.uid() 
    AND e.id = entity_id
  )
);

-- Manter políticas existentes de SELECT e DELETE
CREATE POLICY IF NOT EXISTS "Users can view profiles" 
ON profiles 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY IF NOT EXISTS "Users can delete profiles" 
ON profiles 
FOR DELETE 
TO authenticated 
USING (true);
*/