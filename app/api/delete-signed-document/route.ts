import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
}

export async function DELETE(request: NextRequest) {
  try {
    const { requestId } = await request.json()

    if (!requestId) {
      return NextResponse.json(
        { error: 'ID da solicitação é obrigatório' },
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

    const serviceRoleSupabase = createClient(
      supabaseConfig.url,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Buscar a solicitação para obter informações do arquivo
    const { data: requestData, error: fetchError } = await serviceRoleSupabase
      .from('multi_signature_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError) {
      console.error('❌ Erro ao buscar solicitação:', fetchError)
      return NextResponse.json(
        { error: 'Solicitação não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se o arquivo assinado existe
    if (requestData.signed_file_path) {
      // Excluir arquivo do storage
      const { error: deleteFileError } = await serviceRoleSupabase.storage
        .from('documents')
        .remove([requestData.signed_file_path])

      if (deleteFileError) {
        console.error('❌ Erro ao excluir arquivo do storage:', deleteFileError)
        // Continuar mesmo se não conseguir excluir o arquivo
      } else {
        console.log('✅ Arquivo excluído do storage:', requestData.signed_file_path)
      }
    }

    // Excluir arquivo original se existir
    if (requestData.document_path) {
      const { error: deleteOriginalError } = await serviceRoleSupabase.storage
        .from('documents')
        .remove([requestData.document_path])

      if (deleteOriginalError) {
        console.error('❌ Erro ao excluir arquivo original:', deleteOriginalError)
        // Continuar mesmo se não conseguir excluir o arquivo original
      } else {
        console.log('✅ Arquivo original excluído do storage:', requestData.document_path)
      }
    }

    // Excluir aprovações relacionadas
    const { error: deleteApprovalsError } = await serviceRoleSupabase
      .from('multi_signature_approvals')
      .delete()
      .eq('request_id', requestId)

    if (deleteApprovalsError) {
      console.error('❌ Erro ao excluir aprovações:', deleteApprovalsError)
      return NextResponse.json(
        { error: 'Erro ao excluir aprovações relacionadas' },
        { status: 500 }
      )
    }

    // Excluir a solicitação principal
    const { error: deleteRequestError } = await serviceRoleSupabase
      .from('multi_signature_requests')
      .delete()
      .eq('id', requestId)

    if (deleteRequestError) {
      console.error('❌ Erro ao excluir solicitação:', deleteRequestError)
      return NextResponse.json(
        { error: 'Erro ao excluir solicitação' },
        { status: 500 }
      )
    }

    console.log('✅ Documento e solicitação excluídos com sucesso:', requestId)

    return NextResponse.json({
      success: true,
      message: 'Documento excluído com sucesso'
    })

  } catch (error) {
    console.error('❌ Erro interno no delete:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
