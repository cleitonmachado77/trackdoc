-- Seed basic workflow templates for development/testing
set search_path = public;


-- Observação: para campos created_by e targetUsers use IDs reais de profiles existentes na base.

insert into workflow_templates(id, name, description, status, created_by)
values
  ('11111111-1111-1111-1111-111111111111', 'Fluxo Assinatura Simples', 'Solicita assinatura de um único usuário', 'active', '1e4799e6-d473-4ffd-ad43-fb669af58be5'),
  ('22222222-2222-2222-2222-222222222222', 'Fluxo Assinatura Múltipla', 'Solicita assinatura de múltiplos usuários', 'active', '1e4799e6-d473-4ffd-ad43-fb669af58be5')
on conflict (id) do nothing;

insert into workflow_template_steps(id, template_id, step_order, type, name, metadata)
values
  ('11111111-aaaa-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 0, 'user', 'Usuário Solicitante', jsonb_build_object('userId', '1e4799e6-d473-4ffd-ad43-fb669af58be5')),
  ('11111111-bbbb-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 1, 'action', 'Assinar Documento', jsonb_build_object('actionType', 'sign', 'targetUsers', jsonb_build_array('1ab54ee5-5032-4178-a603-60178e7ddd22'))),
  ('22222222-aaaa-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 0, 'user', 'Usuário Solicitante', jsonb_build_object('userId', '1e4799e6-d473-4ffd-ad43-fb669af58be5')),
  ('22222222-bbbb-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 1, 'action', 'Assinatura Múltipla', jsonb_build_object('actionType', 'sign', 'requiresAll', true, 'targetUsers', jsonb_build_array('1ab54ee5-5032-4178-a603-60178e7ddd22', '7a5bf72c-ab4f-47f6-b34a-f6554738f757', '1e4799e6-d473-4ffd-ad43-fb669af58be5')))
on conflict (id) do nothing;

insert into workflow_template_transitions(id, template_id, from_step_id, to_step_id, condition)
values
  ('11111111-cccc-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-1111-1111-111111111111', '11111111-bbbb-1111-1111-111111111111', 'always'),
  ('22222222-cccc-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '22222222-aaaa-2222-2222-222222222222', '22222222-bbbb-2222-2222-222222222222', 'always')
on conflict (id) do nothing;

