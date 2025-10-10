import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from '@/lib/supabase/config'

export async function GET(request: Request) {
  try {
    console.log('🔍 [signed-documents] Iniciando busca de documentos assinados...')

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

    // Verificar autenticação do usuário
    console.log('🔐 [signed-documents] Verificando autenticação...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('❌ [signed-documents] Erro de autenticação:', authError)
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }
    console.log('✅ [signed-documents] Usuário autenticado:', user.id)

    // Usar service role key para bypass RLS nas consultas
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

    // Buscar documentos assinados pelo usuário logado
    console.log('🔍 [signed-documents] Buscando documentos assinados para usuário:', user.id)
    
    const { data: signatures, error: signaturesError } = await serviceRoleSupabase
      .from('document_signatures')
      .select(`
        id,
        document_id,
        user_id,
        title,
        status,
        signature_url,
        verification_code,
        document_hash,
        signature_hash,
        created_at,
        updated_at
      `)
      .eq('status', 'completed')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10) // Limitar aos últimos 10 documentos

    if (signaturesError) {
      console.error('❌ Erro ao buscar assinaturas:', signaturesError)
      return NextResponse.json(
        { error: 'Erro ao buscar documentos assinados' },
        { status: 500 }
      )
    }

    console.log('📊 [signed-documents] Assinaturas encontradas:', signatures?.length || 0)

    // Buscar informações dos documentos
    const documentIds = signatures?.map(sig => sig.document_id).filter(Boolean) || []
    let documentInfo = new Map()
    
    if (documentIds.length > 0) {
      const { data: docs, error: docsError } = await serviceRoleSupabase
        .from('documents')
        .select('id, title, file_path')
        .in('id', documentIds)
      
      if (docsError) {
        console.error('❌ Erro ao buscar informações dos documentos:', docsError)
      } else if (docs) {
        docs.forEach(doc => {
          documentInfo.set(doc.id, doc)
        })
      }
    }

    // Processar documentos assinados
    const processedDocuments = (signatures || []).map(sig => {
      const docInfo = documentInfo.get(sig.document_id)
      
      // Priorizar título da tabela document_signatures, depois da tabela documents
      const documentTitle = sig.title || docInfo?.title || 'Documento sem título'
      
      return {
        id: sig.id,
        document_id: sig.document_id,
        document_name: documentTitle,
        document_path: docInfo?.file_path || '',
        signed_file_path: sig.signature_url,
        requester_id: sig.user_id,
        requester_name: 'Usuário',
        requester_email: '',
        total_signatures: 1,
        completed_signatures: 1,
        status: 'completed',
        created_at: sig.created_at,
        completed_at: sig.updated_at || sig.created_at,
        signatures: [{
          userName: 'Usuário',
          userEmail: '',
          timestamp: sig.created_at
        }],
        verification_code: sig.verification_code,
        document_hash: sig.document_hash,
        signature_hash: sig.signature_hash
      }
    })

    console.log('📊 [signed-documents] Documentos processados:', processedDocuments.length)

    return NextResponse.json({
      success: true,
      documents: processedDocuments,
      totals: {
        completed: processedDocuments.length
      }
    })

  } catch (error) {
    console.error('❌ Erro interno no endpoint de documentos assinados:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
