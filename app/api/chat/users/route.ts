import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { chatCache } from '@/lib/cache'

export async function GET(request: NextRequest) {
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

    // Buscar entity_id do usuário para cache
    const { data: currentUserProfile, error: profileError } = await supabase
      .from('profiles')
      .select('entity_id')
      .eq('id', user.id)
      .single()

    if (profileError || !currentUserProfile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    // Verificar cache primeiro
    const cachedUsers = chatCache.getUsers(currentUserProfile.entity_id)
    if (cachedUsers) {
      return NextResponse.json({ users: cachedUsers })
    }
    
    // Usar função otimizada do banco de dados
    let users, usersError
    try {
      const result = await supabase
        .rpc('get_entity_users_optimized', { current_user_id: user.id })
      users = result.data
      usersError = result.error
    } catch (rpcError) {
      console.warn('Erro na função RPC otimizada, usando consulta direta:', rpcError)
      // Fallback: consulta direta
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .eq('entity_id', currentUserProfile.entity_id)
        .neq('id', user.id)
        .order('full_name')
      
      users = profiles
      usersError = profilesError
    }

    if (usersError) {
      console.error('Erro ao buscar usuários:', usersError)
      return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 })
    }

    // Formatar dados dos usuários
    const formattedUsers = users?.map(user => ({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      avatar_url: user.avatar_url,
      department: { name: 'Geral' } // Departamento padrão por enquanto
    })) || []

    // Armazenar no cache
    chatCache.setUsers(currentUserProfile.entity_id, formattedUsers)

    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    console.error('Erro no servidor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
