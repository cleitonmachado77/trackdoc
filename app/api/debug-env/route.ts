import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verificar variáveis de ambiente relacionadas à URL
    const envVars = {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      // Não expor chaves sensíveis, apenas verificar se existem
      HAS_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      HAS_SUPABASE_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }

    // Gerar URL de exemplo como seria criada
    const exampleVerificationCode = 'TEST123'
    const generatedUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.trackdoc.app.br'}/verify/${exampleVerificationCode}`

    return NextResponse.json({
      success: true,
      environment_variables: envVars,
      example_verification_url: generatedUrl,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao verificar variáveis de ambiente:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}