-- Rebuild workflow schema and core routines
set search_path = public;

-- 1. Drop legacy functions (ignore missing)
drop function if exists start_workflow_process(uuid, uuid, text, uuid);
drop function if exists start_workflow_process_corrected(uuid, uuid, text, uuid);
drop function if exists criar_execucoes_definitiva(uuid, uuid, uuid, uuid[]);
drop function if exists criar_execucoes_final_definitiva(uuid, uuid, uuid);
drop function if exists criar_execucoes_para_cleiton_e_luana(uuid, uuid, uuid);
drop function if exists criar_execucoes_para_usuarios_selecionados_v2(uuid, uuid, uuid, uuid[]);
drop function if exists criar_execucoes_workflow_universal(uuid, uuid, uuid, uuid[]);
drop function if exists advance_workflow_step(uuid, uuid, text, text);
drop function if exists execute_workflow_step(uuid, uuid, text);
drop function if exists execute_workflow_step(uuid, uuid, text, text);
drop function if exists execute_workflow_step(uuid, uuid, text, text, uuid);
drop function if exists trigger_assign_execution();
drop function if exists trigger_cleanup_orphaned_executions();
drop function if exists trigger_interpret_new_execution();
drop function if exists trigger_interpret_new_process();
drop function if exists trigger_prevent_duplicate_executions();
drop function if exists notify_step_completion();
drop function if exists workflow_rest_list_processes(uuid, text);

-- 2. Drop legacy tables (cascade ensures dependant views are removed)
drop table if exists workflow_notifications cascade;
drop table if exists workflow_logs cascade;
drop table if exists workflow_executions cascade;
drop table if exists workflow_processes cascade;
drop table if exists workflow_template_transitions cascade;
drop table if exists workflow_template_steps cascade;
drop table if exists workflow_templates cascade;

-- 4. Utility function for updated_at
create or replace function set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 5. Core tables

create table workflow_templates (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid references entities(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'active', 'inactive')),
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_workflow_templates_entity on workflow_templates(entity_id);
create index idx_workflow_templates_created_by on workflow_templates(created_by);
create index idx_workflow_templates_status on workflow_templates(status);

create table workflow_template_steps (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references workflow_templates(id) on delete cascade,
  step_order int not null,
  type text not null check (type in ('user', 'action')),
  name text not null,
  metadata jsonb not null default '{}'::jsonb,
  ui_position jsonb not null default jsonb_build_object('x', 0, 'y', 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(template_id, step_order)
);

create index idx_wts_template on workflow_template_steps(template_id);
create index idx_wts_type on workflow_template_steps(type);

create table workflow_template_transitions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references workflow_templates(id) on delete cascade,
  from_step_id uuid not null references workflow_template_steps(id) on delete cascade,
  to_step_id uuid not null references workflow_template_steps(id) on delete cascade,
  condition text not null default 'always' check (condition in ('always', 'approved', 'rejected', 'custom')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_wtt_template on workflow_template_transitions(template_id);
create index idx_wtt_from_step on workflow_template_transitions(from_step_id);

create table workflow_processes (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references workflow_templates(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  name text not null,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled', 'paused')),
  current_step_id uuid references workflow_template_steps(id) on delete set null,
  started_by uuid not null references profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_wp_template on workflow_processes(template_id);
create index idx_wp_document on workflow_processes(document_id);
create index idx_wp_status on workflow_processes(status);
create index idx_wp_current_step on workflow_processes(current_step_id);

create table workflow_executions (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references workflow_processes(id) on delete cascade,
  step_id uuid not null references workflow_template_steps(id) on delete cascade,
  assigned_to uuid references profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'skipped', 'cancelled')),
  action_taken text,
  comments text,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_we_process on workflow_executions(process_id);
create index idx_we_step on workflow_executions(step_id);
create index idx_we_assigned on workflow_executions(assigned_to);
create index idx_we_status on workflow_executions(status);

create table workflow_logs (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references workflow_processes(id) on delete cascade,
  execution_id uuid references workflow_executions(id) on delete set null,
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_wl_process on workflow_logs(process_id);
create index idx_wl_execution on workflow_logs(execution_id);

-- 6. Notification views (legacy compatibility)

create view workflow_notification_inbox as
select
  wl.id,
  (wl.details ->> 'userId')::uuid as user_id,
  wl.process_id,
  wl.execution_id,
  wl.action as type,
  coalesce(wl.details ->> 'title', wl.action) as title,
  coalesce(wl.details ->> 'message', '') as message,
  coalesce((wl.details ->> 'is_read')::boolean, false) as is_read,
  wl.created_at
from workflow_logs wl
where wl.action in ('assignment', 'reminder', 'completion', 'error')
  and (wl.details ->> 'userId') is not null;

create view workflow_notification_feed as
select
  wl.id,
  wl.process_id,
  wl.execution_id,
  wl.action as type,
  coalesce(wl.details ->> 'title', wl.action) as title,
  coalesce(wl.details ->> 'message', '') as message,
  coalesce((wl.details ->> 'is_read')::boolean, false) as is_read,
  wl.created_at,
  wp.name as process_name,
  d.title as document_title,
  wts.name as step_name,
  (wl.details ->> 'userId')::uuid as user_id
from workflow_logs wl
left join workflow_processes wp on wp.id = wl.process_id
left join documents d on d.id = wp.document_id
left join workflow_executions we on we.id = wl.execution_id
left join workflow_template_steps wts on wts.id = we.step_id
where wl.action in ('assignment', 'reminder', 'completion', 'error')
  and (wl.details ->> 'userId') is not null;

-- 6. Triggers updated_at
create trigger trg_workflow_templates_updated
before update on workflow_templates
for each row execute function set_updated_at_timestamp();

create trigger trg_workflow_template_steps_updated
before update on workflow_template_steps
for each row execute function set_updated_at_timestamp();

create trigger trg_workflow_processes_updated
before update on workflow_processes
for each row execute function set_updated_at_timestamp();

create trigger trg_workflow_executions_updated
before update on workflow_executions
for each row execute function set_updated_at_timestamp();

-- 7. Helper: log event
create or replace function workflow_log_event(
  p_process_id uuid,
  p_execution_id uuid,
  p_actor_id uuid,
  p_action text,
  p_details jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
as $$
begin
  insert into workflow_logs(process_id, execution_id, actor_id, action, details)
  values (p_process_id, p_execution_id, p_actor_id, coalesce(p_action, 'unknown'), coalesce(p_details, '{}'::jsonb));
end;
$$;

-- 8. Helper: create executions for a step
create or replace function workflow_create_step_executions(
  p_process_id uuid,
  p_step_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_step workflow_template_steps%rowtype;
  v_target jsonb;
  v_user_id uuid;
  v_users text[];
  v_user text;
begin
  select * into v_step from workflow_template_steps where id = p_step_id;
  if not found then
    raise exception 'workflow step % not found', p_step_id;
  end if;

  if v_step.type = 'user' then
    v_user_id := nullif(v_step.metadata ->> 'userId', '')::uuid;
    if v_user_id is null then
      raise exception 'User step % missing metadata.userId', v_step.id;
    end if;
    insert into workflow_executions(process_id, step_id, assigned_to, status, metadata)
    values (p_process_id, v_step.id, v_user_id, 'pending', coalesce(v_step.metadata, '{}'::jsonb));
  elsif v_step.type = 'action' then
    v_target := coalesce(v_step.metadata, '{}'::jsonb);
    v_users := array(select jsonb_array_elements_text(coalesce(v_target->'targetUsers', '[]'::jsonb)));
    if v_users is null or array_length(v_users, 1) is null then
      raise exception 'Action step % missing metadata.targetUsers', v_step.id;
    end if;
    foreach v_user in array v_users loop
      insert into workflow_executions(process_id, step_id, assigned_to, status, metadata)
      values (p_process_id, v_step.id, nullif(v_user, '')::uuid, 'pending', v_target);
    end loop;
  else
    raise exception 'Unsupported step type %', v_step.type;
  end if;
end;
$$;

-- 9. Next step resolver
create or replace function workflow_next_step(
  p_template_id uuid,
  p_current_step uuid,
  p_result text
)
returns uuid
language plpgsql
as $$
declare
  v_next uuid;
begin
  -- Prioridade: resultado específico (approved/rejected) depois always
  if p_result is not null then
    select to_step_id into v_next
    from workflow_template_transitions
    where template_id = p_template_id
      and from_step_id = p_current_step
      and condition = p_result
    limit 1;
    if v_next is not null then
      return v_next;
    end if;
  end if;

  select to_step_id into v_next
  from workflow_template_transitions
  where template_id = p_template_id
    and from_step_id = p_current_step
    and condition = 'always'
  limit 1;

  return v_next;
end;
$$;

-- 10. Start process RPC
create or replace function workflow_start_process(
  p_template_id uuid,
  p_document_id uuid,
  p_process_name text,
  p_started_by uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_process_id uuid;
  v_first_step uuid;
begin
  if p_template_id is null or p_document_id is null or p_started_by is null or coalesce(trim(p_process_name), '') = '' then
    raise exception 'Missing required parameters for start process';
  end if;

  select id
  into v_first_step
  from workflow_template_steps
  where template_id = p_template_id
  order by step_order asc
  limit 1;

  if v_first_step is null then
    raise exception 'Template % has no steps', p_template_id;
  end if;

  insert into workflow_processes(template_id, document_id, name, status, current_step_id, started_by)
  values (p_template_id, p_document_id, p_process_name, 'active', v_first_step, p_started_by)
  returning id into v_process_id;

  perform workflow_create_step_executions(v_process_id, v_first_step);
  perform workflow_log_event(v_process_id, null, p_started_by, 'process_started', jsonb_build_object('processName', p_process_name));

  return v_process_id;
end;
$$;

-- 11. Execute step RPC
create or replace function workflow_execute_step(
  p_process_id uuid,
  p_execution_id uuid,
  p_actor_id uuid,
  p_action text default null,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_execution workflow_executions%rowtype;
  v_step workflow_template_steps%rowtype;
  v_process workflow_processes%rowtype;
  v_pending int;
  v_next uuid;
  v_result text;
  v_comments text;
begin
  select * into v_execution from workflow_executions where id = p_execution_id and process_id = p_process_id;
  if not found then
    raise exception 'Execution % not found for process %', p_execution_id, p_process_id;
  end if;

  if v_execution.status <> 'pending' then
    raise exception 'Execution % is not pending', p_execution_id;
  end if;

  select * into v_step from workflow_template_steps where id = v_execution.step_id;
  select * into v_process from workflow_processes where id = p_process_id;

  if v_step.type = 'user' and v_execution.assigned_to is not null and v_execution.assigned_to <> p_actor_id then
    raise exception 'Actor % cannot complete execution assigned to %', p_actor_id, v_execution.assigned_to;
  end if;

  v_comments := coalesce(p_payload->>'comments', p_execution.comments);

  update workflow_executions
  set status = 'completed',
      action_taken = coalesce(p_action, 'completed'),
      comments = v_comments,
      metadata = coalesce(p_payload, '{}'::jsonb),
      completed_at = now()
  where id = p_execution_id;

  perform workflow_log_event(p_process_id, p_execution_id, p_actor_id, 'execution_completed', jsonb_build_object('action', p_action));

  -- If it's an action with multiple executors, wait until all complete
  select count(*) into v_pending
  from workflow_executions
  where process_id = p_process_id
    and step_id = v_step.id
    and status = 'pending';

  if v_pending > 0 then
    return jsonb_build_object('status', 'waiting');
  end if;

  -- Determine result for transition
  v_result := case
    when p_action in ('approve', 'approved') then 'approved'
    when p_action in ('reject', 'rejected') then 'rejected'
    else null
  end;

  v_next := workflow_next_step(v_process.template_id, v_step.id, v_result);

  if v_next is null then
    update workflow_processes
    set status = 'completed',
        current_step_id = null,
        completed_at = now()
    where id = p_process_id;

    perform workflow_log_event(p_process_id, null, p_actor_id, 'process_completed', jsonb_build_object('result', p_action));
    return jsonb_build_object('status', 'completed');
  end if;

  update workflow_processes
  set current_step_id = v_next,
      updated_at = now()
  where id = p_process_id;

  perform workflow_create_step_executions(p_process_id, v_next);
  perform workflow_log_event(p_process_id, null, p_actor_id, 'step_advanced', jsonb_build_object('fromStep', v_step.id, 'toStep', v_next));

  return jsonb_build_object('status', 'advanced', 'nextStepId', v_next);
end;
$$;

-- 12. Simple rollback helper for returning to previous step
create or replace function workflow_return_step(
  p_process_id uuid,
  p_execution_id uuid,
  p_actor_id uuid,
  p_comments text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_execution workflow_executions%rowtype;
  v_step workflow_template_steps%rowtype;
  v_prev uuid;
begin
  select * into v_execution from workflow_executions where id = p_execution_id and process_id = p_process_id;
  if not found then
    raise exception 'Execution % not found for process %', p_execution_id, p_process_id;
  end if;

  select * into v_step from workflow_template_steps where id = v_execution.step_id;

  select from_step_id
  into v_prev
  from workflow_template_transitions
  where to_step_id = v_step.id
  order by created_at desc
  limit 1;

  if v_prev is null then
    raise exception 'No previous step configured for %', v_step.id;
  end if;

  update workflow_processes
  set current_step_id = v_prev,
      status = 'active',
      updated_at = now()
  where id = p_process_id;

  delete from workflow_executions
  where process_id = p_process_id
    and step_id = v_step.id;

  perform workflow_create_step_executions(p_process_id, v_prev);
  perform workflow_log_event(p_process_id, null, p_actor_id, 'step_returned', jsonb_build_object('fromStep', v_step.id, 'toStep', v_prev, 'comments', p_comments));

  return jsonb_build_object('status', 'returned', 'stepId', v_prev);
end;
$$;

-- 13. Grants (ensure authenticated role can use RPCs)
grant execute on function workflow_start_process(uuid, uuid, text, uuid) to authenticated, service_role, anon;
grant execute on function workflow_execute_step(uuid, uuid, uuid, text, jsonb) to authenticated, service_role, anon;
grant execute on function workflow_return_step(uuid, uuid, uuid, text) to authenticated, service_role, anon;

-- 14. RPC to list processes for REST API
create or replace function workflow_rest_list_processes(
  p_user_id uuid,
  p_scope text default 'assigned'
)
returns table (
  process jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    raise exception 'User id required';
  end if;

  return query
  with base_processes as (
    select wp.*,
           wt.name as template_name,
           wt.status as template_status,
           doc.title as document_title,
           doc.status as document_status,
           array(
             select jsonb_build_object(
               'id', we.id,
               'status', we.status,
               'assignedTo', we.assigned_to,
               'actionTaken', we.action_taken,
               'comments', we.comments,
               'metadata', we.metadata,
               'step', jsonb_build_object(
                 'id', ws.id,
                 'name', ws.name,
                 'type', ws.type,
                 'metadata', ws.metadata
               ),
               'assignedUser', jsonb_build_object(
                 'id', au.id,
                 'fullName', au.full_name,
                 'email', au.email
               )
             )
             from workflow_executions we
             left join workflow_template_steps ws on ws.id = we.step_id
             left join profiles au on au.id = we.assigned_to
             where we.process_id = wp.id
           ) as executions
    from workflow_processes wp
    join workflow_templates wt on wt.id = wp.template_id
    join documents doc on doc.id = wp.document_id
  )
  select jsonb_build_object(
    'id', bp.id,
    'name', bp.name,
    'status', bp.status,
    'template', jsonb_build_object(
      'id', bp.template_id,
      'name', bp.template_name,
      'status', bp.template_status
    ),
    'document', jsonb_build_object(
      'id', bp.document_id,
      'title', bp.document_title,
      'status', bp.document_status
    ),
    'currentStepId', bp.current_step_id,
    'startedBy', bp.started_by,
    'startedAt', bp.started_at,
    'completedAt', bp.completed_at,
    'executions', bp.executions,
    'pendingExecutions', (
      select jsonb_agg(exec)
      from jsonb_array_elements(bp.executions) as exec
      where exec->>'status' = 'pending' and exec->>'assignedTo' = p_user_id::text
    )
  )
  from base_processes bp
  where (
    p_scope = 'mine' and bp.started_by = p_user_id
  ) or (
    p_scope = 'assigned' and exists (
      select 1
      from jsonb_array_elements(bp.executions) exec
      where exec->>'status' = 'pending'
        and exec->>'assignedTo' = p_user_id::text
    )
  ) or (
    p_scope = 'all'
  );
end;
$$;

grant execute on function workflow_rest_list_processes(uuid, text) to authenticated, service_role;


