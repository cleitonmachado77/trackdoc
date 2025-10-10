-- 🔧 SQL para corrigir políticas RLS da tabela profiles
-- Permite que admins de entidade criem perfis para usuários da sua entidade

-- 1. Criar política para permitir que admins de entidade insiram perfis
CREATE POLICY "Entity admins can create profiles for their entity users" 
ON profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (
  -- Permitir se o usuário logado é admin de uma entidade
  EXISTS (
    SELECT 1 
    FROM profiles admin_profile 
    JOIN entities e ON e.admin_user_id = admin_profile.id 
    WHERE admin_profile.id = auth.uid() 
    AND e.id = entity_id
  )
  OR
  -- Ou se é o próprio usuário criando seu perfil (política existente)
  auth.uid() = id
);

-- 2. Atualizar política de UPDATE para permitir que admins atualizem perfis da entidade
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

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

-- 3. Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname;