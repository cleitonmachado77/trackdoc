import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // Usar service role para verificar confirmações
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

    console.log('🔧 [check-recent-confirmation] Verificando confirmações recentes...')

    // Buscar usuários confirmados nos últimos 5 minutos
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    
    const { data: recentUsers, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email, email_confirmed_at')
      .not('email_confirmed_at', 'is', null)
      .gte('email_confirmed_at', fiveMinutesAgo)
      .order('email_confirmed_at', { ascending: false })
    
    if (usersError) {
      console.error('❌ [check-recent-confirmation] Erro ao buscar usuários:', usersError)
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    if (!recentUsers || recentUsers.length === 0) {
      console.log('ℹ️ [check-recent-confirmation] Nenhum usuário confirmado recentemente')
      return NextResponse.json({ 
        confirmed: false,
        message: 'Nenhum usuário confirmado nos últimos 5 minutos'
      })
    }

    console.log(`✅ [check-recent-confirmation] ${recentUsers.length} usuário(s) confirmado(s) recentemente`)

    // Verificar quais precisam ser ativados
    const userIds = recentUsers.map(u => u.id)
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, status')
      .in('id', userIds)
    
    if (profilesError) {
      console.error('❌ [check-recent-confirmation] Erro ao buscar profiles:', profilesError)
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    const inactiveProfiles = profiles?.filter(p => p.status === 'inactive') || []
    
    if (inactiveProfiles.length > 0) {
      console.log(`🔧 [check-recent-confirmation] Ativando ${inactiveProfiles.length} perfil(s)...`)
      
      // Ativar perfis inativos
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          status: 'active',
          registration_completed: true,
          permissions: JSON.parse('["read", "write"]'),
          updated_at: new Date().toISOString()
        })
        .in('id', inactiveProfiles.map(p => p.id))
      
      if (updateError) {
        console.error('❌ [check-recent-confirmation] Erro ao ativar perfis:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
      
      console.log(`✅ [check-recent-confirmation] ${inactiveProfiles.length} perfil(s) ativado(s)`)
      
      return NextResponse.json({
        confirmed: true,
        activated: inactiveProfiles.length,
        users: inactiveProfiles.map(p => ({ email: p.email, status: 'activated' })),
        message: `${inactiveProfiles.length} usuário(s) confirmado(s) e ativado(s) com sucesso`
      })
    } else {
      console.log('ℹ️ [check-recent-confirmation] Todos os usuários já estão ativos')
      
      return NextResponse.json({
        confirmed: true,
        activated: 0,
        users: profiles?.map(p => ({ email: p.email, status: p.status })) || [],
        message: 'Usuários confirmados recentemente já estão ativos'
      })
    }

  } catch (error) {
    console.error('❌ [check-recent-confirmation] Erro geral:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}