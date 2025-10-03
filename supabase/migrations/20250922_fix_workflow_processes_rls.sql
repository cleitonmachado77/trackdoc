-- Corrigir políticas RLS para permitir criação de processos
-- Remover políticas existentes que estão bloqueando a inserção
DROP POLICY IF EXISTS "Users can insert their own workflow processes" ON workflow_processes;
DROP POLICY IF EXISTS "Users can view their own workflow processes" ON workflow_processes;
DROP POLICY IF EXISTS "Users can update their own workflow processes" ON workflow_processes;

-- Criar novas políticas RLS mais permissivas
-- Política para INSERT: Permitir que usuários autenticados criem processos
CREATE POLICY "Authenticated users can create workflow processes" ON workflow_processes
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = started_by);

-- Política para SELECT: Permitir que usuários vejam processos que criaram ou estão envolvidos
CREATE POLICY "Users can view workflow processes they are involved in" ON workflow_processes
FOR SELECT 
TO authenticated
USING (
  auth.uid() = started_by OR
  auth.uid() IN (
    SELECT assigned_to FROM workflow_executions 
    WHERE process_id = workflow_processes.id
  )
);

-- Política para UPDATE: Permitir que usuários atualizem processos que criaram
CREATE POLICY "Users can update their own workflow processes" ON workflow_processes
FOR UPDATE 
TO authenticated
USING (auth.uid() = started_by)
WITH CHECK (auth.uid() = started_by);

-- Política para DELETE: Permitir que usuários deletem processos que criaram
CREATE POLICY "Users can delete their own workflow processes" ON workflow_processes
FOR DELETE 
TO authenticated
USING (auth.uid() = started_by);
