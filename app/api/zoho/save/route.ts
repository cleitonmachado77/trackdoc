import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from '@/lib/supabase/config'

export const dynamic = 'force-dynamic'

// Headers CORS para todas as respostas
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Handler para OPTIONS (CORS preflight)
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Zoho callback recebido')
    
    // O Zoho envia os dados como form-data
    const formData = await request.formData()
    
    // Log para debug
    const allFields = Array.from(formData.keys())
    console.log('📋 Campos recebidos:', allFields)
    
    // O Zoho pode enviar o arquivo com diferentes nomes de campo
    // Tentar 'file' primeiro, depois outros possíveis nomes
    let file = formData.get('file') as File | null
    if (!file || !(file instanceof File)) {
      // Tentar outros nomes possíveis
      file = formData.get('document') as File | null
      if (!file || !(file instanceof File)) {
        file = formData.get('content') as File | null
      }
    }
    
    if (!file || !(file instanceof File)) {
      console.error('❌ Arquivo não encontrado na requisição')
      console.error('📋 Campos disponíveis:', allFields)
      // O Zoho espera uma resposta específica em caso de erro
      return NextResponse.json(
        { error: 'Arquivo não encontrado na requisição' },
        { status: 400, headers: corsHeaders }
      )
    }

    console.log('✅ Arquivo recebido:', file.name, file.size, 'bytes')

    // Obter informações do contexto (enviadas no callback_settings)
    const contextInfoStr = formData.get('context_info') as string
    let contextInfo: any = {}
    
    try {
      // O context_info pode vir como string JSON ou já parseado
      if (contextInfoStr) {
        contextInfo = typeof contextInfoStr === 'string' ? JSON.parse(contextInfoStr) : contextInfoStr
      }
      console.log('📝 Context info:', contextInfo)
    } catch (e) {
      console.warn('⚠️ Erro ao parsear context_info:', e)
    }

    const { document_id, user_id, is_new } = contextInfo

    if (!user_id) {
      console.error('❌ user_id não encontrado no context_info')
      return NextResponse.json(
        { error: 'user_id não fornecido' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Criar cliente Supabase usando service role key para bypass RLS
    // Isso é necessário porque o Zoho faz requisição direta sem cookies de autenticação
    const supabaseKey = supabaseConfig.serviceRoleKey || supabaseConfig.anonKey
    const supabase = createClient(supabaseConfig.url, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    console.log('🔑 Usando service role:', !!supabaseConfig.serviceRoleKey)

    // Converter File para Buffer/ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log('📦 Buffer criado:', buffer.length, 'bytes')

    if (document_id && !is_new) {
      console.log('📝 Atualizando documento existente:', document_id)
      
      // Atualizar documento existente
      const { data: docData, error: docError } = await supabase
        .from('office_documents')
        .select('file_path, user_id')
        .eq('id', document_id)
        .eq('user_id', user_id) // Validar ownership
        .single()

      if (docError || !docData) {
        console.error('❌ Erro ao buscar documento:', docError)
        return NextResponse.json(
          { error: 'Documento não encontrado' },
          { status: 404, headers: corsHeaders }
        )
      }

      console.log('✅ Documento encontrado:', docData.file_path)

      // Fazer upload do arquivo atualizado usando service role ou anon com RLS
      // Precisamos usar um cliente autenticado para fazer upload
      // Vamos tentar com o anon key primeiro
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .update(docData.file_path, buffer, {
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          upsert: true
        })

      if (uploadError) {
        console.error('❌ Erro ao fazer upload:', uploadError)
        return NextResponse.json(
          { error: 'Erro ao salvar documento', details: uploadError.message },
          { status: 500, headers: corsHeaders }
        )
      }

      console.log('✅ Upload concluído')

      // Atualizar metadados do documento
      const { error: updateError } = await supabase
        .from('office_documents')
        .update({
          updated_at: new Date().toISOString(),
          file_size: buffer.length
        })
        .eq('id', document_id)
        .eq('user_id', user_id)

      if (updateError) {
        console.error('⚠️ Erro ao atualizar metadados:', updateError)
        // Não falhar se apenas a atualização de metadados falhar
      } else {
        console.log('✅ Metadados atualizados')
      }

      // O Zoho espera uma resposta específica
      // Formato esperado: { saved: true } ou { error: "mensagem" }
      // Garantir que a resposta seja uma string JSON válida
      return new NextResponse(
        JSON.stringify({ saved: true }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          }
        }
      )

    } else {
      console.log('📄 Criando novo documento')
      
      // Criar novo documento
      const fileName = `${user_id}/${Date.now()}_${file.name || 'documento.docx'}`
      console.log('📁 Nome do arquivo:', fileName)
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, buffer, {
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          upsert: true
        })

      if (uploadError) {
        console.error('❌ Erro ao fazer upload:', uploadError)
        return NextResponse.json(
          { error: 'Erro ao salvar documento', details: uploadError.message },
          { status: 500, headers: corsHeaders }
        )
      }

      console.log('✅ Upload concluído')

      // Criar registro no banco de dados
      const documentName = file.name?.replace(/\.[^/.]+$/, "") || 'Novo Documento'
      
      // Tentar buscar entity_id do usuário usando admin API (só funciona com service role)
      let entityId = null
      if (supabaseConfig.serviceRoleKey) {
        try {
          const adminClient = createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
          })
          const { data: userData } = await adminClient.auth.admin.getUserById(user_id)
          entityId = userData?.user?.user_metadata?.entity_id || null
        } catch (e) {
          console.warn('⚠️ Não foi possível buscar entity_id:', e)
        }
      }
      
      const { data: docData, error: insertError } = await supabase
        .from('office_documents')
        .insert({
          user_id: user_id,
          title: documentName,
          file_path: fileName,
          file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          file_size: buffer.length,
          entity_id: entityId
        })
        .select()
        .single()

      if (insertError) {
        console.error('❌ Erro ao criar registro:', insertError)
        return NextResponse.json(
          { error: 'Erro ao criar registro do documento', details: insertError.message },
          { status: 500, headers: corsHeaders }
        )
      }

      console.log('✅ Documento criado:', docData.id)

      // O Zoho espera uma resposta específica
      // Formato esperado: { saved: true } ou { error: "mensagem" }
      // Garantir que a resposta seja uma string JSON válida
      return new NextResponse(
        JSON.stringify({ saved: true }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          }
        }
      )
    }

  } catch (error) {
    console.error('❌ Erro ao processar salvamento do Zoho:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Erro interno do servidor', 
        details: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    )
  }
}
