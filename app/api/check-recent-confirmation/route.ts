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

    console.log('🔧 [check-recent-confirmation] Buscando usuários inativos criados recentemente...')

    // Buscar usuários inativos criados nos últimos 10 minutos (podem ter sido confirmados)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    
    const { data: inactiveProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, status, created_at, updated_at')
      .eq('status', 'inactive')
      .gte('created_at', tenMinutesAgo)
      .order('created_at', { ascending: false })
    
    if (profilesError) {
      console.error('❌ [check-recent-confirmation] Erro ao buscar profiles:', profilesError)
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    if (!inactiveProfiles || inactiveProfiles.length === 0) {
      console.log('ℹ️ [check-recent-confirmation] Nenhum usuário inativo recente encontrado')
      return NextResponse.json({ 
        confirmed: false,
        activated: 0,
        message: 'Nenhum usuário inativo criado recentemente'
      })
    }

    console.log(`🔧 [check-recent-confirmation] ${inactiveProfiles.length} usuário(s) inativo(s) encontrado(s)`)

    // Tentar ativar esses usuários (assumindo que podem ter sido confirmados)
    const { data: updatedProfiles, error: updateError } = await supabase
      .from('profiles')
      .update({
        status: 'active',
        registration_completed: true,
        permissions: ['read', 'write'],
        updated_at: new Date().toISOString()
      })
      .in('id', inactiveProfiles.map(p => p.id))
      .select('id, email')
    
    if (updateError) {
      console.error('❌ [check-recent-confirmation] Erro ao ativar profiles:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    const activatedCount = updatedProfiles?.length || 0
    console.log(`✅ [check-recent-confirmation] ${activatedCount} usuário(s) ativado(s)`)
    
    return NextResponse.json({
      confirmed: true,
      activated: activatedCount,
      users: updatedProfiles?.map(p => ({ email: p.email, status: 'activated' })) || [],
      message: activatedCount > 0 
        ? `${activatedCount} usuário(s) ativado(s) com sucesso`
        : 'Verificação executada, nenhuma ativação necessária'
    })

  } catch (error) {
    console.error('❌ [check-recent-confirmation] Erro geral:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        confirmed: false
      },
      { status: 500 }
    )
  }
}