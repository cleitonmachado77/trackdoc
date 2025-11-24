import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
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
      }
    )

    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se o usuário é admin de entidade
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('entity_role, entity_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.entity_role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores podem excluir usuários.' }, { status: 403 })
    }

    // Obter dados da requisição
    const { user_id } = await request.json()

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    // Verificar se não está tentando excluir a si mesmo
    if (user_id === user.id) {
      return NextResponse.json({ error: 'Você não pode excluir a si mesmo' }, { status: 400 })
    }

    // Criar cliente Supabase com service role key para acesso admin
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('🗑️ [delete-user API] Realizando soft delete do usuário:', user_id)

    // Soft delete: marcar usuário como excluído mantendo dados para rastreabilidade
    const { error: softDeleteError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        deleted_at: new Date().toISOString(),
        status: 'deleted'
      })
      .eq('id', user_id)

    if (softDeleteError) {
      console.error('❌ [delete-user API] Erro ao marcar usuário como excluído:', softDeleteError)
      return NextResponse.json(
        { 
          error: 'Erro ao excluir usuário',
          details: softDeleteError.message 
        },
        { status: 500 }
      )
    }

    console.log('✅ [delete-user API] Usuário marcado como excluído (soft delete)')
    console.log('ℹ️ [delete-user API] Dados mantidos para rastreabilidade')

    return NextResponse.json({
      success: true,
      message: 'Usuário excluído com sucesso (dados mantidos para rastreabilidade)'
    })

  } catch (error) {
    console.error('❌ [delete-user API] Erro geral:', error)
    
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

