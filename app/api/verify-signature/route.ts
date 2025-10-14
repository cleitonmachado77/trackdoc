import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
}

export async function POST(request: NextRequest) {
  try {
    const { verificationCode } = await request.json()

    if (!verificationCode) {
      return NextResponse.json(
        { error: 'Código de verificação é obrigatório' },
        { status: 400 }
      )
    }

    console.log('🔍 Verificando código:', verificationCode)

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

    // Buscar assinatura pelo código de verificação (simples ou múltipla individual)
    const { data: signatures, error: searchError } = await serviceRoleSupabase
      .from('document_signatures')
      .select(`
        *,
        document:documents(*)
      `)
      .eq('verification_code', verificationCode.trim())

    if (searchError) {
      console.error('❌ Erro ao buscar assinatura:', searchError)
    }

    // Buscar assinatura múltipla pelo código de verificação no metadata
    const { data: multiSignatures, error: multiSearchError } = await serviceRoleSupabase
      .from('multi_signature_requests')
      .select(`
        *,
        approvals:multi_signature_approvals(*)
      `)
      .eq('status', 'completed')

    if (multiSearchError) {
      console.error('❌ Erro ao buscar assinatura múltipla:', multiSearchError)
    }

    // Verificar se encontrou alguma assinatura
    const foundSignatures = signatures || []
    const allMultiSigns = multiSignatures || []
    
    // Filtrar assinaturas múltiplas pelo código de verificação no metadata (fallback para assinaturas antigas)
    const multiSigns = allMultiSigns.filter((signature: any) => {
      if (!signature.metadata || !signature.metadata.signatures) {
        return false
      }
      
      // Verificar se algum dos signatários tem o código de verificação
      return signature.metadata.signatures.some((sig: any) => 
        sig.verificationCode === verificationCode.trim()
      )
    })
    
    if (foundSignatures.length === 0 && multiSigns.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Código de verificação não encontrado ou inválido'
      })
    }

    // Determinar se é assinatura simples ou múltipla
    if (foundSignatures.length > 0) {
      // Assinatura encontrada na tabela document_signatures
      const signature = foundSignatures[0]
      
      // Verificar se é uma assinatura múltipla individual (pelo qr_code_data)
      let isMultipleSignature = false
      try {
        const qrData = JSON.parse(signature.qr_code_data || '{}')
        isMultipleSignature = qrData.signatureType === 'multiple'
      } catch (e) {
        // Se não conseguir parsear, assume que é simples
        isMultipleSignature = false
      }
      
      // Verificar se a assinatura está válida (não expirada, etc.)
      const now = new Date()
      const signatureDate = new Date(signature.created_at)
      
      // Verificar se a assinatura não é muito antiga (opcional)
      const daysSinceSignature = Math.floor((now.getTime() - signatureDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysSinceSignature > 365) { // Mais de 1 ano
        return NextResponse.json({
          success: false,
          error: 'Assinatura expirada (mais de 1 ano)'
        })
      }

      // Buscar informações do usuário
      const { data: userData, error: userError } = await serviceRoleSupabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', signature.user_id)
        .single()

      if (userError) {
        console.warn('⚠️ Erro ao buscar dados do usuário:', userError)
      }

      // Retornar dados da assinatura verificada
      return NextResponse.json({
        success: true,
        message: isMultipleSignature ? 'Assinatura múltipla verificada com sucesso' : 'Assinatura simples verificada com sucesso',
        signatureType: isMultipleSignature ? 'multiple' : 'simple',
        signature: {
          id: signature.id,
          userName: userData?.full_name || 'Usuário não encontrado',
          userEmail: userData?.email || 'Email não encontrado',
          timestamp: signature.created_at,
          documentId: signature.document_id || signature.arqsign_document_id,
          hash: signature.signature_hash,
          verificationCode: signature.verification_code,
          documentTitle: signature.title || signature.document?.title || 'Documento não encontrado',
          documentPath: signature.document?.file_path || null,
          status: signature.status,
          signatureUrl: signature.signature_url,
          isMultipleSignature: isMultipleSignature
        }
      })
    } else if (multiSigns.length > 0) {
      // Assinatura múltipla
      const multiSignature = multiSigns[0]
      
      // Verificar se a assinatura está válida (não expirada, etc.)
      const now = new Date()
      const signatureDate = new Date(multiSignature.updated_at)
      
      // Verificar se a assinatura não é muito antiga (opcional)
      const daysSinceSignature = Math.floor((now.getTime() - signatureDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysSinceSignature > 365) { // Mais de 1 ano
        return NextResponse.json({
          success: false,
          error: 'Assinatura expirada (mais de 1 ano)'
        })
      }

      // Buscar informações dos usuários que assinaram
      const approvedUsers = multiSignature.approvals.filter((approval: any) => approval.status === 'approved')
      const userPromises = approvedUsers.map((approval: any) => 
        serviceRoleSupabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', approval.user_id)
          .single()
      )
      
      const userResults = await Promise.all(userPromises)
      const signers = userResults.map((result, index) => ({
        name: result.data?.full_name || approvedUsers[index].user_name || 'Usuário não encontrado',
        email: result.data?.email || approvedUsers[index].user_email || 'Email não encontrado',
        signedAt: approvedUsers[index].signed_at || approvedUsers[index].updated_at
      }))

      // Encontrar a assinatura específica com o código de verificação
      const specificSignature = multiSignature.metadata.signatures.find((sig: any) => 
        sig.verificationCode === verificationCode.trim()
      )

      // Retornar dados da assinatura múltipla verificada
      return NextResponse.json({
        success: true,
        message: 'Assinatura múltipla verificada com sucesso',
        signatureType: 'multiple',
        signature: {
          id: multiSignature.id,
          documentName: multiSignature.document_name,
          documentPath: multiSignature.signed_file_path,
          timestamp: multiSignature.updated_at,
          documentId: multiSignature.document_id,
          hash: specificSignature?.signatureHash || specificSignature?.hash,
          verificationCode: specificSignature?.verificationCode,
          status: multiSignature.status,
          totalSignatures: multiSignature.total_signatures,
          completedSignatures: multiSignature.completed_signatures,
          signers: signers,
          requesterId: multiSignature.requester_id,
          specificSigner: specificSignature ? {
            name: specificSignature.userName,
            email: specificSignature.userEmail,
            timestamp: specificSignature.timestamp
          } : null
        }
      })
    }

  } catch (error) {
    console.error('❌ Erro interno na verificação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
