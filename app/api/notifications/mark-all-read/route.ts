import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Usar service role para bypass do RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { user_email } = await request.json()
    
    console.log('📖 [API] Marcando todas as notificações como lidas para:', user_email)
    
    if (!user_email) {
      return NextResponse.json({ error: 'Email do usuário é obrigatório' }, { status: 400 })
    }

    // Buscar o user_id pelo email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', user_email)
      .single()

    if (userError || !userData) {
      console.error('❌ [API] Usuário não encontrado:', userError)
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const user_id = userData.id

    // Atualizar todas as notificações não lidas do usuário (onde ele está nos recipients)
    const { data, error } = await supabase
      .from('notifications')
      .update({ status: 'read' })
      .contains('recipients', [user_email])
      .neq('status', 'read')
      .select()
    
    if (error) {
      console.error('❌ [API] Erro ao atualizar todas as notificações:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    const updatedCount = data?.length || 0
    console.log(`✅ [API] ${updatedCount} notificações marcadas como lidas`)
    
    return NextResponse.json({ 
      success: true, 
      updated_count: updatedCount,
      message: `${updatedCount} notificações marcadas como lidas`
    })
    
  } catch (error: any) {
    console.error('❌ [API] Erro geral:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}