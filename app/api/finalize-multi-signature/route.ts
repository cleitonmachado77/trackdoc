import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DigitalSignatureService } from '@/lib/digital-signature'

const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
}

export async function POST(request: NextRequest) {
  try {
    const { requestId } = await request.json()

    if (!requestId) {
      return NextResponse.json(
        { error: 'ID da solicitação é obrigatório' },
        { status: 400 }
      )
    }

    console.log('🔄 Finalizando assinatura múltipla:', requestId)

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

    const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey)

    // Buscar a solicitação de assinatura múltipla
    const { data: signatureRequest, error: requestError } = await serviceRoleSupabase
      .from('multi_signature_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (requestError || !signatureRequest) {
      console.error('❌ Solicitação não encontrada:', requestError)
      return NextResponse.json(
        { error: 'Solicitação não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se todas as aprovações foram concluídas
    const { data: approvals, error: approvalsError } = await serviceRoleSupabase
      .from('multi_signature_approvals')
      .select('*')
      .eq('request_id', requestId)

    if (approvalsError) {
      console.error('❌ Erro ao buscar aprovações:', approvalsError)
      return NextResponse.json(
        { error: 'Erro ao buscar aprovações' },
        { status: 500 }
      )
    }

    const totalApprovals = approvals?.length || 0
    const approvedCount = approvals?.filter(a => a.status === 'approved').length || 0

    if (approvedCount !== totalApprovals) {
      return NextResponse.json(
        { error: `Nem todas as aprovações foram concluídas. ${approvedCount}/${totalApprovals} aprovadas.` },
        { status: 400 }
      )
    }

    // Verificar se já foi finalizada
    if (signatureRequest.status === 'completed' && signatureRequest.signed_file_path) {
      return NextResponse.json({
        success: true,
        message: 'Assinatura múltipla já foi finalizada',
        data: {
          requestId: signatureRequest.id,
          signedFilePath: signatureRequest.signed_file_path,
          downloadUrl: `${supabaseConfig.url}/storage/v1/object/public/signed-documents/${signatureRequest.signed_file_path}`
        }
      })
    }

    console.log('📄 Carregando documento original...')

    // Carregar o documento original
    const { data: fileData, error: fileError } = await serviceRoleSupabase.storage
      .from('documents')
      .download(signatureRequest.document_path)

    if (fileError || !fileData) {
      console.error('❌ Erro ao carregar arquivo original:', fileError)
      return NextResponse.json(
        { error: 'Erro ao carregar arquivo original' },
        { status: 500 }
      )
    }

    const pdfBuffer = Buffer.from(await fileData.arrayBuffer())
    console.log('✅ Documento carregado, tamanho:', pdfBuffer.length)

    // Buscar dados dos usuários aprovados
    const userIds = approvals.filter(a => a.status === 'approved').map(a => a.user_id)
    const { data: users, error: usersError } = await serviceRoleSupabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds)

    if (usersError) {
      console.error('❌ Erro ao buscar dados dos usuários:', usersError)
      return NextResponse.json(
        { error: 'Erro ao buscar dados dos usuários' },
        { status: 500 }
      )
    }

    console.log('👥 Usuários para assinatura:', users?.length)

    // Criar o serviço de assinatura digital
    const digitalSignatureService = new DigitalSignatureService()

    // Gerar assinatura múltipla
    const { signedPdf, signatures } = await digitalSignatureService.createMultiSignature(
      pdfBuffer,
      users || [],
      signatureRequest.document_id,
      signatureRequest.signature_template
    )

    console.log('✅ Documento assinado gerado, tamanho:', signedPdf.length)

    // Salvar documento assinado
    const signedFileName = `multi_signed_${Date.now()}_${signatureRequest.document_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
    
    // Tentar salvar no bucket signed-documents, se falhar usar o bucket documents
    let uploadError: any = null
    let bucketUsed = 'signed-documents'
    
    const uploadResult = await serviceRoleSupabase.storage
      .from('signed-documents')
      .upload(signedFileName, signedPdf, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (uploadResult.error) {
      console.warn('⚠️ Bucket signed-documents não disponível, usando bucket documents:', uploadResult.error)
      
      // Fallback: usar bucket documents
      const fallbackResult = await serviceRoleSupabase.storage
        .from('documents')
        .upload(signedFileName, signedPdf, {
          contentType: 'application/pdf',
          upsert: false
        })
      
      uploadError = fallbackResult.error
      bucketUsed = 'documents'
    }

    if (uploadError) {
      console.error('❌ Erro ao fazer upload do documento assinado:', uploadError)
      return NextResponse.json(
        { error: 'Erro ao salvar documento assinado' },
        { status: 500 }
      )
    }

    console.log(`✅ Documento salvo no bucket: ${bucketUsed}`)

    console.log('💾 Salvando assinaturas individuais no banco...')

    // Salvar cada assinatura individual na tabela document_signatures
    for (const signature of signatures) {
      try {
        const { error: insertError } = await serviceRoleSupabase.from('document_signatures').insert({
          user_id: signature.userId,
          document_id: signatureRequest.document_id,
          arqsign_document_id: signature.id,
          status: 'completed',
          signature_url: signedFileName,
          title: signatureRequest.document_name,
          verification_code: signature.verificationCode,
          verification_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://trackdoc.com.br'}/verify/${signature.verificationCode}`,
          qr_code_data: JSON.stringify({
            code: signature.verificationCode,
            url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://trackdoc.com.br'}/verify/${signature.verificationCode}`,
            documentId: signature.documentId,
            timestamp: signature.digitalTimestamp,
            signatureType: 'multiple',
            multiSignatureRequestId: requestId
          }),
          document_hash: signature.documentHash,
          signature_hash: signature.hash
        })

        if (insertError) {
          console.warn(`⚠️ Erro ao salvar assinatura individual de ${signature.userName}:`, insertError)
        } else {
          console.log(`✅ Assinatura individual de ${signature.userName} salva com sucesso`)
        }
      } catch (dbError) {
        console.warn(`⚠️ Erro ao salvar assinatura individual de ${signature.userName}:`, dbError)
      }
    }

    // Atualizar solicitação como concluída
    const { error: updateError } = await serviceRoleSupabase
      .from('multi_signature_requests')
      .update({
        status: 'completed',
        signed_file_path: signedFileName,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          ...signatureRequest.metadata,
          signatures: signatures.map(sig => ({
            userId: sig.userId,
            userName: sig.userName,
            userEmail: sig.userEmail,
            verificationCode: sig.verificationCode,
            signatureHash: sig.hash,
            timestamp: sig.timestamp
          })),
          finalized_at: new Date().toISOString()
        }
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('❌ Erro ao atualizar solicitação:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar solicitação' },
        { status: 500 }
      )
    }

    console.log('✅ Assinatura múltipla finalizada com sucesso!')

    return NextResponse.json({
      success: true,
      message: 'Assinatura múltipla finalizada com sucesso',
      data: {
        requestId: signatureRequest.id,
        documentName: signatureRequest.document_name,
        signedFilePath: signedFileName,
        downloadUrl: `${supabaseConfig.url}/storage/v1/object/public/${bucketUsed}/${signedFileName}`,
        bucketUsed: bucketUsed,
        totalSignatures: signatures.length,
        signatures: signatures.map(sig => ({
          userName: sig.userName,
          userEmail: sig.userEmail,
          verificationCode: sig.verificationCode
        }))
      }
    })

  } catch (error) {
    console.error('❌ Erro interno na finalização:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}