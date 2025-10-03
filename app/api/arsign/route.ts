import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { supabaseConfig } from '@/lib/supabase/config'
import { digitalSignatureService, SignatureData } from '@/lib/digital-signature'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando requisição POST para /api/arsign (Sistema Simplificado)')
    console.log('📅 Timestamp:', new Date().toISOString())
    
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
    console.log('🔐 Verificando autenticação...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('❌ Erro de autenticação:', authError)
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }
    console.log('✅ Usuário autenticado:', user.id)

    console.log('📋 Processando FormData...')
    const formData = await request.formData()
    
    // Log de todos os campos recebidos (sem usar instanceof File)
    const allFields = Array.from(formData.entries())
    console.log('📋 Todos os campos recebidos:', allFields.map(([key, value]) => ({
      key,
      type: typeof value,
      hasValue: !!value,
      valueLength: typeof value === 'object' && 'size' in value ? (value as any).size : String(value).length
    })))

    const action = formData.get('action') as string
    const documentId = formData.get('documentId') as string || formData.get('document_id') as string
    const file = formData.get('file') as any // Usar 'any' para evitar problemas com File
    const signatureTemplateStr = formData.get('signature_template') as string
    const workflowProcessId = formData.get('workflow_process_id') as string
    const workflowExecutionId = formData.get('workflow_execution_id') as string
    const usersStr = formData.get('users') as string
    const selectedDocumentsStr = formData.get('selected_documents') as string // ✅ NOVO: Documentos selecionados

    // Processar template de assinatura personalizado
    let signatureTemplate = null
    if (signatureTemplateStr) {
      try {
        signatureTemplate = JSON.parse(signatureTemplateStr)
        console.log('🎨 Template personalizado recebido:', {
          title: signatureTemplate.title,
          position: signatureTemplate.position,
          hasCustomColors: !!(signatureTemplate.background_color && signatureTemplate.border_color)
        })
      } catch (error) {
        console.warn('⚠️ Erro ao processar template personalizado:', error)
        signatureTemplate = null
      }
    }

    // Processar usuários para assinatura múltipla
    let multiSignatureUsers = []
    if (usersStr && (action === 'multi_signature' || action === 'sign_workflow')) {
      try {
        multiSignatureUsers = JSON.parse(usersStr)
        console.log('👥 Usuários para assinatura múltipla:', multiSignatureUsers.length, 'usuários')
      } catch (error) {
        console.warn('⚠️ Erro ao processar usuários para assinatura múltipla:', error)
        return NextResponse.json(
          { error: 'Erro ao processar lista de usuários' },
          { status: 400 }
        )
      }
    }

    // ✅ NOVO: Processar documentos selecionados
    let selectedDocuments = []
    if (selectedDocumentsStr) {
      try {
        selectedDocuments = JSON.parse(selectedDocumentsStr)
        console.log('📄 Documentos selecionados para assinatura:', selectedDocuments.length)
      } catch (error) {
        console.warn('⚠️ Erro ao processar documentos selecionados:', error)
        selectedDocuments = []
      }
    }

    console.log('📋 Dados extraídos:', { 
      action, 
      documentId, 
      hasFile: !!file,
      fileName: file?.name,
      hasCustomTemplate: !!signatureTemplate,
      workflowProcessId,
      workflowExecutionId
    })

    let pdfBuffer: Buffer
    let documentName = 'Documento'

    if (action === 'upload') {
      // Upload de novo arquivo
      if (!file) {
        console.error('❌ Nenhum arquivo fornecido')
        return NextResponse.json(
          { error: 'Nenhum arquivo fornecido' },
          { status: 400 }
        )
      }

      if (!file.name.toLowerCase().endsWith('.pdf')) {
        console.error('❌ Arquivo não é PDF:', file.name)
        return NextResponse.json(
          { error: 'Apenas arquivos PDF são aceitos' },
          { status: 400 }
        )
      }

      console.log('📄 Processando arquivo PDF:', file.name, 'Tamanho:', file.size)
      pdfBuffer = Buffer.from(await file.arrayBuffer())
      documentName = file.name
      console.log('✅ Arquivo processado, tamanho do buffer:', pdfBuffer.length)
      
    } else if (action === 'existing') {
      // Usar documento existente
      if (!documentId) {
        console.error('❌ ID do documento não fornecido')
        return NextResponse.json(
          { error: 'ID do documento não fornecido' },
          { status: 400 }
        )
      }

      console.log('🔍 Buscando documento:', documentId)
      // Buscar documento no Supabase
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (docError || !document) {
        console.error('❌ Documento não encontrado:', docError)
        console.error('🔍 ID do documento buscado:', documentId)
        console.error('🔍 Usuário atual:', user.id)
        return NextResponse.json(
          { error: 'Documento não encontrado' },
          { status: 404 }
        )
      }

      console.log('📄 Documento encontrado:', document.title)
      console.log('📄 Detalhes do documento:', {
        id: document.id,
        title: document.title,
        entity_id: document.entity_id,
        file_path: document.file_path,
        created_at: document.created_at
      })
      documentName = document.title

      // Verificar se o usuário tem acesso ao documento
      // Buscar o perfil do usuário para obter o entity_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('entity_id')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('❌ Erro ao buscar perfil do usuário:', profileError)
        return NextResponse.json(
          { error: 'Erro ao verificar perfil do usuário' },
          { status: 500 }
        )
      }

      // Verificar acesso ao documento
      let hasAccess = false
      let accessReason = ''

      // Opção 1: Usuário é o autor do documento
      if (document.author_id === user.id) {
        hasAccess = true
        accessReason = 'Usuário é o autor do documento'
        console.log('✅ Acesso permitido:', accessReason)
      }
      // Opção 2: Documento tem entity_id e usuário pertence à mesma entidade
      else if (document.entity_id && profile?.entity_id && document.entity_id === profile.entity_id) {
        hasAccess = true
        accessReason = 'Usuário pertence à mesma entidade do documento'
        console.log('✅ Acesso permitido:', accessReason)
      }
      // Opção 3: Documento não tem entity_id mas usuário tem perfil válido
      else if (!document.entity_id && profile) {
        hasAccess = true
        accessReason = 'Documento sem entidade, usuário com perfil válido'
        console.log('✅ Acesso permitido:', accessReason)
      }

      if (!hasAccess) {
        console.error('❌ Acesso negado ao documento')
        console.error('🔍 Documento entity_id:', document.entity_id)
        console.error('🔍 Documento author_id:', document.author_id)
        console.error('🔍 Usuário atual:', user.id)
        console.error('🔍 Usuário entity_id:', profile?.entity_id)
        return NextResponse.json(
          { error: 'Acesso negado ao documento' },
          { status: 403 }
        )
      }

      console.log('🔐 Verificação de acesso concluída:', accessReason)

      console.log('🔍 Buscando arquivo no storage:', document.file_path)
      // Buscar arquivo do storage
      const { data: fileData, error: fileError } = await supabase.storage
        .from('documents')
        .download(document.file_path)

      if (fileError || !fileData) {
        console.error('❌ Erro ao carregar arquivo:', fileError)
        return NextResponse.json(
          { error: 'Erro ao carregar arquivo do documento' },
          { status: 500 }
        )
      }

      pdfBuffer = Buffer.from(await fileData.arrayBuffer())
      console.log('✅ Arquivo do storage carregado, tamanho:', pdfBuffer.length)
      
    } else if (action === 'sign_workflow') {
      // Assinatura de documento em workflow
      if (!documentId) {
        console.error('❌ ID do documento não fornecido')
        return NextResponse.json(
          { error: 'ID do documento não fornecido' },
          { status: 400 }
        )
      }

      console.log('🔍 Assinando documento em workflow:', documentId)
      
      // Buscar documento no Supabase
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (docError || !document) {
        console.error('❌ Documento não encontrado:', docError)
        return NextResponse.json(
          { error: 'Documento não encontrado' },
          { status: 404 }
        )
      }

      console.log('📄 Documento encontrado para workflow:', document.title)
      documentName = document.title

      // Buscar arquivo do storage
      const { data: fileData, error: fileError } = await supabase.storage
        .from('documents')
        .download(document.file_path)

      if (fileError || !fileData) {
        console.error('❌ Erro ao carregar arquivo:', fileError)
        return NextResponse.json(
          { error: 'Erro ao carregar arquivo do documento' },
          { status: 500 }
        )
      }

      pdfBuffer = Buffer.from(await fileData.arrayBuffer())
      console.log('✅ Arquivo do workflow carregado, tamanho:', pdfBuffer.length)
      
    } else if (action === 'multi_signature') {
      // Assinatura múltipla
      if (multiSignatureUsers.length === 0) {
        console.error('❌ Nenhum usuário fornecido para assinatura múltipla')
        return NextResponse.json(
          { error: 'Nenhum usuário fornecido para assinatura múltipla' },
          { status: 400 }
        )
      }

      if (file) {
        // Upload de novo arquivo
        if (!file.name.toLowerCase().endsWith('.pdf')) {
          console.error('❌ Arquivo não é PDF:', file.name)
          return NextResponse.json(
            { error: 'Apenas arquivos PDF são aceitos' },
            { status: 400 }
          )
        }

        console.log('📄 Processando arquivo PDF para assinatura múltipla:', file.name, 'Tamanho:', file.size)
        pdfBuffer = Buffer.from(await file.arrayBuffer())
        documentName = file.name
        console.log('✅ Arquivo processado, tamanho do buffer:', pdfBuffer.length)
        
      } else if (documentId) {
        // Usar documento existente
        console.log('🔍 Buscando documento para assinatura múltipla:', documentId)
        const { data: document, error: docError } = await supabase
          .from('documents')
          .select('*')
          .eq('id', documentId)
          .single()

        if (docError || !document) {
          console.error('❌ Documento não encontrado:', docError)
          return NextResponse.json(
            { error: 'Documento não encontrado' },
            { status: 404 }
          )
        }

        console.log('📄 Documento encontrado para assinatura múltipla:', document.title)
        documentName = document.title

        // Buscar arquivo do storage
        const { data: fileData, error: fileError } = await supabase.storage
          .from('documents')
          .download(document.file_path)

        if (fileError || !fileData) {
          console.error('❌ Erro ao carregar arquivo:', fileError)
          return NextResponse.json(
            { error: 'Erro ao carregar arquivo do documento' },
            { status: 500 }
          )
        }

        pdfBuffer = Buffer.from(await fileData.arrayBuffer())
        console.log('✅ Arquivo carregado para assinatura múltipla, tamanho:', pdfBuffer.length)
        
      } else {
        console.error('❌ Nenhum arquivo ou documento fornecido para assinatura múltipla')
        return NextResponse.json(
          { error: 'Nenhum arquivo ou documento fornecido' },
          { status: 400 }
        )
      }
      
    } else {
      console.error('❌ Ação inválida:', action)
      return NextResponse.json(
        { error: 'Ação inválida' },
        { status: 400 }
      )
    }

    // Validar PDF
    console.log('🔍 Validando PDF...')
    const isValidPdf = await digitalSignatureService.validatePdf(pdfBuffer)
    if (!isValidPdf) {
      console.error('❌ PDF inválido')
      return NextResponse.json(
        { error: 'Arquivo PDF inválido' },
        { status: 400 }
      )
    }
    console.log('✅ PDF válido')

    // Extrair metadados do PDF
    console.log('📊 Extraindo metadados do PDF...')
    const metadata = await digitalSignatureService.extractPdfMetadata(pdfBuffer)
    console.log('✅ Metadados extraídos:', metadata)

    // Obter informações do usuário
    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário'
    const userEmail = user.email || 'sem-email@exemplo.com'

    console.log('👤 Informações do usuário:', { userName, userEmail })

    // Criar assinatura digital
    console.log('✍️ Criando assinatura digital...')
    console.log('📊 Dados para assinatura:', {
      pdfBufferSize: pdfBuffer.length,
      userId: user.id,
      userName,
      userEmail,
      documentId: documentId || `doc_${Date.now()}`
    })
    
    // Verificar instância do serviço
    console.log('🔧 Verificando instância do serviço de assinatura...')
    console.log('📋 Serviço disponível:', !!digitalSignatureService)
    console.log('📋 Métodos disponíveis:', Object.getOwnPropertyNames(Object.getPrototypeOf(digitalSignatureService)))
    
    try {
      let signedPdf: Buffer
      let signature: any
      let allSignatures: any[] = []

      if (action === 'multi_signature' || (action === 'sign_workflow' && multiSignatureUsers.length > 0)) {
        // Assinatura múltipla - criar processo de aprovação ou assinar imediatamente (para workflow)
        console.log('👥 Criando processo de assinatura múltipla para', multiSignatureUsers.length, 'usuários')
        
        // ✅ CORREÇÃO: Para sign_workflow, assinar imediatamente
        if (action === 'sign_workflow' && multiSignatureUsers.length > 0) {
          console.log('🎯 [WORKFLOW] Assinando documento imediatamente com múltiplos usuários')
          
          // Criar assinatura múltipla imediatamente
          const result = await digitalSignatureService.createMultiSignature(
            pdfBuffer,
            multiSignatureUsers,
            documentId || `doc_${Date.now()}`,
            signatureTemplate
          )
          signedPdf = result.signedPdf
          signature = result.signatures[0] // Primeira assinatura como referência
          allSignatures = result.signatures

          console.log('✅ [WORKFLOW] Assinatura múltipla criada imediatamente:', allSignatures.length, 'assinaturas')
          console.log('🔐 [WORKFLOW] Carimbo de tempo digital:', signature.digitalTimestamp)
        } else {
          // ✅ Para multi_signature, criar processo de aprovação (lógica original)
          console.log('📋 [MULTI_SIGNATURE] Criando processo de aprovação')
          
          // Verificar se a service role key está configurada
          if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada')
            return NextResponse.json(
              { error: 'Configuração de storage incompleta' },
              { status: 500 }
            )
          }
          
          // Criar cliente com service role key para operações de storage
          const serviceRoleSupabase = createClient(
            supabaseConfig.url,
            process.env.SUPABASE_SERVICE_ROLE_KEY
          )

        // Salvar o arquivo original no storage primeiro
        const filePath = `temp_${Date.now()}_${documentName}`
        const { error: uploadError } = await serviceRoleSupabase.storage
          .from('documents')
          .upload(filePath, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: false
          })

        if (uploadError) {
          console.error('❌ Erro ao fazer upload do arquivo original:', uploadError)
          throw new Error('Erro ao salvar arquivo original')
        }

        // Verificar se as tabelas existem
        console.log('🔍 Verificando se as tabelas existem...')
        
        try {
          // Tentar fazer uma consulta simples para verificar se a tabela existe
          const { error: testError } = await supabase
            .from('multi_signature_requests')
            .select('id')
            .limit(1)
          
          if (testError && testError.code === '42P01') {
            console.error('❌ Tabela multi_signature_requests não existe')
            return NextResponse.json({
              success: false,
              error: 'Tabelas de assinatura múltipla não foram criadas',
              message: 'Execute o SQL no Supabase Dashboard para criar as tabelas necessárias',
              sqlFile: 'create-multi-signature-tables.sql'
            }, { status: 400 })
          } else if (testError) {
            console.error('❌ Erro ao verificar tabelas:', testError)
            return NextResponse.json({
              success: false,
              error: 'Erro ao verificar tabelas',
              details: testError
            }, { status: 500 })
          } else {
            console.log('✅ Tabelas existem')
          }
        } catch (error) {
          console.error('❌ Erro ao verificar tabelas:', error)
          return NextResponse.json({
            success: false,
            error: 'Erro ao verificar tabelas',
            details: error
          }, { status: 500 })
        }

        // Criar solicitação de assinatura múltipla no banco usando service role
        const { data: multiSignatureRequest, error: requestError } = await serviceRoleSupabase
          .from('multi_signature_requests')
          .insert({
            document_id: documentId || `doc_${Date.now()}`,
            document_name: documentName,
            document_path: filePath,
            requester_id: user.id,
            signature_template: signatureTemplate,
            status: 'pending',
            total_signatures: multiSignatureUsers.length,
            completed_signatures: 0,
            metadata: {
              original_file_size: pdfBuffer.length,
              signature_template: signatureTemplate
            }
          })
          .select()
          .single()

        if (requestError) {
          console.error('Erro ao criar solicitação de assinatura múltipla:', requestError)
          throw new Error('Erro ao criar solicitação de assinatura múltipla')
        }

        // Criar aprovações individuais para cada usuário usando service role
        const approvals = multiSignatureUsers.map((signatureUser: any) => ({
          request_id: multiSignatureRequest.id,
          user_id: signatureUser.id,
          user_name: signatureUser.full_name,
          user_email: signatureUser.email,
          status: 'pending'
        }))

        const { error: approvalsError } = await serviceRoleSupabase
          .from('multi_signature_approvals')
          .insert(approvals)

        if (approvalsError) {
          console.error('Erro ao criar aprovações individuais:', approvalsError)
          throw new Error('Erro ao criar aprovações individuais')
        }

        // Criar notificações para cada usuário
        const notifications = multiSignatureUsers.map((signatureUser: any) => ({
          title: 'Documento para Assinatura',
          message: `Você foi selecionado para assinar o documento "${documentName}". Acesse o sistema para confirmar sua assinatura.`,
          type: 'info',
          priority: 'high',
          recipients: [signatureUser.email],
          channels: ['email', 'in_app'],
          status: 'pending',
          created_by: user.id
        }))

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notifications)

        if (notificationError) {
          console.warn('⚠️ Erro ao criar notificações:', notificationError)
        } else {
          console.log('✅ Notificações criadas para', multiSignatureUsers.length, 'usuários')
        }

          // Retornar dados da solicitação criada (sem assinar o documento ainda)
          return NextResponse.json({
            success: true,
            message: 'Processo de assinatura múltipla criado com sucesso',
            data: {
              requestId: multiSignatureRequest.id,
              documentName: documentName,
              totalSignatures: multiSignatureUsers.length,
              pendingSignatures: multiSignatureUsers.length,
              status: 'pending',
              users: multiSignatureUsers.map(u => ({
                id: u.id,
                name: u.full_name,
                email: u.email,
                status: 'pending'
              }))
            }
          })
        }
      } else {
        // Assinatura única
        const result = await digitalSignatureService.createSignature(
          pdfBuffer,
          user.id,
          userName,
          userEmail,
          documentId || `doc_${Date.now()}`,
          signatureTemplate
        )
        signedPdf = result.signedPdf
        signature = result.signature
        allSignatures = [signature]

        console.log('✅ Assinatura criada:', signature.id)
        console.log('🔐 Carimbo de tempo digital:', signature.digitalTimestamp)
        console.log('📊 Dados da assinatura:', {
          id: signature.id,
          userId: signature.userId,
          documentId: signature.documentId,
          userName: signature.userName,
          userEmail: signature.userEmail,
          timestamp: signature.timestamp,
          hash: signature.hash,
          digitalTimestamp: signature.digitalTimestamp,
          verificationCode: signature.verificationCode,
          documentHash: signature.documentHash,
          signatureHash: signature.signatureHash
        })
      }

      // Salvar PDF assinado no storage
      console.log('💾 Salvando PDF assinado...')
      
      // Verificar se o bucket existe e está acessível usando service role key
      console.log('🔍 Verificando bucket de storage...')
      
      // Verificar se a service role key está configurada
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada')
        return NextResponse.json(
          { error: 'Configuração de storage incompleta' },
          { status: 500 }
        )
      }
      
      // Criar cliente com service role key para operações de storage
      const serviceRoleSupabase = createClient(
        supabaseConfig.url,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
      
      console.log('🔑 Usando Service Role Key para operações de storage')
      
      const { data: bucketList, error: bucketError } = await serviceRoleSupabase.storage.listBuckets()
      if (bucketError) {
        console.error('❌ Erro ao listar buckets:', bucketError)
        return NextResponse.json(
          { error: 'Erro ao acessar storage: ' + bucketError.message },
          { status: 500 }
        )
      }
      
      const documentsBucket = bucketList.find(bucket => bucket.name === 'documents')
      if (!documentsBucket) {
        console.error('❌ Bucket "documents" não encontrado')
        console.log('📋 Buckets disponíveis:', bucketList.map(b => b.name))
        return NextResponse.json(
          { error: 'Bucket de documentos não encontrado' },
          { status: 500 }
        )
      }
      
      console.log('✅ Bucket "documents" encontrado:', documentsBucket.name)
      console.log('📋 Status do bucket:', {
        id: documentsBucket.id,
        name: documentsBucket.name,
        public: documentsBucket.public,
        createdAt: documentsBucket.created_at
      })
      
      // Verificar políticas RLS do bucket
      console.log('🔐 Verificando políticas RLS do bucket...')
      try {
        const { data: policies, error: policiesError } = await serviceRoleSupabase
          .from('storage.policies')
          .select('*')
          .eq('bucket_id', documentsBucket.id)
        
        if (policiesError) {
          console.warn('⚠️ Não foi possível verificar políticas RLS:', policiesError.message)
        } else {
          console.log('📋 Políticas RLS encontradas:', policies?.length || 0)
          if (policies && policies.length > 0) {
            policies.forEach((policy, index) => {
              console.log(`  ${index + 1}. ${policy.name}: ${policy.definition}`)
            })
          }
        }
      } catch (policiesException) {
        console.warn('⚠️ Exceção ao verificar políticas RLS:', policiesException)
      }
      
      // Sanitizar nome do arquivo para evitar problemas no storage
      const sanitizedDocumentName = documentName
        .replace(/[^a-zA-Z0-9.-]/g, '_') // Substituir caracteres especiais por underscore
        .replace(/_{2,}/g, '_') // Remover underscores duplicados
        .replace(/^_|_$/g, '') // Remover underscores no início e fim
        .substring(0, 50) // Limitar tamanho do nome
      
      const signedFileName = `signed_${Date.now()}_${sanitizedDocumentName}.pdf`
      console.log('📝 Nome do arquivo sanitizado:', signedFileName)
      
      // Testar upload com nome simples primeiro para debug
      const testFileName = `test_${Date.now()}.pdf`
      console.log('🧪 Testando upload com nome simples:', testFileName)
      
      try {
        const { data: testUpload, error: testError } = await serviceRoleSupabase.storage
          .from('documents')
          .upload(testFileName, signedPdf, {
            contentType: 'application/pdf',
            cacheControl: '3600'
          })
        
        if (testError) {
          console.error('❌ Erro no teste de upload:', testError)
          console.error('📝 Detalhes do erro de teste:', {
            message: testError.message,
            name: testError.name
          })
        } else {
          console.log('✅ Teste de upload bem-sucedido:', testFileName)
          // Remover arquivo de teste
          await serviceRoleSupabase.storage.from('documents').remove([testFileName])
          console.log('🗑️ Arquivo de teste removido')
        }
      } catch (testException) {
        console.error('❌ Exceção no teste de upload:', testException)
      }
      
      // Tentar upload do arquivo real
      console.log('📤 Iniciando upload do arquivo real:', signedFileName)
      console.log('📊 Detalhes do arquivo:', {
        fileName: signedFileName,
        fileSize: signedPdf.length,
        bufferType: typeof signedPdf,
        isBuffer: Buffer.isBuffer(signedPdf),
        contentType: 'application/pdf'
      })
      
      const { data: uploadData, error: uploadError } = await serviceRoleSupabase.storage
        .from('documents')
        .upload(signedFileName, signedPdf, {
          contentType: 'application/pdf',
          cacheControl: '3600'
        })

      if (uploadError) {
        console.error('❌ Erro ao salvar PDF assinado:', uploadError)
        console.error('📝 Detalhes do erro:', {
          message: uploadError.message,
          name: uploadError.name,
          fileName: signedFileName,
          fileSize: signedPdf.length
        })
        return NextResponse.json(
          { error: `Erro ao salvar documento assinado: ${uploadError.message}` },
          { status: 500 }
        )
      }

      console.log('✅ PDF assinado salvo:', signedFileName)

             // Registrar a operação de assinatura no banco
       console.log('💾 Salvando dados da assinatura...')
       try {
         const { error: insertError } = await supabase.from('document_signatures').insert({
           user_id: user.id,
           document_id: documentId || null,
           arqsign_document_id: signature.id,
           status: 'completed',
           signature_url: signedFileName,
           verification_code: signature.verificationCode,
           verification_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify/${signature.verificationCode}`,
           qr_code_data: JSON.stringify({
             code: signature.verificationCode,
             url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify/${signature.verificationCode}`,
             documentId: signature.documentId,
             timestamp: signature.digitalTimestamp
           }),
           document_hash: signature.documentHash,
           signature_hash: signature.hash
         })

        if (insertError) {
          console.warn('⚠️ Erro ao salvar no banco:', insertError)
        } else {
          console.log('✅ Dados salvos no banco com sucesso')
        }
      } catch (dbError) {
        console.warn('⚠️ Erro ao salvar no banco:', dbError)
      }

      // Se for uma ação de workflow, substituir o documento original
      if (action === 'sign_workflow' && documentId) {
        console.log('🔄 Substituindo documento original pelo assinado...')
        try {
          // Primeiro, buscar o documento original para obter os metadados
          const { data: originalDocument, error: fetchError } = await supabase
            .from('documents')
            .select('*')
            .eq('id', documentId)
            .single()

          if (fetchError) {
            console.warn('⚠️ Erro ao buscar documento original:', fetchError)
          } else {
            // Atualizar o documento original com o novo arquivo assinado
            const { error: updateError } = await supabase
              .from('documents')
              .update({
                file_path: signedFileName,
                updated_at: new Date().toISOString(),
                metadata: JSON.stringify({
                  ...JSON.parse((originalDocument as any)?.metadata || '{}'),
                  signed_version: true,
                  original_file_path: (originalDocument as any)?.file_path,
                  signed_at: new Date().toISOString(),
                  signed_by: user.id,
                  workflow_process_id: workflowProcessId,
                  workflow_execution_id: workflowExecutionId
                })
              })
              .eq('id', documentId)

            if (updateError) {
              console.warn('⚠️ Erro ao atualizar documento original:', updateError)
            } else {
              console.log('✅ Documento original substituído com sucesso')
              
              // Remover arquivo original do storage (opcional)
              if (originalDocument?.file_path && originalDocument.file_path !== signedFileName) {
                try {
                  await serviceRoleSupabase.storage
                    .from('documents')
                    .remove([originalDocument.file_path])
                  console.log('🗑️ Arquivo original removido do storage')
                } catch (removeError) {
                  console.warn('⚠️ Erro ao remover arquivo original:', removeError)
                }
              }
            }
          }
        } catch (replaceError) {
          console.warn('⚠️ Erro ao substituir documento:', replaceError)
        }
      }

      // ✅ NOVO: Processar múltiplos documentos se selecionados
      let processedDocuments = []
      if (selectedDocuments.length > 0) {
        console.log('📄 Processando múltiplos documentos selecionados...')
        
        for (const docId of selectedDocuments) {
          try {
            // Buscar documento
            const { data: doc, error: docError } = await supabase
              .from('documents')
              .select('*')
              .eq('id', docId)
              .single()

            if (docError || !doc) {
              console.warn(`⚠️ Documento ${docId} não encontrado:`, docError)
              continue
            }

            // Baixar arquivo do documento
            const { data: fileData, error: fileError } = await serviceRoleSupabase.storage
              .from('documents')
              .download(doc.file_path)

            if (fileError) {
              console.warn(`⚠️ Erro ao baixar documento ${docId}:`, fileError)
              continue
            }

            const docPdfBuffer = Buffer.from(await fileData.arrayBuffer())

            // Criar assinatura para este documento
            let docSignedPdf: Buffer
            let docSignature: any

            if (action === 'multi_signature') {
              const { signedPdf, signatures } = await digitalSignatureService.createMultiSignature(
                docPdfBuffer,
                multiSignatureUsers,
                docId,
                signatureTemplate
              )
              docSignedPdf = signedPdf
              docSignature = signatures
            } else {
              const { signedPdf, signature } = await digitalSignatureService.createSignature(
                docPdfBuffer,
                user.id,
                user.user_metadata?.full_name || 'Usuário',
                user.email || '',
                docId,
                signatureTemplate
              )
              docSignedPdf = signedPdf
              docSignature = signature
            }

            // Salvar documento assinado
            const docSignedFileName = `signed_${Date.now()}_${doc.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
            const { error: docUploadError } = await serviceRoleSupabase.storage
              .from('documents')
              .upload(docSignedFileName, docSignedPdf, {
                contentType: 'application/pdf',
                upsert: false
              })

            if (docUploadError) {
              console.warn(`⚠️ Erro ao fazer upload do documento assinado ${docId}:`, docUploadError)
              continue
            }

            // Substituir documento original
            const { error: docUpdateError } = await supabase
              .from('documents')
              .update({
                file_path: docSignedFileName,
                updated_at: new Date().toISOString(),
                metadata: JSON.stringify({
                  ...JSON.parse(doc.metadata || '{}'),
                  signed_version: true,
                  original_file_path: doc.file_path,
                  signed_at: new Date().toISOString(),
                  signed_by: user.id,
                  workflow_process_id: workflowProcessId,
                  workflow_execution_id: workflowExecutionId
                })
              })
              .eq('id', docId)

            if (docUpdateError) {
              console.warn(`⚠️ Erro ao atualizar documento ${docId}:`, docUpdateError)
            } else {
              console.log(`✅ Documento ${docId} assinado e substituído com sucesso`)
              
              processedDocuments.push({
                documentId: docId,
                documentName: doc.title,
                signedFileName: docSignedFileName,
                downloadUrl: `${supabaseConfig.url}/storage/v1/object/public/documents/${docSignedFileName}`,
                signature: docSignature
              })
            }

          } catch (error) {
            console.error(`❌ Erro ao processar documento ${docId}:`, error)
          }
        }
      }

      // Retornar dados da assinatura
      const downloadUrl = `${supabaseConfig.url}/storage/v1/object/public/documents/${signedFileName}`
      
      console.log('🔗 URL de download:', downloadUrl)
      console.log('✅ Processo concluído com sucesso!')

      // ✅ NOVO: Atualizar execuções do workflow se for uma ação de workflow
      if (action === 'sign_workflow' && workflowProcessId && workflowExecutionId) {
        console.log('🔄 [WORKFLOW_INTEGRATION] Atualizando execuções do workflow...')
        try {
          // Atualizar a execução específica como concluída
          const { error: executionUpdateError } = await supabase
            .from('workflow_executions')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              action_taken: 'sign',
              comments: 'Documento assinado com sucesso'
            })
            .eq('id', workflowExecutionId)
            .eq('process_id', workflowProcessId)

          if (executionUpdateError) {
            console.warn('⚠️ [WORKFLOW_INTEGRATION] Erro ao atualizar execução específica:', executionUpdateError)
          } else {
            console.log('✅ [WORKFLOW_INTEGRATION] Execução específica atualizada como concluída')
          }

          // Verificar se todas as execuções do step atual foram concluídas
          const { data: currentExecutions, error: executionsError } = await supabase
            .from('workflow_executions')
            .select('id, status, step_id')
            .eq('process_id', workflowProcessId)
            .eq('status', 'pending')

          if (executionsError) {
            console.warn('⚠️ [WORKFLOW_INTEGRATION] Erro ao verificar execuções pendentes:', executionsError)
          } else {
            console.log('📊 [WORKFLOW_INTEGRATION] Execuções pendentes restantes:', currentExecutions?.length || 0)
            
            // Se não há mais execuções pendentes, avançar para próxima etapa
            if (!currentExecutions || currentExecutions.length === 0) {
              console.log('🚀 [WORKFLOW_INTEGRATION] Todas as execuções concluídas - avançando para próxima etapa...')
              
              // Buscar próximo step
              const { data: currentProcess, error: processError } = await supabase
                .from('workflow_processes')
                .select('current_step_id, workflow_template_id')
                .eq('id', workflowProcessId)
                .single()

              if (processError || !currentProcess) {
                console.warn('⚠️ [WORKFLOW_INTEGRATION] Erro ao buscar processo atual:', processError)
              } else {
                // Buscar próximo step no template
                const { data: nextStep, error: stepError } = await supabase
                  .from('workflow_steps')
                  .select('id, step_order')
                  .eq('workflow_template_id', currentProcess.workflow_template_id)
                  .gt('step_order', 0) // Próximo step após o atual
                  .order('step_order', { ascending: true })
                  .limit(1)
                  .single()

                if (stepError || !nextStep) {
                  console.log('🏁 [WORKFLOW_INTEGRATION] Processo concluído - não há próxima etapa')
                  
                  // Marcar processo como concluído
                  await supabase
                    .from('workflow_processes')
                    .update({
                      status: 'completed',
                      completed_at: new Date().toISOString()
                    })
                    .eq('id', workflowProcessId)
                  
                  console.log('✅ [WORKFLOW_INTEGRATION] Processo marcado como concluído')
                } else {
                  // Atualizar processo para próxima etapa
                  await supabase
                    .from('workflow_processes')
                    .update({
                      current_step_id: nextStep.id,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', workflowProcessId)
                  
                  console.log('✅ [WORKFLOW_INTEGRATION] Processo avançou para próxima etapa:', nextStep.id)
                }
              }
            }
          }
        } catch (workflowError) {
          console.error('❌ [WORKFLOW_INTEGRATION] Erro na integração com workflow:', workflowError)
          // Não falhar a assinatura se a integração com workflow falhar
        }
      }

      const responseData = {
        signatureId: signature.id,
        documentName: signedFileName,
        downloadUrl: downloadUrl,
        signature: signature,
        metadata: metadata,
        digitalTimestamp: signature.digitalTimestamp,
        userName: signature.userName,
        userEmail: signature.userEmail,
        replacedOriginal: action === 'sign_workflow',
        processedDocuments: processedDocuments // ✅ NOVO: Documentos processados
      }


      return NextResponse.json({
        success: true,
        data: responseData,
        message: action === 'sign_workflow' 
          ? 'Documento assinado e substituído com sucesso!' 
          : action === 'multi_signature'
          ? `Documento enviado para assinatura de ${multiSignatureUsers.length} usuário(s)!`
          : 'Documento assinado com sucesso!'
      })

    } catch (signatureError) {
      console.error('❌ Erro ao criar assinatura:', signatureError)
      console.error('❌ Stack trace:', signatureError instanceof Error ? signatureError.stack : 'N/A')
      return NextResponse.json(
        { error: 'Erro ao criar assinatura digital: ' + (signatureError instanceof Error ? signatureError.message : 'Erro desconhecido') },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('💥 Erro interno:', error)
    console.error('💥 Stack trace:', error instanceof Error ? error.stack : 'N/A')
    return NextResponse.json(
      { error: 'Erro interno do servidor: ' + (error instanceof Error ? error.message : 'Erro desconhecido') },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Iniciando requisição GET para /api/arsign (Sistema Simplificado)')
    
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
    console.log('🔐 Verificando autenticação...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('❌ Erro de autenticação:', authError)
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }
    console.log('✅ Usuário autenticado:', user.id)

    // Buscar documentos da entidade do usuário para seleção (excluindo documentos de processos)
    console.log('🔍 Buscando documentos da entidade:', user.id)
    
    // Primeiro, buscar IDs de documentos que pertencem a processos
    const { data: processDocumentIds, error: processIdsError } = await supabase
      .from('workflow_processes')
      .select('document_id')
      .not('document_id', 'is', null)

    if (processIdsError) {
      console.warn('Erro ao buscar IDs de documentos de processos:', processIdsError)
    }

    const excludedIds = (processDocumentIds || [])
      .map(item => item.document_id)
      .filter(id => id !== null)

    let query = supabase
      .from('documents')
      .select('id, title, file_path, created_at')
      .eq('entity_id', user.id) // Buscar documentos da entidade do usuário
      .like('file_path', '%.pdf')
      .order('created_at', { ascending: false })

    // Aplicar filtro de exclusão apenas se houver IDs para excluir
    if (excludedIds.length > 0) {
      query = query.not('id', 'in', `(${excludedIds.join(',')})`)
    }

    const { data: documents, error: docError } = await query

    if (docError) {
      console.error('❌ Erro ao buscar documentos:', docError)
      return NextResponse.json(
        { error: 'Erro ao carregar documentos' },
        { status: 500 }
      )
    }

    console.log('✅ Documentos encontrados:', documents?.length || 0)

    return NextResponse.json({
      success: true,
      documents: documents || []
    })

  } catch (error) {
    console.error('💥 Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

