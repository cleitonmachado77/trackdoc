import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('filePath')

    if (!filePath) {
      return NextResponse.json(
        { error: 'Parâmetro filePath é obrigatório' },
        { status: 400 }
      )
    }

    // Usar service role key para acessar o storage
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Configuração de service role não encontrada' },
        { status: 500 }
      )
    }

    const serviceRoleSupabase = createClient(
      supabaseConfig.url,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Tentar baixar do bucket signed-documents primeiro, depois documents
    let fileData: any = null
    let downloadError: any = null
    
    // Primeiro tentar no bucket signed-documents
    const signedResult = await serviceRoleSupabase.storage
      .from('signed-documents')
      .download(filePath)
    
    if (signedResult.error) {
      console.log('📁 Arquivo não encontrado em signed-documents, tentando documents...')
      // Fallback: tentar no bucket documents
      const documentsResult = await serviceRoleSupabase.storage
        .from('documents')
        .download(filePath)
      
      fileData = documentsResult.data
      downloadError = documentsResult.error
    } else {
      fileData = signedResult.data
      downloadError = signedResult.error
    }

    if (downloadError) {
      console.error('❌ Erro ao baixar arquivo:', downloadError)
      return NextResponse.json(
        { error: 'Arquivo não encontrado' },
        { status: 404 }
      )
    }

    // Converter para buffer
    const buffer = Buffer.from(await fileData.arrayBuffer())

    // Retornar o arquivo como resposta
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filePath.split('/').pop()}"`,
        'Content-Length': buffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('❌ Erro interno no download:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
