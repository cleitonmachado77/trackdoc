import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        error: 'Configuração incompleta',
        hasUrl: !!supabaseUrl,
        hasKey: !!serviceRoleKey
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Testar conexão com a tabela document_signatures
    console.log('🧪 Testando conexão com document_signatures...')
    
    const { data, error, count } = await supabase
      .from('document_signatures')
      .select('id, verification_code, status, created_at', { count: 'exact' })
      .limit(5)

    if (error) {
      console.error('❌ Erro ao buscar document_signatures:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error,
        table: 'document_signatures'
      }, { status: 500 })
    }

    console.log(`✅ Conexão OK! Encontrados ${count} registros`)

    return NextResponse.json({
      success: true,
      message: 'Conexão com banco de dados OK',
      table: 'document_signatures',
      totalRecords: count,
      sampleRecords: data?.length || 0,
      samples: data?.map(d => ({
        id: d.id,
        hasVerificationCode: !!d.verification_code,
        status: d.status,
        createdAt: d.created_at
      }))
    })

  } catch (error: any) {
    console.error('❌ Erro no teste:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
