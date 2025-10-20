import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookies().getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookies().set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const conversationId = params.id

    // ABORDAGEM SIMPLIFICADA: Marcar participante como inativo
    // Usar uma abordagem mais robusta que funciona com a estrutura atual

    // Verificar se o usuário tem acesso à conversa
    const { data: participant, error: participantError } = await supabase
      .from('chat_participants')
      .select('id, is_active')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (participantError || !participant) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Se já está inativo, retornar sucesso
    if (!participant.is_active) {
      return NextResponse.json({ success: true, message: 'Conversa já foi removida' })
    }

    // Ocultar conversa para o usuário (usando nova tabela)
    console.log('🔍 DEBUG - Ocultando conversa para usuário:', user.id, 'conversa:', conversationId)
    
    const { data: hiddenData, error: hideError } = await supabase
      .from('chat_hidden_conversations')
      .insert({
        user_id: user.id,
        conversation_id: conversationId
      })
      .select()

    console.log('🔍 DEBUG - Resultado da ocultação:', { hiddenData, hideError })

    if (hideError) {
      console.error('Erro ao ocultar conversa:', hideError)
      return NextResponse.json({ error: 'Erro ao ocultar conversa' }, { status: 500 })
    }

    console.log('🔍 DEBUG - Conversa ocultada com sucesso')
    return NextResponse.json({ 
      success: true, 
      message: 'Conversa removida com sucesso',
      conversationId: conversationId 
    })
  } catch (error) {
    console.error('Erro no servidor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
