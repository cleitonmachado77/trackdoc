import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    console.log('🧪 [test-email] Testando envio de email para:', email)

    // Teste 1: Tentar criar usuário temporário para testar email
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: 'teste123456',
        options: {
          data: {
            full_name: 'Teste de Email',
            test_email: true
          }
        }
      })

      if (!authError && authData.user) {
        // Deletar usuário de teste imediatamente
        try {
          await supabase.auth.admin.deleteUser(authData.user.id)
        } catch (deleteError) {
          console.log('⚠️ [test-email] Erro ao deletar usuário de teste:', deleteError)
        }

        return NextResponse.json({
          success: true,
          method: 'supabase_signup',
          message: 'Email de teste enviado via Supabase SignUp (usuário removido)',
          user_id: authData.user.id
        })
      } else {
        console.log('⚠️ [test-email] Supabase SignUp falhou:', authError?.message)
      }
    } catch (authTestError) {
      console.log('⚠️ [test-email] Erro no teste Supabase SignUp:', authTestError)
    }

    // Teste 2: Tentar via Edge Function
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('send-signup-email', {
        body: {
          email: email,
          full_name: 'Teste de Email',
          password: 'teste123',
          entity_name: 'Entidade Teste',
          role: 'Usuário',
          app_url: baseUrl
        }
      })

      if (!edgeError) {
        return NextResponse.json({
          success: true,
          method: 'edge_function',
          message: 'Email de teste enviado via Edge Function',
          data: edgeData
        })
      } else {
        console.log('⚠️ [test-email] Edge Function falhou:', edgeError.message)
      }
    } catch (edgeTestError) {
      console.log('⚠️ [test-email] Erro no teste Edge Function:', edgeTestError)
    }

    // Teste 3: Verificar configurações
    const diagnostics = {
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configurado' : 'Não configurado',
      service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurado' : 'Não configurado',
      app_url: process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'Não configurado',
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({
      success: false,
      message: 'Nenhum método de envio funcionou',
      diagnostics,
      recommendations: [
        'Verifique as configurações SMTP no Supabase Dashboard',
        'Configure um provedor de email (Gmail, SendGrid, Resend)',
        'Verifique se as variáveis de ambiente estão corretas',
        'Teste o envio manual no Supabase Dashboard'
      ]
    })

  } catch (error) {
    console.error('❌ [test-email] Erro geral:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}