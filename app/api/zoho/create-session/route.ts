import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseConfig } from '@/lib/supabase/config'

export const dynamic = 'force-dynamic'

const ZOHO_API_KEY = process.env.ZOHO_API_KEY
const ZOHO_API_URL = 'https://api.office-integrator.com/writer/officeapi/v1/document'

if (!ZOHO_API_KEY) {
  console.warn('⚠️ ZOHO_API_KEY não configurada')
}

export async function POST(request: NextRequest) {
  try {
    if (!ZOHO_API_KEY) {
      return NextResponse.json(
        { error: 'Zoho API Key não configurada' },
        { status: 500 }
      )
    }

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

    const body = await request.json()
    const { documentId, documentName, isNewDocument } = body

    // Se for documento existente, obter URL assinada do Supabase
    let fileUrl = null
    if (!isNewDocument && documentId) {
      const { data: docData, error: docError } = await supabase
        .from('office_documents')
        .select('file_path')
        .eq('id', documentId)
        .eq('user_id', user.id)
        .single()

      if (docError || !docData) {
        return NextResponse.json(
          { error: 'Documento não encontrado' },
          { status: 404 }
        )
      }

      // Criar URL assinada válida por 1 hora
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(docData.file_path, 3600)

      if (signedUrlError || !signedUrlData) {
        return NextResponse.json(
          { error: 'Erro ao gerar URL do documento' },
          { status: 500 }
        )
      }

      fileUrl = signedUrlData.signedUrl
    }

    // Construir URL base da aplicação para o callback
    const origin = request.headers.get('origin') || request.headers.get('host')
    const protocol = origin?.includes('localhost') ? 'http' : 'https'
    const baseUrl = origin?.includes('http') ? origin : `${protocol}://${origin}`
    const saveUrl = `${baseUrl}/api/zoho/save`

    // Preparar dados para o Zoho
    const formData = new FormData()
    formData.append('apikey', ZOHO_API_KEY)
    
    // Permissões do documento
    formData.append('permissions', JSON.stringify({
      'document.export': true,
      'document.print': true,
      'document.edit': true,
      'review.changes.resolve': false,
      'review.comment': true,
      'collab.chat': true
    }))

    // Configurações do editor
    formData.append('editor_settings', JSON.stringify({
      unit: 'in',
      language: 'pt-BR',
      view: 'pageview'
    }))

    // Configurações de callback (salvamento)
    formData.append('callback_settings', JSON.stringify({
      save_format: 'docx',
      save_url: saveUrl,
      context_info: JSON.stringify({
        document_id: documentId || null,
        user_id: user.id,
        is_new: isNewDocument || false
      })
    }))

    // Informações do documento
    formData.append('document_info', JSON.stringify({
      document_name: documentName || 'Novo Documento',
      document_id: documentId || ''
    }))

    // Informações do usuário
    formData.append('user_info', JSON.stringify({
      user_id: user.id,
      display_name: user.user_metadata?.full_name || user.email || 'Usuário'
    }))

    // Configurações padrão do documento
    formData.append('document_defaults', JSON.stringify({
      orientation: 'portrait',
      paper_size: 'A4',
      font_name: 'Arial',
      font_size: 12,
      track_changes: 'disabled'
    }))

    // Se for documento existente, adicionar URL do arquivo
    if (!isNewDocument && fileUrl) {
      formData.append('url', fileUrl)
    }

    // Fazer requisição para o Zoho
    const zohoResponse = await fetch(ZOHO_API_URL, {
      method: 'POST',
      body: formData
    })

    if (!zohoResponse.ok) {
      const errorText = await zohoResponse.text()
      console.error('Erro na API do Zoho:', errorText)
      return NextResponse.json(
        { error: 'Erro ao criar sessão no Zoho', details: errorText },
        { status: zohoResponse.status }
      )
    }

    const zohoData = await zohoResponse.json()

    // Verificar se a resposta contém a URL do editor
    if (!zohoData.document_url) {
      console.error('Resposta do Zoho sem document_url:', zohoData)
      return NextResponse.json(
        { error: 'Resposta inválida do Zoho' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      editorUrl: zohoData.document_url,
      documentId: zohoData.document_id || documentId
    })

  } catch (error) {
    console.error('Erro ao criar sessão do Zoho:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
