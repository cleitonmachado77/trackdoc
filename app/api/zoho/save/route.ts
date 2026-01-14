import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseConfig } from '@/lib/supabase/config'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(supabaseConfig.url, supabaseConfig.anonKey, {
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
    })

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // O Zoho envia os dados como form-data
    const formData = await request.formData()
    
    // Obter arquivo do documento
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo não encontrado na requisição' },
        { status: 400 }
      )
    }

    // Obter informações do contexto (enviadas no callback_settings)
    const contextInfoStr = formData.get('context_info') as string
    let contextInfo: any = {}
    
    try {
      contextInfo = contextInfoStr ? JSON.parse(contextInfoStr) : {}
    } catch (e) {
      console.warn('Erro ao parsear context_info:', e)
    }

    const { document_id, user_id, is_new } = contextInfo

    // Validar que o user_id corresponde ao usuário autenticado
    if (user_id && user_id !== user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }

    // Converter File para Buffer/ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (document_id && !is_new) {
      // Atualizar documento existente
      const { data: docData, error: docError } = await supabase
        .from('office_documents')
        .select('file_path, user_id')
        .eq('id', document_id)
        .single()

      if (docError || !docData) {
        return NextResponse.json(
          { error: 'Documento não encontrado' },
          { status: 404 }
        )
      }

      // Validar ownership
      if (docData.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Não autorizado' },
          { status: 403 }
        )
      }

      // Fazer upload do arquivo atualizado
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .update(docData.file_path, buffer, {
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          upsert: true
        })

      if (uploadError) {
        console.error('Erro ao fazer upload:', uploadError)
        return NextResponse.json(
          { error: 'Erro ao salvar documento' },
          { status: 500 }
        )
      }

      // Atualizar metadados do documento
      const { error: updateError } = await supabase
        .from('office_documents')
        .update({
          updated_at: new Date().toISOString(),
          file_size: buffer.length
        })
        .eq('id', document_id)

      if (updateError) {
        console.error('Erro ao atualizar metadados:', updateError)
        // Não falhar se apenas a atualização de metadados falhar
      }

      return NextResponse.json({
        success: true,
        message: 'Documento salvo com sucesso'
      })

    } else {
      // Criar novo documento
      const fileName = `${user.id}/${Date.now()}_${file.name || 'documento.docx'}`
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, buffer, {
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          upsert: true
        })

      if (uploadError) {
        console.error('Erro ao fazer upload:', uploadError)
        return NextResponse.json(
          { error: 'Erro ao salvar documento' },
          { status: 500 }
        )
      }

      // Criar registro no banco de dados
      const documentName = file.name?.replace(/\.[^/.]+$/, "") || 'Novo Documento'
      
      const { data: docData, error: insertError } = await supabase
        .from('office_documents')
        .insert({
          user_id: user.id,
          title: documentName,
          file_path: fileName,
          file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          file_size: buffer.length,
          entity_id: user.user_metadata?.entity_id
        })
        .select()
        .single()

      if (insertError) {
        console.error('Erro ao criar registro:', insertError)
        return NextResponse.json(
          { error: 'Erro ao criar registro do documento' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Documento criado com sucesso',
        document_id: docData.id
      })
    }

  } catch (error) {
    console.error('Erro ao processar salvamento do Zoho:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
