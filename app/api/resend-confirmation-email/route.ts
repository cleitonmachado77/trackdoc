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
    const { email } = body
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }
    
    console.log('🔧 [resend-confirmation] Reenviando email para:', email)
    
    // Verificar se o usuário existe e está inativo
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, status, entity_id')
      .ilike('email', email)
      .single()
    
    if (profileError || !profile) {
      console.error('❌ [resend-confirmation] Usuário não encontrado:', profileError)
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }
    
    // Se já está ativo, não precisa reenviar
    if (profile.status === 'active') {
      console.log('✅ [resend-confirmation] Usuário já está ativo')
      return NextResponse.json({
        success: false,
        message: 'Este usuário já confirmou o email e está ativo',
        already_active: true
      })
    }
    
    // Verificar se está aguardando confirmação
    if (profile.status !== 'pending_confirmation' && profile.status !== 'inactive') {
      console.log('⚠️ [resend-confirmation] Usuário não está aguardando confirmação, status:', profile.status)
      return NextResponse.json({
        success: false,
        message: `Não é possível reenviar confirmação. Status atual: ${profile.status}`
      }, { status: 400 })
    }
    
    // Reenviar email de confirmação
    // Nota: Para reenviar, usamos 'magiclink' ao invés de 'signup'
    try {
      const { error: emailError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: profile.email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.trackdoc.app.br'}/auth/callback?type=entity_user&entity_id=${profile.entity_id}`
        }
      })
      
      if (emailError) {
        console.error('❌ [resend-confirmation] Erro ao enviar email:', emailError)
        return NextResponse.json(
          { error: 'Erro ao enviar email de confirmação' },
          { status: 500 }
        )
      }
      
      console.log('✅ [resend-confirmation] Email reenviado com sucesso')
      
      return NextResponse.json({
        success: true,
        message: `Email de confirmação reenviado para ${profile.email}`,
        user: {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name
        }
      })
      
    } catch (emailErr) {
      console.error('❌ [resend-confirmation] Erro ao gerar link:', emailErr)
      return NextResponse.json(
        { error: 'Erro ao gerar link de confirmação' },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('❌ [resend-confirmation] Erro geral:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
