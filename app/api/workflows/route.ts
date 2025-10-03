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

function buildProcessQuery(supabaseClient: ReturnType<typeof getSupabase>) {
  return supabaseClient
    .from('workflow_processes')
    .select(
      `
      id,
      name,
      status,
      current_step_id,
      started_by,
      started_at,
      completed_at,
      template:workflow_templates(
        id,
        name,
        status,
        steps:workflow_template_steps(
          id,
          name,
          type,
          metadata,
          step_order,
          ui_position
        ),
        transitions:workflow_template_transitions(
          id,
          from_step_id,
          to_step_id,
          condition,
          metadata
        )
      ),
      document:documents(
        id,
        title,
        status,
        file_path
      ),
      executions:workflow_executions(
        id,
        status,
        action_taken,
        comments,
        assigned_to,
        metadata,
        step:workflow_template_steps(
          id,
          name,
          type,
          metadata
        ),
        assigned_user:profiles!workflow_executions_assigned_to_fkey(
          id,
          full_name,
          email
        )
      )
    `
    )
    .order('started_at', { ascending: false })
}

const startProcessSchema = z.object({
  templateId: z.string().uuid(),
  documentId: z.string().uuid(),
  processName: z.string().min(1),
})

export async function GET(request: NextRequest) {
  const supabase = getSupabase()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
  }

  const url = new URL(request.url)
  const scope = url.searchParams.get('scope') ?? 'assigned'

  const queryBuilder = () => buildProcessQuery(supabase)

  let data: any[] = []
  let error = null

  if (scope === 'mine') {
    const response = await queryBuilder().eq('started_by', user.id)
    data = response.data ?? []
    error = response.error
  } else {
    const startedResult = await queryBuilder().eq('started_by', user.id)
    const assignedExecutions = await supabase
      .from('workflow_executions')
      .select('process_id')
      .eq('assigned_to', user.id)

    const assignedProcessIds = Array.from(
      new Set((assignedExecutions.data ?? []).map((row) => row.process_id).filter(Boolean)),
    )

    const assignedResult = assignedProcessIds.length
      ? await queryBuilder().in('id', assignedProcessIds)
      : { data: [] }

    const startedData = startedResult.data ?? []
    const assignedData = assignedResult.data ?? []
    error = startedResult.error || assignedResult.error

    const merged = new Map<string, any>()
    for (const process of [...startedData, ...assignedData]) {
      if (!merged.has(process.id)) {
        merged.set(process.id, process)
      }
    }
    data = Array.from(merged.values())
  }

  if (error) {
    console.error('Erro ao listar processos:', error)
    return NextResponse.json(
      {
        error: 'Erro ao listar processos',
        code: error.code,
        details: error.details,
        hint: (error as any).hint,
        message: error.message,
      },
      { status: 500 },
    )
  }

  const filtered = await Promise.all((data || []).map(async (process: any) => {
    const pendingExecutions = (process.executions || []).filter(
      (execution: any) => execution.status === 'pending' && execution.assigned_to === user.id
    )

    let documentDownloadUrl: string | null = null
    if (process.document?.file_path) {
      try {
        const { data: signed, error: signedError } = await supabase.storage
          .from('documents')
          .createSignedUrl(process.document.file_path, 60 * 30)

        if (signedError) {
          console.warn('Erro ao gerar URL temporária do documento:', signedError)
        }

        documentDownloadUrl = signed?.signedUrl ?? null
      } catch (signedException) {
        console.warn('Exceção ao gerar URL temporária do documento:', signedException)
      }
    }

    return {
      ...process,
      pendingExecutions,
      document: {
        ...process.document,
        download_url: documentDownloadUrl,
      },
    }
  }))

  return NextResponse.json({ success: true, processes: filtered })
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
  }

  const json = await request.json()
  const parsed = startProcessSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 })
  }

  const { templateId, documentId, processName } = parsed.data

  const { data: templateSteps, error: stepsError } = await supabase
    .from('workflow_template_steps')
    .select('metadata, type, name')
    .eq('template_id', templateId)

  if (stepsError) {
    console.error('Erro ao buscar steps do template:', stepsError)
    return NextResponse.json({ error: 'Erro ao iniciar processo' }, { status: 500 })
  }

  const missingUserStep = (templateSteps || []).find((step) => {
    if (step.type !== 'user') return false
    const metadata = (step.metadata ?? {}) as { userId?: string | null }
    return !metadata.userId
  })

  if (missingUserStep) {
    return NextResponse.json(
      {
        error: `Etapa de usuário "${missingUserStep.name}" está sem responsável definido no template`,
      },
      { status: 400 },
    )
  }

  const { data, error } = await supabase.rpc('workflow_start_process', {
    p_template_id: templateId,
    p_document_id: documentId,
    p_process_name: processName,
    p_started_by: user.id,
  })

  if (error) {
    console.error('Erro ao iniciar processo:', error)
    return NextResponse.json({ error: 'Erro ao iniciar processo' }, { status: 500 })
  }

  return NextResponse.json({ success: true, processId: data })
}

export async function DELETE(request: NextRequest) {
  const supabase = getSupabase()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
  }

  const url = new URL(request.url)
  const processId = url.searchParams.get('id')

  if (!processId) {
    return NextResponse.json({ error: 'ProcessId obrigatório' }, { status: 400 })
  }

  const { data: process, error: processError } = await supabase
    .from('workflow_processes')
    .select('id, started_by, status')
    .eq('id', processId)
    .single()

  if (processError || !process) {
    console.error('Processo não encontrado para exclusão:', processError)
    return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 })
  }

  if (process.started_by !== user.id) {
    return NextResponse.json({ error: 'Você não tem permissão para excluir este processo.' }, { status: 403 })
  }

  if (process.status === 'completed') {
    return NextResponse.json({ error: 'Não é possível excluir um processo já concluído. Cancele ou utilize a auditoria.' }, { status: 400 })
  }

  const { error: deleteError } = await supabase
    .from('workflow_processes')
    .delete()
    .eq('id', processId)

  if (deleteError) {
    console.error('Erro ao excluir processo:', deleteError)
    return NextResponse.json({ error: 'Erro ao excluir processo' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

