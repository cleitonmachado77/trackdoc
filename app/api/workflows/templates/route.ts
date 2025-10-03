import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseConfig } from '@/lib/supabase/config'
import { z } from 'zod'

function getSupabase() {
  const cookieStore = cookies()

  return createServerClient(supabaseConfig.url, supabaseConfig.anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
        cookieStore.set({ name, value: '', ...options })
      },
    },
  })
}

const looseIdSchema = z.string().min(1)

const metadataSchema = z
  .object({
    userId: looseIdSchema.optional(),
    departmentId: looseIdSchema.optional(),
    actionType: z.enum(['sign', 'approve']).optional(),
    targetUsers: z.array(looseIdSchema).optional(),
    requiresAll: z.boolean().optional(),
  })
  .passthrough()

const stepSchema = z.object({
  id: looseIdSchema.optional(),
  stepOrder: z.number().min(0).optional(),
  type: z.enum(['user', 'action']).optional(),
  name: z.string().min(1).optional(),
  metadata: metadataSchema.optional(),
  uiPosition: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
})

const transitionSchema = z.object({
  id: looseIdSchema.optional(),
  fromStepId: looseIdSchema.optional(),
  toStepId: looseIdSchema.optional(),
  condition: z.enum(['always', 'approved', 'rejected', 'custom']).default('always'),
  metadata: z.record(z.any()).optional(),
})

const templatePayloadSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'inactive']).default('draft'),
  entityId: z.string().uuid().optional(),
  steps: z.array(stepSchema).min(1),
  transitions: z.array(transitionSchema),
})

const DEFAULT_STEP_NAME = 'Etapa'

function inferStepType(step: any) {
  if (step.type === 'action' || step.type === 'user') {
    return step.type
  }

  const actionType = step.actionType || step?.metadata?.actionType
  if (actionType === 'approve' || actionType === 'sign') {
    return 'action'
  }

  return 'user'
}

function normalizeStep(step: any, index: number) {
  const metadata = step.metadata ?? {}
  const position = step.uiPosition ?? step.position ?? { x: 0, y: 0 }

  return {
    id: step.id,
    step_order: typeof step.stepOrder === 'number' ? step.stepOrder : index,
    type: inferStepType(step),
    name: step.name ?? metadata.name ?? `${DEFAULT_STEP_NAME} ${index + 1}`,
    metadata: {
      ...metadata,
      actionType: metadata.actionType ?? step.actionType,
      targetUsers: metadata.targetUsers ?? step.targetUsers ?? [],
      comments: metadata.comments ?? step.comments ?? '',
      ...(metadata.userId || step.userId
        ? { userId: metadata.userId ?? step.userId }
        : {}),
    },
    ui_position: {
      x: typeof position.x === 'number' ? position.x : 0,
      y: typeof position.y === 'number' ? position.y : 0,
    },
  }
}

function normalizeTransition(transition: any) {
  const from =
    transition.fromStepId ??
    transition.from_step_id ??
    transition.source ??
    transition.from ??
    ''
  const to =
    transition.toStepId ??
    transition.to_step_id ??
    transition.target ??
    transition.to ??
    ''

  return {
    id: transition.id,
    from_step_id: from,
    to_step_id: to,
    condition: transition.condition ?? 'always',
    metadata: transition.metadata ?? {},
  }
}

export async function GET() {
  const supabase = getSupabase()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('workflow_templates')
    .select(`
      *,
      steps:workflow_template_steps(*),
      transitions:workflow_template_transitions(*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar templates:', error)
    return NextResponse.json({ error: 'Erro ao buscar templates' }, { status: 500 })
  }

  const formatted = (data ?? []).map(template => ({
    ...template,
    steps: (template.steps ?? [])
      .sort((a, b) => a.step_order - b.step_order)
      .map(step => {
        const metadata = step.metadata ?? {}
        const uiPosition = step.ui_position ?? { x: 0, y: 0 }

        const actionData = {
          comments: metadata.comments ?? '',
          targetUsers: metadata.targetUsers ?? [],
          targetUserDetails: metadata.targetUserDetails ?? [],
        }

        return {
          id: step.id,
          templateId: step.template_id,
          stepOrder: step.step_order,
          type: step.type,
          name: step.name,
          metadata,
          uiPosition,
          position: uiPosition,
          position_x: uiPosition.x,
          position_y: uiPosition.y,
          step_type: step.type,
          step_name: step.name,
          user_id: metadata.userId ?? null,
          action_type: metadata.actionType ?? null,
          action_data: actionData,
          target_users: actionData.targetUsers,
          target_user_details: actionData.targetUserDetails,
        }
      }),
    transitions: (template.transitions ?? []).map(transition => ({
      id: transition.id,
      templateId: transition.template_id,
      fromStepId: transition.from_step_id,
      toStepId: transition.to_step_id,
      condition: transition.condition,
      metadata: transition.metadata ?? {},
      from_step_id: transition.from_step_id,
      to_step_id: transition.to_step_id,
    })),
  }))

  return NextResponse.json({ success: true, templates: formatted })
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
  }

  const json = await request.json()
  const parsed = templatePayloadSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 })
  }

  const payload = parsed.data

  const isUpdate = Boolean(payload.id)

  const templateInput = {
    name: payload.name,
    description: payload.description ?? null,
    status: payload.status,
    entity_id: payload.entityId ?? null,
    created_by: user.id,
  }

  const supabaseClient = supabase

  const { data: template, error: templateError } = isUpdate
    ? await supabaseClient
        .from('workflow_templates')
        .update({
          ...templateInput,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.id)
        .select()
        .single()
    : await supabaseClient
        .from('workflow_templates')
        .insert(templateInput)
        .select()
        .single()

  if (templateError || !template) {
    console.error('Erro ao salvar template:', templateError)
    return NextResponse.json({ error: 'Erro ao salvar template' }, { status: 500 })
  }

  if (isUpdate) {
    const { error: deleteStepsError } = await supabaseClient
      .from('workflow_template_steps')
      .delete()
      .eq('template_id', template.id)

    if (deleteStepsError) {
      console.error('Erro ao limpar etapas antigas:', deleteStepsError)
      return NextResponse.json({ error: 'Erro ao atualizar etapas' }, { status: 500 })
    }

    const { error: deleteTransitionsError } = await supabaseClient
      .from('workflow_template_transitions')
      .delete()
      .eq('template_id', template.id)

    if (deleteTransitionsError) {
      console.error('Erro ao limpar transições antigas:', deleteTransitionsError)
      return NextResponse.json({ error: 'Erro ao atualizar transições' }, { status: 500 })
    }
  }

  if (payload.steps.length === 0) {
    return NextResponse.json({ error: 'Template precisa de ao menos uma etapa' }, { status: 400 })
  }

  const normalizedSteps = payload.steps.map((step, index) => normalizeStep(step, index))

  const missingUserStep = normalizedSteps.find(
    (step) => step.type === 'user' && !(step.metadata?.userId),
  )

  if (missingUserStep) {
    return NextResponse.json(
      {
        error: `Etapa de usuário "${missingUserStep.name}" está sem responsável definido. Selecione um usuário antes de salvar o fluxo.`,
      },
      { status: 400 },
    )
  }

  const stepsToInsert = normalizedSteps.map(step => ({
    template_id: template.id,
    step_order: step.step_order,
    type: step.type,
    name: step.name,
    metadata: step.metadata,
    ui_position: step.ui_position,
  }))

  const { data: insertedSteps, error: insertStepsError } = await supabaseClient
    .from('workflow_template_steps')
    .insert(stepsToInsert)
    .select()

  if (insertStepsError) {
    console.error('Erro ao inserir etapas:', insertStepsError)
    return NextResponse.json({ error: 'Erro ao salvar etapas' }, { status: 500 })
  }

  const stepIdMap: Record<string, string> = {}
  normalizedSteps.forEach((originalStep, index) => {
    const inserted = insertedSteps?.[index]
    if (inserted) {
      if (originalStep.id) {
        stepIdMap[originalStep.id] = inserted.id
      }
      stepIdMap[`${originalStep.step_order}`] = inserted.id
    }
  })

  const transitionsToInsert = payload.transitions.map(transition => {
    const normalized = normalizeTransition(transition)

    return {
      template_id: template.id,
      from_step_id: stepIdMap[normalized.from_step_id] ?? normalized.from_step_id,
      to_step_id: stepIdMap[normalized.to_step_id] ?? normalized.to_step_id,
      condition: normalized.condition,
      metadata: normalized.metadata,
    }
  })

  const { error: insertTransitionsError } = transitionsToInsert.length
    ? await supabaseClient
        .from('workflow_template_transitions')
        .insert(transitionsToInsert)
    : { error: null }

  if (insertTransitionsError) {
    console.error('Erro ao inserir transições:', insertTransitionsError)
    return NextResponse.json({ error: 'Erro ao salvar transições' }, { status: 500 })
  }

  return NextResponse.json({ success: true, templateId: template.id })
}

export async function DELETE(request: NextRequest) {
  const supabase = getSupabase()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
  }

  const url = new URL(request.url)
  const templateId = url.searchParams.get('id')

  if (!templateId) {
    return NextResponse.json({ error: 'TemplateId obrigatório' }, { status: 400 })
  }

  // Verificar dependências
  const { count, error: dependencyError } = await supabase
    .from('workflow_processes')
    .select('id', { count: 'exact', head: true })
    .eq('template_id', templateId)
    .neq('status', 'cancelled')

  if (dependencyError) {
    console.error('Erro ao verificar dependências do template:', dependencyError)
    return NextResponse.json({ error: 'Erro ao verificar dependências do template' }, { status: 500 })
  }

  if ((count ?? 0) > 0) {
    return NextResponse.json({
      error: 'Não é possível excluir templates com processos ativos. Cancele ou finalize os processos antes de excluir o template.',
    }, { status: 400 })
  }

  const { error: deleteTransitionsError } = await supabase
    .from('workflow_template_transitions')
    .delete()
    .eq('template_id', templateId)

  if (deleteTransitionsError) {
    console.error('Erro ao excluir transições do template:', deleteTransitionsError)
    return NextResponse.json({ error: 'Erro ao excluir transições do template' }, { status: 500 })
  }

  const { error: deleteStepsError } = await supabase
    .from('workflow_template_steps')
    .delete()
    .eq('template_id', templateId)

  if (deleteStepsError) {
    console.error('Erro ao excluir etapas do template:', deleteStepsError)
    return NextResponse.json({ error: 'Erro ao excluir etapas do template' }, { status: 500 })
  }

  const { error: deleteTemplateError } = await supabase
    .from('workflow_templates')
    .delete()
    .eq('id', templateId)

  if (deleteTemplateError) {
    console.error('Erro ao excluir template:', deleteTemplateError)
    return NextResponse.json({ error: 'Erro ao excluir template' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

