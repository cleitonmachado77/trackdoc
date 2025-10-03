import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseConfig } from '@/lib/supabase/config'

const actionSchema = z.object({
  executionId: z.string().uuid(),
  action: z.string().optional(),
  payload: z.any().optional(),
})

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

export async function POST(
  request: NextRequest,
  { params }: { params: { processId: string } }
) {
  const supabase = getSupabase()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
  }

  const processId = params.processId
  if (!processId) {
    return NextResponse.json({ error: 'processId inválido' }, { status: 400 })
  }

  const json = await request.json()
  const parsed = actionSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 })
  }

  const { executionId, action, payload } = parsed.data

  const { data, error } = await supabase.rpc('workflow_execute_step', {
    p_process_id: processId,
    p_execution_id: executionId,
    p_actor_id: user.id,
    p_action: action,
    p_payload: payload ?? {},
  })

  if (error) {
    console.error('Erro ao executar ação no workflow:', error)
    return NextResponse.json({ error: 'Erro ao executar ação' }, { status: 500 })
  }

  return NextResponse.json({ success: true, result: data })
}

const returnSchema = z.object({
  executionId: z.string().uuid(),
  comments: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { processId: string } }
) {
  const supabase = getSupabase()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
  }

  const processId = params.processId
  if (!processId) {
    return NextResponse.json({ error: 'processId inválido' }, { status: 400 })
  }

  const json = await request.json()
  const parsed = returnSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 })
  }

  const { executionId, comments } = parsed.data

  const { data, error } = await supabase.rpc('workflow_return_step', {
    p_process_id: processId,
    p_execution_id: executionId,
    p_actor_id: user.id,
    p_comments: comments,
  })

  if (error) {
    console.error('Erro ao retornar etapa do workflow:', error)
    return NextResponse.json({ error: 'Erro ao retornar etapa' }, { status: 500 })
  }

  return NextResponse.json({ success: true, result: data })
}

