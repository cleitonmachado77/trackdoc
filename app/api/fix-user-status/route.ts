import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Usar service role para acesso completo
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

    console.log('🔧 [fix-user-status] Iniciando correção de status de usuários...')

    // Buscar usuários com status inactive mas que já confirmaram email
    const { data: usersToFix, error: fetchError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        status,
        entity_id,
        registration_completed
      `)
      .eq('status', 'inactive')

    if (fetchError) {
      console.error('❌ [fix-user-status] Erro ao buscar usuários:', fetchError)
      return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 })
    }

    if (!usersToFix || usersToFix.length === 0) {
      return NextResponse.json({ 
        message: 'Nenhum usuário com status inactive encontrado',
        fixed: 0 
      })
    }

    console.log(`🔍 [fix-user-status] Encontrados ${usersToFix.length} usuários com status inactive`)

    let fixedCount = 0
    const results = []

    for (const user of usersToFix) {
      try {
        // Verificar se o usuário confirmou email no auth.users
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user.id)

        if (authError) {
          console.error(`❌ [fix-user-status] Erro ao verificar auth para ${user.email}:`, authError)
          results.push({ 
            email: user.email, 
            status: 'error', 
            error: 'Erro ao verificar auth' 
          })
          continue
        }

        // Se o email foi confirmado, ativar o usuário
        if (authUser.user && (authUser.user.email_confirmed_at || authUser.user.confirmed_at)) {
          console.log(`✅ [fix-user-status] Email confirmado para ${user.email}, ativando usuário...`)

          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              status: 'active',
              registration_completed: true,
              permissions: ['read', 'write'],
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id)

          if (updateError) {
            console.error(`❌ [fix-user-status] Erro ao ativar ${user.email}:`, updateError)
            results.push({ 
              email: user.email, 
              status: 'error', 
              error: updateError.message 
            })
            continue
          }

          // Atualizar contador da entidade se aplicável
          if (user.entity_id) {
            const { data: entityData } = await supabase
              .from('entities')
              .select('current_users')
              .eq('id', user.entity_id)
              .single()

            if (entityData) {
              await supabase
                .from('entities')
                .update({ 
                  current_users: (entityData.current_users || 0) + 1,
                  updated_at: new Date().toISOString()
                })
                .eq('id', user.entity_id)
            }

            // Marcar convite como aceito se existir
            await supabase
              .from('entity_invitations')
              .update({
                status: 'accepted',
                accepted_at: new Date().toISOString()
              })
              .eq('email', user.email)
              .eq('entity_id', user.entity_id)
              .eq('status', 'pending')
          }

          fixedCount++
          results.push({ 
            email: user.email, 
            status: 'fixed',
            message: 'Usuário ativado com sucesso'
          })

          console.log(`✅ [fix-user-status] Usuário ${user.email} ativado com sucesso`)

        } else {
          console.log(`ℹ️ [fix-user-status] Email não confirmado para ${user.email}, mantendo status inactive`)
          results.push({ 
            email: user.email, 
            status: 'skipped',
            message: 'Email ainda não confirmado'
          })
        }

      } catch (error) {
        console.error(`❌ [fix-user-status] Erro ao processar ${user.email}:`, error)
        results.push({ 
          email: user.email, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Erro desconhecido' 
        })
      }
    }

    console.log(`🎉 [fix-user-status] Correção concluída: ${fixedCount} usuários ativados`)

    return NextResponse.json({
      message: `Correção concluída: ${fixedCount} usuário(s) ativado(s)`,
      fixed: fixedCount,
      total: usersToFix.length,
      results
    })

  } catch (error) {
    console.error('❌ [fix-user-status] Erro geral:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}