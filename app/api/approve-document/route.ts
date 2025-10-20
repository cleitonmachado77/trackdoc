import { createBrowserClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { approvalId, approved, comments, userId } = await request.json()

    console.log('🔍 [API] Recebendo requisição:', { approvalId, approved, userId })

    if (!approvalId) {
      return NextResponse.json(
        { error: 'ID da aprovação é obrigatório' },
        { status: 400 }
      )
    }

    // Criar cliente Supabase com service key para bypass RLS
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    console.log('🔍 [API] Processando aprovação:', {
      approvalId,
      approved,
      userId,
      comments: comments?.substring(0, 50) + '...'
    })

    // Buscar dados da aprovação
    const { data: approvalData, error: fetchError } = await supabase
      .from('approval_requests')
      .select('*')
      .eq('id', approvalId)
      .single()

    if (fetchError) {
      console.error('❌ [API] Erro ao buscar aprovação:', fetchError)
      return NextResponse.json(
        { error: 'Aprovação não encontrada', details: fetchError.message },
        { status: 404 }
      )
    }

    console.log('📋 [API] Aprovação encontrada:', approvalData)

    // Verificar se o usuário é o aprovador (se userId foi fornecido)
    if (userId && approvalData.approver_id !== userId) {
      return NextResponse.json(
        { error: 'Usuário não autorizado para esta aprovação' },
        { status: 403 }
      )
    }

    // Atualizar status da aprovação
    const status = approved ? 'approved' : 'rejected'
    const approved_at = approved ? new Date().toISOString() : null

    const { data: updateData, error: updateError } = await supabase
      .from('approval_requests')
      .update({
        status,
        comments: comments || null,
        approved_at,
        updated_at: new Date().toISOString()
      })
      .eq('id', approvalId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ [API] Erro ao atualizar aprovação:', updateError)
      return NextResponse.json(
        { error: 'Erro ao processar aprovação', details: updateError.message },
        { status: 500 }
      )
    }

    console.log('✅ [API] Aprovação processada com sucesso:', {
      id: updateData.id,
      status: updateData.status,
      approved_at: updateData.approved_at
    })

    // Atualizar status do documento
    try {
      const documentStatus = status === 'approved' ? 'approved' : 'rejected'
      
      const { error: docUpdateError } = await supabase
        .from('documents')
        .update({
          status: documentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', approvalData.document_id)

      if (docUpdateError) {
        console.error('❌ [API] Erro ao atualizar documento:', docUpdateError)
        throw docUpdateError
      }

      console.log(`✅ [API] Documento ${documentStatus} com sucesso`)
    } catch (docError) {
      console.error('❌ [API] Erro crítico ao atualizar documento:', docError)
      throw docError
    }

    return NextResponse.json({
      success: true,
      data: updateData,
      message: `Documento ${approved ? 'aprovado' : 'rejeitado'} com sucesso`
    })

  } catch (error) {
    console.error('💥 [API] Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}