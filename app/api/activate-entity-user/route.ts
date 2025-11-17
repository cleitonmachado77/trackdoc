import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const body = await request.json()
    const { user_id } = body
    
    if (!user_id) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }
    
    console.log('🔧 [activate-entity-user] Ativando usuário:', user_id)
    
    // Verificar se o usuário existe e está inativo
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, status, entity_id')
      .eq('id', user_id)
      .single()
    
    if (profileError || !profile) {
      console.error('❌ [activate-entity-user] Usuário não encontrado:', profileError)
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }
    
    // Se já está ativo, retornar sucesso
    if (profile.status === 'active') {
      console.log('✅ [activate-entity-user] Usuário já está ativo')
      return NextResponse.json({
        success: true,
        message: 'Usuário já está ativo',
        already_active: true
      })
    }
    
    // Verificar se está aguardando confirmação
    if (profile.status !== 'pending_confirmation' && profile.status !== 'inactive') {
      console.log('⚠️ [activate-entity-user] Usuário não está aguardando confirmação, status:', profile.status)
      return NextResponse.json({
        success: false,
        message: `Usuário não pode ser ativado. Status atual: ${profile.status}`
      }, { status: 400 })
    }
    
    // Ativar o usuário
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id)
    
    if (updateError) {
      console.error('❌ [activate-entity-user] Erro ao ativar usuário:', updateError)
      return NextResponse.json(
        { error: 'Erro ao ativar usuário' },
        { status: 500 }
      )
    }
    
    console.log('✅ [activate-entity-user] Usuário ativado com sucesso')
    
    return NextResponse.json({
      success: true,
      message: 'Usuário ativado com sucesso',
      user: {
        id: profile.id,
        email: profile.email,
        status: 'active'
      }
    })
    
  } catch (error) {
    console.error('❌ [activate-entity-user] Erro geral:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
