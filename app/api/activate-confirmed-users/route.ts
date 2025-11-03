import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

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

    // Buscar usuários com status pending_email que já confirmaram o email
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, entity_id, full_name')
      .eq('status', 'pending_email')
      .not('email_confirmed_at', 'is', null)

    if (profilesError) {
      console.error('Erro ao buscar perfis:', profilesError)
      return NextResponse.json({ error: 'Erro ao buscar perfis' }, { status: 500 })
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ 
        message: 'Nenhum usuário pendente de ativação encontrado',
        activated: 0 
      })
    }

    let activatedCount = 0
    const results = []

    for (const profile of profiles) {
      try {
        // Ativar usuário
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            status: 'active',
            registration_completed: true,
            permissions: ['read', 'write'],
            activated_at: new Date().toISOString()
          })
          .eq('id', profile.id)

        if (updateError) {
          console.error(`Erro ao ativar usuário ${profile.email}:`, updateError)
          results.push({ email: profile.email, status: 'error', error: updateError.message })
          continue
        }

        // Atualizar contador da entidade se aplicável
        if (profile.entity_id) {
          const { data: entityData } = await supabase
            .from('entities')
            .select('current_users')
            .eq('id', profile.entity_id)
            .single()

          if (entityData) {
            await supabase
              .from('entities')
              .update({ 
                current_users: (entityData.current_users || 0) + 1,
                updated_at: new Date().toISOString()
              })
              .eq('id', profile.entity_id)
          }

          // Marcar convite como aceito
          await supabase
            .from('entity_invitations')
            .update({
              status: 'accepted',
              accepted_at: new Date().toISOString()
            })
            .eq('email', profile.email)
            .eq('entity_id', profile.entity_id)
        }

        activatedCount++
        results.push({ email: profile.email, status: 'activated' })
        
        console.log(`✅ Usuário ${profile.email} ativado automaticamente`)

      } catch (error) {
        console.error(`Erro ao processar usuário ${profile.email}:`, error)
        results.push({ 
          email: profile.email, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Erro desconhecido' 
        })
      }
    }

    return NextResponse.json({
      message: `${activatedCount} usuário(s) ativado(s) automaticamente`,
      activated: activatedCount,
      total: profiles.length,
      results
    })

  } catch (error) {
    console.error('Erro na API de ativação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}