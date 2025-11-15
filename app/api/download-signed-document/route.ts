import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { filePath, documentId } = await request.json()

    if (!filePath) {
      return NextResponse.json(
        { error: 'Caminho do arquivo é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se a service role key está configurada
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Configuração de service role não encontrada' },
        { status: 500 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Se já é uma URL completa, retornar diretamente
    if (filePath.startsWith('http')) {
      return NextResponse.json({ url: filePath })
    }

    // Lista de buckets para tentar
    const buckets = [
      'documents',
      'signed-documents',
      'document-signatures'
    ]

    // Tentar obter URL assinada de cada bucket
    for (const bucket of buckets) {
      try {
        const { data, error } = await supabase
          .storage
          .from(bucket)
          .createSignedUrl(filePath, 3600) // 1 hora

        if (!error && data?.signedUrl) {
          console.log(`✅ Documento encontrado no bucket: ${bucket}`)
          return NextResponse.json({ 
            url: data.signedUrl,
            bucket: bucket
          })
        }
      } catch (err) {
        // Continuar tentando outros buckets
        console.log(`⚠️ Documento não encontrado em ${bucket}`)
      }
    }

    // Se não encontrou em nenhum bucket, retornar erro
    return NextResponse.json(
      { error: 'Documento não encontrado em nenhum bucket' },
      { status: 404 }
    )

  } catch (error: any) {
    console.error('❌ Erro ao buscar documento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}
