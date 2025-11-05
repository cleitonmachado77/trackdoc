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
    const { action, email } = body
    
    console.log('🔧 [fix-confirmation] Ação:', action, 'Email:', email)

    if (action === 'force_confirm') {
      // Forçar confirmação de email
      const { data, error } = await supabase.rpc('force_confirm_user_email', {
        p_email: email
      })

      if (error) {
        console.error('❌ [fix-confirmation] Erro ao forçar confirmação:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(data)
    }

    if (action === 'manual_activate') {
      // Ativação manual completa
      const { data, error } = await supabase.rpc('manual_confirm_and_activate_user', {
        p_email: email
      })

      if (error) {
        console.error('❌ [fix-confirmation] Erro na ativação manual:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(data)
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })

  } catch (error) {
    console.error('❌ [fix-confirmation] Erro geral:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}