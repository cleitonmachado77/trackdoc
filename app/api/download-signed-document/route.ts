import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    // Baixar o arquivo do storage
    const { data: fileData, error: downloadError } = await serviceRoleSupabase.storage
      .from('documents')
      .download(filePath)

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
