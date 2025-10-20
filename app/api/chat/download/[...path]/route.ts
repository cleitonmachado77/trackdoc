import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
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

    // Reconstruir o caminho do arquivo
    const filePath = params.path.join('/')
    
    // Buscar informações do arquivo no banco
    const { data: message, error: messageError } = await supabase
      .from('chat_messages')
      .select(`
        file_path,
        file_name,
        file_type,
        file_size,
        conversation_id,
        chat_conversations!inner(
          entity_id
        )
      `)
      .eq('file_path', filePath)
      .single()

    if (messageError || !message) {
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })
    }

    // Verificar se o usuário tem acesso à conversa
    const { data: participant, error: participantError } = await supabase
      .from('chat_participants')
      .select('id')
      .eq('conversation_id', message.conversation_id)
      .eq('user_id', user.id)
      .single()

    if (participantError || !participant) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Buscar o arquivo no Supabase Storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from('documents')
      .download(filePath)

    if (fileError || !fileData) {
      console.error('Erro ao baixar arquivo:', fileError)
      return NextResponse.json({ error: 'Erro ao baixar arquivo' }, { status: 500 })
    }

    // Converter para buffer
    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Determinar o tipo de conteúdo
    const contentType = message.file_type || 'application/octet-stream'

    // Retornar o arquivo
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${message.file_name || 'arquivo'}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Erro no servidor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
