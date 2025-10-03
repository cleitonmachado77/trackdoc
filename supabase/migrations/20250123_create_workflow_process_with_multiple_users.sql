-- Função RPC personalizada que cria processo e execuções com suporte a múltiplos usuários alvo
CREATE OR REPLACE FUNCTION create_workflow_process_with_multiple_users(
  p_workflow_template_id UUID,
  p_document_id UUID,
  p_process_name TEXT,
  p_started_by UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com permissões do criador da função
AS $$
DECLARE
  v_process_id UUID;
  v_step RECORD;
  v_execution_id UUID;
  v_target_user_id UUID;
BEGIN
  -- 1. Gerar ID único para o processo
  v_process_id := gen_random_uuid();
  
  -- 2. Inserir processo na tabela workflow_processes
  INSERT INTO workflow_processes (
    id,
    workflow_template_id,
    document_id,
    process_name,
    started_by,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_process_id,
    p_workflow_template_id,
    p_document_id,
    p_process_name,
    p_started_by,
    'active',
    NOW(),
    NOW()
  );
  
  -- 3. Buscar todos os passos do template
  FOR v_step IN 
    SELECT * FROM workflow_steps 
    WHERE workflow_template_id = p_workflow_template_id 
    ORDER BY step_order
  LOOP
    -- Para nós de usuário: criar uma execução para o usuário específico
    IF v_step.step_type = 'user' AND v_step.user_id IS NOT NULL THEN
      v_execution_id := gen_random_uuid();
      
      INSERT INTO workflow_executions (
        id,
        process_id,
        step_id,
        assigned_to,
        status,
        created_at,
        updated_at
      ) VALUES (
        v_execution_id,
        v_process_id,
        v_step.id,
        v_step.user_id,
        'pending',
        NOW(),
        NOW()
      );
    END IF;
    
    -- Para nós de ação: criar execuções para cada usuário alvo
    IF v_step.step_type = 'action' AND v_step.action_data IS NOT NULL THEN
      -- Extrair usuários alvo do action_data
      FOR v_target_user_id IN 
        SELECT jsonb_array_elements_text(v_step.action_data->'targetUsers')::UUID
      LOOP
        v_execution_id := gen_random_uuid();
        
        INSERT INTO workflow_executions (
          id,
          process_id,
          step_id,
          assigned_to,
          status,
          created_at,
          updated_at
        ) VALUES (
          v_execution_id,
          v_process_id,
          v_step.id,
          v_target_user_id,
          'pending',
          NOW(),
          NOW()
        );
      END LOOP;
    END IF;
  END LOOP;
  
  -- 4. Retornar ID do processo criado
  RETURN v_process_id;
END;
$$;
