-- Função RPC universal para criar execuções de workflow
-- Primeiro, remover a função existente se ela existir
DROP FUNCTION IF EXISTS criar_execucoes_workflow_universal(uuid,uuid,uuid,uuid[]);

-- Criar a nova função
CREATE OR REPLACE FUNCTION criar_execucoes_workflow_universal(
  p_process_id UUID,
  p_step_id UUID,
  p_department_id UUID,
  p_selected_users UUID[] DEFAULT NULL
)
RETURNS TABLE(
  execution_id UUID,
  assigned_to UUID,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_step RECORD;
  v_user_id UUID;
  v_execution_id UUID;
  v_users_to_create UUID[];
BEGIN
  -- Buscar informações do step
  SELECT * INTO v_step
  FROM workflow_steps
  WHERE id = p_step_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Step não encontrado: %', p_step_id;
  END IF;
  
  -- Determinar usuários para criar execuções
  IF p_selected_users IS NOT NULL AND array_length(p_selected_users, 1) > 0 THEN
    -- Usar usuários selecionados
    v_users_to_create := p_selected_users;
  ELSIF v_step.step_type = 'action' AND v_step.action_data IS NOT NULL THEN
    -- Extrair usuários do action_data
    SELECT ARRAY(
      SELECT jsonb_array_elements_text(v_step.action_data->'targetUsers')::UUID
    ) INTO v_users_to_create;
  ELSIF v_step.step_type = 'user' AND v_step.user_id IS NOT NULL THEN
    -- Usuário único
    v_users_to_create := ARRAY[v_step.user_id];
  ELSIF p_department_id IS NOT NULL THEN
    -- Usar todos os usuários do departamento
    SELECT ARRAY(
      SELECT id FROM profiles 
      WHERE entity_id = p_department_id 
      AND status = 'active'
    ) INTO v_users_to_create;
  ELSE
    RAISE EXCEPTION 'Nenhum usuário encontrado para criar execuções';
  END IF;
  
  -- Verificar se já existem execuções para evitar duplicatas
  DELETE FROM workflow_executions
  WHERE process_id = p_process_id 
  AND step_id = p_step_id 
  AND assigned_to = ANY(v_users_to_create)
  AND status = 'pending';
  
  -- Criar execuções para cada usuário
  FOREACH v_user_id IN ARRAY v_users_to_create
  LOOP
    v_execution_id := gen_random_uuid();
    
    INSERT INTO workflow_executions (
      id,
      process_id,
      step_id,
      assigned_to,
      assigned_department_id,
      status,
      created_at,
      updated_at
    ) VALUES (
      v_execution_id,
      p_process_id,
      p_step_id,
      v_user_id,
      p_department_id,
      'pending',
      NOW(),
      NOW()
    );
    
    -- Retornar dados da execução criada
    execution_id := v_execution_id;
    assigned_to := v_user_id;
    status := 'pending';
    RETURN NEXT;
  END LOOP;
END;
$$;
