'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useElectronicSignatures } from '@/hooks/use-electronic-signatures'
import { useMultiSignatureRequests } from '@/hooks/use-multi-signature-requests'
import MultiSignatureUserSelector from './multi-signature-user-selector'
import MultiSignatureApproval from '@/components/multi-signature-approval'
import MultiSignatureProgressDisplay from '@/components/multi-signature-progress-display'
import { SignedDocumentsDisplay } from '@/components/signed-documents-display'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Upload, FileText, Download, CheckCircle, Clock, XCircle, FileCheck, Eye, X, Settings, AlertCircle, Users, Calendar, History, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/lib/hooks/use-auth-final'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ElectronicSignature() {
  const { signatures, documents, loading, error, loadSignatures, loadDocuments, sendForSignature, sendForMultiSignature } = useElectronicSignatures()
  const { toast } = useToast()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string>('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // Estados para verificação de assinatura
  const [verificationCode, setVerificationCode] = useState('')
  const [verificationLoading, setVerificationLoading] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean
    message: string
    signature?: any
  } | null>(null)
  
  // Estados para histórico de assinaturas
  const [signatureHistory, setSignatureHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  
  // Estados para configuração do modelo de assinatura
  const [signatureTemplate, setSignatureTemplate] = useState({
    title: "ASSINATURA DIGITAL",
    showDate: true,
    showTime: true,
    showUserName: true,
    showEmail: true, // Email habilitado por padrão
    showVerificationCode: true,
    showHashCode: true, // Hash habilitado por padrão
    position: "side-right", // "side-right" (barra lateral)
    backgroundColor: "#f8fafc",
    borderColor: "#3b82f6",
    textColor: "#1e293b",
    fontSize: "6",
    includeLogo: false,
    customText: "Este documento foi assinado digitalmente com certificado válido.",
  })

  const [previewMode, setPreviewMode] = useState(false)

  // Carregar template de assinatura do usuário
  const loadSignatureTemplate = React.useCallback(async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('signature_templates')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar template:', error)
        return
      }

      if (data) {
        setSignatureTemplate({
          title: data.title || "ASSINATURA DIGITAL",
          showDate: data.show_date ?? true,
          showTime: data.show_time ?? true,
          showUserName: data.show_user_name ?? true,
          showEmail: data.show_email ?? false, // Email desabilitado por padrão conforme ajuste
          showVerificationCode: data.show_verification_code ?? true,
          showHashCode: data.show_hash_code ?? true, // Hash habilitado por padrão
          position: data.position || "side-right",
          backgroundColor: data.background_color || "#ffffff", // Branco por padrão
          borderColor: data.border_color || "#000000", // Preto por padrão
          textColor: data.text_color || "#000000", // Preto por padrão
          fontSize: data.font_size || "6",
          includeLogo: data.include_logo ?? false,
          customText: data.custom_text || "Este documento foi assinado digitalmente com certificado válido.",
        })
        console.log('Template carregado com sucesso:', data)
      } else {
        console.log('Nenhum template encontrado, usando padrão')
      }
    } catch (error) {
      console.error('Erro ao carregar template:', error)
    }
  }, [user?.id])

  React.useEffect(() => {
    loadSignatures()
    loadDocuments() // Carregar documentos para o tab "Documento Existente"
    loadSignatureTemplate()
  }, [loadSignatures, loadDocuments, loadSignatureTemplate])

  // Função para criar notificação de assinatura
  const createSignatureNotification = React.useCallback(async (documentName: string, success: boolean = true) => {
    if (!user?.email) return

    try {
      await supabase
        .from('notifications')
        .insert({
          title: success ? 'Documento assinado digitalmente' : 'Falha na assinatura digital',
          message: success 
            ? `O documento "${documentName}" foi assinado digitalmente com sucesso.`
            : `Falha ao assinar digitalmente o documento "${documentName}".`,
          type: success ? 'success' : 'error',
          priority: 'medium',
          recipients: [user.email],
          channels: ['email'],
          status: 'sent',
          created_by: user.id
        })
    } catch (error) {
      console.error('Erro ao criar notificação de assinatura:', error)
    }
  }, [user?.email, user?.id])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
    } else if (file) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos PDF.",
        variant: "destructive",
      })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type === 'application/pdf') {
        setSelectedFile(file)
      } else {
        toast({
          title: "Erro",
          description: "Por favor, selecione apenas arquivos PDF.",
          variant: "destructive",
        })
      }
    }
  }


  // Salvar template de assinatura
  const saveSignatureTemplate = React.useCallback(async () => {
    if (!user?.id) return

    try {
      // Verificar se já existe um template para o usuário
      const { data: existingTemplate, error: checkError } = await supabase
        .from('signature_templates')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Erro ao verificar template existente:', checkError)
        throw checkError
      }

      const templateData = {
        user_id: user.id,
        title: signatureTemplate.title,
        show_date: signatureTemplate.showDate,
        show_time: signatureTemplate.showTime,
        show_user_name: signatureTemplate.showUserName,
        show_email: signatureTemplate.showEmail,
        show_verification_code: signatureTemplate.showVerificationCode,
        show_hash_code: signatureTemplate.showHashCode,
        position: signatureTemplate.position,
        background_color: signatureTemplate.backgroundColor,
        border_color: signatureTemplate.borderColor,
        text_color: signatureTemplate.textColor,
        font_size: signatureTemplate.fontSize,
        include_logo: signatureTemplate.includeLogo,
        custom_text: signatureTemplate.customText,
        updated_at: new Date().toISOString()
      }

      console.log('Salvando template:', templateData)

      let result
      if (existingTemplate) {
        // Atualizar template existente
        result = await supabase
          .from('signature_templates')
          .update(templateData)
          .eq('user_id', user.id)
      } else {
        // Criar novo template
        result = await supabase
          .from('signature_templates')
          .insert([templateData])
      }

      if (result.error) {
        console.error('Erro ao salvar template:', result.error)
        throw result.error
      }

      console.log('Template salvo com sucesso')

      // Recarregar o template após salvar para garantir consistência
      await loadSignatureTemplate()

      toast({
        title: "Sucesso!",
        description: "Modelo de assinatura salvo com sucesso.",
      })
    } catch (error) {
      console.error('Erro ao salvar template:', error)
      toast({
        title: "Erro",
        description: "Erro ao salvar o modelo de assinatura. Tente novamente.",
        variant: "destructive",
      })
    }
  }, [user?.id, signatureTemplate, toast, loadSignatureTemplate])

  // Resetar template para valores padrão
  const resetSignatureTemplate = React.useCallback(async () => {
    try {
      // Resetar no estado local
      setSignatureTemplate({
        title: "ASSINATURA DIGITAL",
        showDate: true,
        showTime: true,
        showUserName: true,
        showEmail: true, // Email habilitado por padrão
        showVerificationCode: true,
        showHashCode: true, // Hash habilitado por padrão
        position: "side-right",
        backgroundColor: "#f8fafc",
        borderColor: "#3b82f6",
        textColor: "#1e293b",
        fontSize: "6",
        includeLogo: false,
        customText: "Este documento foi assinado digitalmente com certificado válido.",
      })

      // Deletar template do banco para forçar uso do padrão
      if (user?.id) {
        await supabase
          .from('signature_templates')
          .delete()
          .eq('user_id', user.id)
      }

      toast({
        title: "Template Resetado",
        description: "O modelo foi restaurado para os valores padrão.",
      })
    } catch (error) {
      console.error('Erro ao resetar template:', error)
      // Mesmo com erro no banco, o reset local ainda funcionou
      toast({
        title: "Template Resetado",
        description: "O modelo foi restaurado para os valores padrão.",
      })
    }
  }, [toast, user?.id])

  const handleUploadSignature = async () => {
    console.log('🚀 Iniciando assinatura simples...')
    
    if (!selectedFile) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo PDF.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    console.log('📤 Preparando dados para envio...')
    
    try {
      // Assinatura única
      const formData = new FormData()
      formData.append('action', 'upload')
      formData.append('file', selectedFile)
      
      // Adicionar dados do template personalizado
      formData.append('signature_template', JSON.stringify({
        title: signatureTemplate.title,
        show_date: signatureTemplate.showDate,
        show_time: signatureTemplate.showTime,
        show_user_name: signatureTemplate.showUserName,
        show_email: signatureTemplate.showEmail,
        show_verification_code: signatureTemplate.showVerificationCode,
        show_hash_code: signatureTemplate.showHashCode,
        position: signatureTemplate.position,
        background_color: signatureTemplate.backgroundColor,
        border_color: signatureTemplate.borderColor,
        text_color: signatureTemplate.textColor,
        font_size: signatureTemplate.fontSize,
        include_logo: signatureTemplate.includeLogo,
        custom_text: signatureTemplate.customText,
      }))

      console.log('📋 FormData preparado:', {
        action: 'upload',
        fileName: selectedFile.name,
        hasTemplate: true
      })

      const result = await sendForSignature(formData)
      
      console.log('📥 Resposta recebida:', result)
      
      if (result.success) {
        toast({
          title: "Sucesso!",
          description: "Documento assinado com sucesso!",
        })
        
        // Criar notificação de sucesso
        await createSignatureNotification(selectedFile.name, true)
        
        // Limpar formulário
        setSelectedFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        
        // Recarregar dados
        loadSignatures()
        loadDocuments()
        
        // Mostrar link de download
        if (result.data?.downloadUrl) {
          setDownloadUrl(result.data.downloadUrl)
          setShowSignatureModal(true)
        }
      } else {
        console.error('❌ Erro na resposta:', result.error)
        toast({
          title: "Erro",
          description: result.error || "Erro ao assinar documento.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('💥 Erro ao assinar documento:', error)
      toast({
        title: "Erro",
        description: "Erro interno ao processar assinatura.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExistingDocumentSignature = async () => {
    console.log('🚀 Iniciando assinatura de documento existente...')
    
    if (!selectedDocument) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um documento.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    console.log('📤 Preparando dados para envio...')
    
    try {
      const formData = new FormData()
      formData.append('action', 'existing')
      formData.append('documentId', selectedDocument)
      
      // Adicionar dados do template personalizado
      formData.append('signature_template', JSON.stringify({
        title: signatureTemplate.title,
        show_date: signatureTemplate.showDate,
        show_time: signatureTemplate.showTime,
        show_user_name: signatureTemplate.showUserName,
        show_email: signatureTemplate.showEmail,
        show_verification_code: signatureTemplate.showVerificationCode,
        show_hash_code: signatureTemplate.showHashCode,
        position: signatureTemplate.position,
        background_color: signatureTemplate.backgroundColor,
        border_color: signatureTemplate.borderColor,
        text_color: signatureTemplate.textColor,
        font_size: signatureTemplate.fontSize,
        include_logo: signatureTemplate.includeLogo,
        custom_text: signatureTemplate.customText,
      }))

      console.log('📋 FormData preparado:', {
        action: 'existing',
        documentId: selectedDocument,
        hasTemplate: true
      })

      const result = await sendForSignature(formData)
      
      console.log('📥 Resposta recebida:', result)
      
      if (result.success) {
        toast({
          title: "Sucesso!",
          description: "Documento assinado com sucesso!",
        })
        
        // Limpar formulário
        setSelectedDocument('')
        
        // Recarregar dados
        loadSignatures()
        loadDocuments()
        
        // Mostrar link de download
        if (result.data?.downloadUrl) {
          setDownloadUrl(result.data.downloadUrl)
          setShowSignatureModal(true)
        }
      } else {
        console.error('❌ Erro na resposta:', result.error)
        toast({
          title: "Erro",
          description: result.error || "Erro ao assinar documento.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('💥 Erro ao assinar documento:', error)
      toast({
        title: "Erro",
        description: "Erro interno ao processar assinatura.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleVerifySignature = async () => {
    if (!verificationCode.trim()) {
      toast({
        title: "Erro",
        description: "Digite um código de verificação",
        variant: "destructive"
      })
      return
    }

    try {
      setVerificationLoading(true)
      setVerificationResult(null) // Limpar resultado anterior
      
      console.log('🔍 Verificando código:', verificationCode)
      
      const response = await fetch('/api/verify-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verificationCode: verificationCode.trim()
        })
      })

      const result = await response.json()

      if (result.success) {
        setVerificationResult({
          valid: true,
          message: result.message || 'Assinatura verificada com sucesso!',
          signature: result.signature
        })
        
        toast({
          title: "Sucesso",
          description: "Assinatura verificada com sucesso!"
        })
      } else {
        setVerificationResult({
          valid: false,
          message: result.error || 'Código de verificação inválido'
        })
        
        toast({
          title: "Verificação Falhou",
          description: result.error || 'Código de verificação inválido',
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('❌ Erro ao verificar assinatura:', error)
      setVerificationResult({
        valid: false,
        message: 'Erro interno ao verificar assinatura'
      })
      
      toast({
        title: "Erro",
        description: "Erro interno ao verificar assinatura",
        variant: "destructive"
      })
    } finally {
      setVerificationLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído'
      case 'pending':
        return 'Pendente'
      case 'failed':
        return 'Falhou'
      case 'cancelled':
        return 'Cancelado'
      default:
        return 'Desconhecido'
    }
  }

  // Função para buscar histórico de assinaturas
  const fetchSignatureHistory = async () => {
    if (!user?.id) return
    
    try {
      setLoadingHistory(true)
      console.log('🔍 [fetchSignatureHistory] Buscando assinaturas do usuário:', user.id)
      
      const { data, error } = await supabase
        .from('document_signatures')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ [fetchSignatureHistory] Erro ao buscar assinaturas:', error)
        return
      }
      
      console.log('✅ [fetchSignatureHistory] Assinaturas encontradas:', data?.length || 0)
      setSignatureHistory(data || [])
      
    } catch (err) {
      console.error('❌ [fetchSignatureHistory] Erro geral:', err)
    } finally {
      setLoadingHistory(false)
    }
  }
  
  // Carregar histórico quando o componente montar
  useEffect(() => {
    if (user?.id) {
      fetchSignatureHistory()
    }
  }, [user?.id])
  
  // Função para formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // Função para obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Assinatura Digital</h1>
        <p className="text-gray-600 mt-2">
          Assine documentos PDF digitalmente de forma segura e rápida
        </p>
      </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="upload">Assinatura Simples</TabsTrigger>
            <TabsTrigger value="existing">Documento Existente</TabsTrigger>
            <TabsTrigger value="template">Configurar Modelo</TabsTrigger>
            <TabsTrigger value="multi-signature">Assinatura Múltipla</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="verify">Verificar Assinatura</TabsTrigger>
          </TabsList>

        <TabsContent value="upload" className="space-y-6">
          {/* Layout em blocos: 1 acima e 1 abaixo */}
          <div className="grid grid-cols-1 gap-6">
            {/* Bloco 1: Upload de PDF para Assinatura */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload de PDF para Assinatura
                </CardTitle>
                <CardDescription>
                  Faça upload de um arquivo PDF e assine-o digitalmente no rodapé
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-base font-medium text-gray-700">Arquivo PDF para Assinatura</Label>
                  
                  {/* Input oculto */}
                  <input
                    id="file"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  
                  {/* Botão customizado para escolher arquivo */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className="relative cursor-pointer group"
                  >
                    <div className={`flex items-center justify-center w-full p-4 border-2 border-dashed rounded-xl transition-all duration-300 ${
                      isDragOver 
                        ? 'border-blue-500 bg-blue-200 scale-105' 
                        : selectedFile 
                          ? 'border-green-300 bg-green-50 hover:bg-green-100 group-hover:border-green-400'
                          : 'border-blue-300 bg-blue-50 hover:bg-blue-100 group-hover:border-blue-400'
                    }`}>
                      {selectedFile ? (
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <FileCheck className="h-6 w-6 text-green-600" />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-green-800">{selectedFile.name}</p>
                            <p className="text-sm text-green-600">Clique para escolher outro arquivo</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-3">
                          <div className={`p-3 rounded-full transition-colors ${
                            isDragOver 
                              ? 'bg-blue-200 scale-110' 
                              : 'bg-blue-100 group-hover:bg-blue-200'
                          }`}>
                            <Upload className={`h-8 w-8 transition-colors ${
                              isDragOver ? 'text-blue-700' : 'text-blue-600'
                            }`} />
                          </div>
                          <div className="text-center">
                            <p className={`font-semibold text-lg transition-colors ${
                              isDragOver ? 'text-blue-900' : 'text-blue-800'
                            }`}>
                              {isDragOver ? 'Solte o arquivo aqui!' : 'Escolher Arquivo PDF'}
                            </p>
                            <p className={`text-sm mt-1 transition-colors ${
                              isDragOver ? 'text-blue-700' : 'text-blue-600'
                            }`}>
                              {isDragOver ? 'Solte para fazer upload' : 'Clique aqui ou arraste e solte seu documento'}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">Apenas arquivos PDF são aceitos</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Informação sobre assinatura simples */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <p className="text-sm text-blue-800 font-medium">
                      Assinatura Simples
                    </p>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    Este documento será assinado imediatamente por você. Para assinatura múltipla, use a aba "Assinatura Múltipla".
                  </p>
                </div>

                <Button 
                  onClick={handleUploadSignature} 
                  disabled={!selectedFile || isProcessing}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isProcessing ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Processando Assinatura...
                    </>
                  ) : (
                    <>
                      <FileCheck className="h-4 w-4 mr-2" />
                      Assinar Documento Digitalmente
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

          </div>

          {/* Bloco 3: Histórico de Assinaturas (abaixo) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Assinaturas
              </CardTitle>
              <CardDescription>
                Visualize e baixe seus documentos assinados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignedDocumentsDisplay />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="existing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Assinar Documento Existente
              </CardTitle>
              <CardDescription>
                Selecione um documento já armazenado no sistema para assinar digitalmente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">Carregando documentos...</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">Nenhum documento encontrado</p>
                  <p className="text-sm text-gray-400">
                    Faça upload de documentos primeiro para poder assiná-los
                  </p>
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-xs text-yellow-700">
                      <strong>Debug:</strong> {documents.length} documentos carregados
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">
                      <strong>✅ {documents.length} documentos encontrados</strong>
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Documentos da sua entidade e documentos onde você é autor
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="document">Selecionar Documento</Label>
                    <Select value={selectedDocument} onValueChange={setSelectedDocument}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Escolha um documento para assinar" />
                      </SelectTrigger>
                      <SelectContent>
                        {documents.map((doc) => (
                          <SelectItem key={doc.id} value={doc.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{doc.title}</span>
                              <span className="text-xs text-gray-500">
                                Criado em: {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedDocument && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Documento selecionado:</strong> {
                          documents.find(doc => doc.id === selectedDocument)?.title
                        }
                      </p>
                    </div>
                  )}

                  <Button 
                    onClick={handleExistingDocumentSignature} 
                    disabled={!selectedDocument || isProcessing}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-6 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isProcessing ? (
                      <>
                        <Clock className="h-5 w-5 mr-2 animate-spin" />
                        Processando Assinatura...
                      </>
                    ) : (
                      <>
                        <FileCheck className="h-5 w-5 mr-2" />
                        Assinar Documento Selecionado
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="template" className="space-y-4">
          <div className="grid grid-cols-1 gap-6">
            {/* Configurações do Modelo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações do Modelo
                </CardTitle>
                <CardDescription>
                  Personalize como a assinatura digital aparecerá nos documentos PDF
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Texto Personalizado */}
                <div>
                  <Label htmlFor="custom-text">Texto Personalizado</Label>
                  <Textarea
                    id="custom-text"
                    value={signatureTemplate.customText}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSignatureTemplate(prev => ({ ...prev, customText: e.target.value }))}
                    className="mt-1"
                    rows={3}
                    placeholder="Texto que aparecerá na assinatura..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Este texto aparecerá na barra lateral de assinaturas
                  </p>
                </div>

                {/* Cores */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="bg-color">Cor de Fundo</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Input
                        id="bg-color"
                        type="color"
                        value={signatureTemplate.backgroundColor}
                        onChange={(e) => setSignatureTemplate(prev => ({ ...prev, backgroundColor: e.target.value }))}
                        className="w-12 h-8 p-0 border-2"
                      />
                      <Input
                        value={signatureTemplate.backgroundColor}
                        onChange={(e) => setSignatureTemplate(prev => ({ ...prev, backgroundColor: e.target.value }))}
                        className="flex-1 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="border-color">Cor da Borda</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Input
                        id="border-color"
                        type="color"
                        value={signatureTemplate.borderColor}
                        onChange={(e) => setSignatureTemplate(prev => ({ ...prev, borderColor: e.target.value }))}
                        className="w-12 h-8 p-0 border-2"
                      />
                      <Input
                        value={signatureTemplate.borderColor}
                        onChange={(e) => setSignatureTemplate(prev => ({ ...prev, borderColor: e.target.value }))}
                        className="flex-1 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="text-color">Cor do Texto</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Input
                        id="text-color"
                        type="color"
                        value={signatureTemplate.textColor}
                        onChange={(e) => setSignatureTemplate(prev => ({ ...prev, textColor: e.target.value }))}
                        className="w-12 h-8 p-0 border-2"
                      />
                      <Input
                        value={signatureTemplate.textColor}
                        onChange={(e) => setSignatureTemplate(prev => ({ ...prev, textColor: e.target.value }))}
                        className="flex-1 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="space-y-3 pt-4">
                  <div className="flex gap-3">
                    <Button
                      onClick={saveSignatureTemplate}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Salvar Modelo
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={resetSignatureTemplate}
                      variant="outline"
                      className="flex-1 bg-white hover:bg-red-50 border-2 border-red-200 text-red-700 hover:text-red-800 font-medium py-2 px-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Restaurar Valores Padrão
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        <TabsContent value="multi-signature" className="space-y-6">
          {/* Layout em blocos: 2 acima e 1 abaixo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bloco 1: Criar Assinatura Múltipla */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Criar Assinatura Múltipla
                </CardTitle>
                <CardDescription>
                  Envie um documento para múltiplos usuários assinarem
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MultiSignatureUploadContent signatureTemplate={signatureTemplate} />
              </CardContent>
            </Card>

            {/* Bloco 2: Aprovações Pendentes */}
            <Card className="lg:row-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Aprovações Pendentes
                </CardTitle>
                <CardDescription>
                  Documentos aguardando sua assinatura
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PendingApprovalsSummary onRefreshTrigger={refreshTrigger} />
              </CardContent>
            </Card>
          </div>

          {/* Bloco 3: Histórico de Assinaturas Múltiplas - abaixo dos blocos acima */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Assinaturas Múltiplas
              </CardTitle>
              <CardDescription>
                Solicitações criadas e seu status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MultiSignatureRequestsContent />
            </CardContent>
          </Card>


        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Assinaturas
              </CardTitle>
              <CardDescription>
                Visualize todos os documentos que você assinou
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Carregando assinaturas...</p>
                  </div>
                </div>
              ) : signatureHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    Nenhuma assinatura encontrada
                  </h3>
                  <p className="text-muted-foreground text-center">
                    Você ainda não assinou nenhum documento.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {signatureHistory.length} assinatura(s) encontrada(s)
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchSignatureHistory}
                      disabled={loadingHistory}
                    >
                      Atualizar
                    </Button>
                  </div>
                  
                  <div className="grid gap-4">
                    {signatureHistory.map((signature) => (
                      <Card key={signature.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 mb-1">
                                {signature.title || 'Documento sem título'}
                              </h3>
                              <div className="space-y-1">
                                <p className="text-sm text-gray-600">
                                  ID: {signature.arqsign_document_id}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span>Criado: {formatDate(signature.created_at)}</span>
                                  {signature.updated_at !== signature.created_at && (
                                    <span>Atualizado: {formatDate(signature.updated_at)}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(signature.status)}>
                              {getStatusText(signature.status)}
                            </Badge>
                            
                            <div className="flex items-center gap-2">
                              {signature.verification_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(signature.verification_url, '_blank')}
                                  title="Verificar assinatura"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                              
                              {signature.signature_url && signature.status === 'completed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const link = document.createElement('a')
                                    link.href = signature.signature_url!
                                    link.download = signature.title || 'documento-assinado.pdf'
                                    link.click()
                                  }}
                                  title="Baixar documento assinado"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verify" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Verificar Assinatura Digital
              </CardTitle>
              <CardDescription>
                Digite o código de verificação para validar uma assinatura digital (simples ou múltipla)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite o código de verificação..."
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleVerifySignature}
                  disabled={!verificationCode.trim() || verificationLoading}
                  className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                >
                  {verificationLoading ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Verificar
                    </>
                  )}
                </Button>
              </div>
              
              {/* Indicador de carregamento */}
              {verificationLoading && (
                <div className="p-3 rounded-lg border border-blue-200 bg-blue-50">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-blue-600 animate-spin" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        Verificando assinatura...
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {verificationResult && (
                <div className={`p-3 rounded-lg border ${
                  verificationResult.valid 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {verificationResult.valid ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`font-medium text-sm ${
                      verificationResult.valid ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {verificationResult.valid ? 'Assinatura Válida' : 'Assinatura Inválida'}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 ${
                    verificationResult.valid ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {verificationResult.message}
                  </p>
                  {verificationResult.signature && (
                    <div className="mt-2 p-2 bg-gray-50 rounded border">
                      <h4 className="font-medium text-gray-800 mb-1 text-xs">Detalhes da Assinatura:</h4>
                      <div className="grid grid-cols-1 gap-1 text-xs">
                        <div><strong>Usuário:</strong> {verificationResult.signature.userName || 'Não informado'}</div>
                        <div><strong>Email:</strong> {verificationResult.signature.userEmail || 'Não informado'}</div>
                        <div><strong>Data:</strong> {verificationResult.signature.timestamp ? new Date(verificationResult.signature.timestamp).toLocaleDateString('pt-BR') : 'Não informado'}</div>
                        <div><strong>Hora:</strong> {verificationResult.signature.timestamp ? new Date(verificationResult.signature.timestamp).toLocaleTimeString('pt-BR') : 'Não informado'}</div>
                        <div><strong>Documento:</strong> {verificationResult.signature.documentTitle || verificationResult.signature.documentName || 'Não informado'}</div>
                        <div><strong>Status:</strong> {verificationResult.signature.status || 'Não informado'}</div>
                        <div><strong>Hash:</strong> {verificationResult.signature.hash ? `${verificationResult.signature.hash.substring(0, 16)}...` : 'Não informado'}</div>
                        <div><strong>Código:</strong> {verificationResult.signature.verificationCode || 'Não informado'}</div>
                        {verificationResult.signature.signatureType === 'multiple' && (
                          <>
                            <div><strong>Tipo:</strong> Assinatura Múltipla</div>
                            <div><strong>Total de Assinaturas:</strong> {verificationResult.signature.totalSignatures || 'Não informado'}</div>
                            <div><strong>Assinaturas Completadas:</strong> {verificationResult.signature.completedSignatures || 'Não informado'}</div>
                            {verificationResult.signature.signers && verificationResult.signature.signers.length > 0 && (
                              <div><strong>Signatários:</strong> {verificationResult.signature.signers.map((s: any) => s.name).join(', ')}</div>
                            )}
                          </>
                        )}
                        {verificationResult.signature.specificSigner && (
                          <>
                            <div><strong>Signatário Específico:</strong> {verificationResult.signature.specificSigner.name || 'Não informado'}</div>
                            <div><strong>Email do Signatário:</strong> {verificationResult.signature.specificSigner.email || 'Não informado'}</div>
                          </>
                        )}
                        {verificationResult.signature.signatureType === 'simple' && (
                          <div><strong>Tipo:</strong> Assinatura Simples</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Instruções de uso */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2 text-sm">Como usar:</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Digite o código de verificação que aparece no rodapé do documento assinado</li>
                  <li>• O código está localizado na área "ASSINATURA DIGITAL" do documento</li>
                  <li>• Funciona para assinaturas simples e múltiplas</li>
                  <li>• A verificação confirma a autenticidade e integridade do documento</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>



             {/* Modal de Assinatura Concluída */}
       <Dialog open={showSignatureModal} onOpenChange={setShowSignatureModal}>
         <DialogContent className="max-w-2xl">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <CheckCircle className="h-5 w-5 text-green-500" />
               Assinatura Concluída!
             </DialogTitle>
             <DialogDescription>
               O documento foi assinado com sucesso e possui carimbo de tempo digital, código de verificação e QR Code para autenticação.
             </DialogDescription>
           </DialogHeader>
           
           <div className="space-y-4">
             {/* Informações da Assinatura */}
             <div className="bg-green-50 p-4 rounded-lg">
               <h4 className="font-medium text-green-900 mb-2">Documento Autenticado</h4>
               <div className="text-sm text-green-800 space-y-1">
                 <p>• Carimbo de tempo digital aplicado</p>
                 <p>• Código de verificação único gerado</p>
                 <p>• Hash de segurança calculado</p>
                 <p>• QR Code disponível para verificação</p>
               </div>
             </div>
             
             {/* Ações */}
             <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => {
                  if (downloadUrl) {
                    window.open(downloadUrl, '_blank')
                  }
                  setShowSignatureModal(false)
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Download className="h-5 w-5" />
                Baixar Documento Assinado
              </Button>
               
              <Button 
                variant="outline"
                onClick={() => {
                  // Copiar URL de verificação para clipboard
                  const verificationUrl = downloadUrl?.replace('/storage/v1/object/public/documents/', '/verify/').replace('.pdf', '')
                  if (verificationUrl) {
                    navigator.clipboard.writeText(verificationUrl)
                    toast({
                      title: "URL copiada!",
                      description: "Link de verificação copiado para a área de transferência",
                    })
                  }
                }}
                className="flex items-center gap-2 bg-white hover:bg-blue-50 border-2 border-blue-200 text-blue-700 hover:text-blue-800 font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
              >
                <FileText className="h-5 w-5" />
                Copiar Link de Verificação
              </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>

             {/* Modal de Verificação de Documento */}
       <Dialog open={showVerificationModal} onOpenChange={setShowVerificationModal}>
         <DialogContent className="max-w-md">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <FileCheck className="h-5 w-5" />
               Verificar Documento
             </DialogTitle>
             <DialogDescription>
               Digite o código de verificação que está no rodapé do documento assinado
             </DialogDescription>
           </DialogHeader>
           
           <div className="space-y-4">
             <div>
               <Label htmlFor="verificationCode">Código de Verificação</Label>
               <Input
                 id="verificationCode"
                 placeholder="Ex: ABC123_DEF456_789"
                 className="mt-1 font-mono"
               />
             </div>
             
             <div className="bg-blue-50 p-3 rounded-lg">
               <p className="text-sm text-blue-800">
                 <strong>Onde encontrar:</strong> O código está localizado no rodapé do documento assinado, 
                 na área destacada "ASSINATURA DIGITAL".
               </p>
             </div>
             
             <div className="flex gap-3">
               <Button 
                 variant="outline" 
                 onClick={() => setShowVerificationModal(false)}
                 className="flex-1 bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-700 hover:text-gray-800 font-medium py-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
               >
                 <X className="h-4 w-4 mr-2" />
                 Cancelar
               </Button>
               <Button 
                 onClick={() => {
                   const code = (document.getElementById('verificationCode') as HTMLInputElement)?.value
                   if (code) {
                     window.open(`/verify/${code}`, '_blank')
                     setShowVerificationModal(false)
                   } else {
                     toast({
                       title: "Erro",
                       description: "Por favor, digite o código de verificação",
                       variant: "destructive",
                     })
                   }
                 }}
                 className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
               >
                 <CheckCircle className="h-4 w-4 mr-2" />
                 Verificar Documento
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>


      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">Erro: {error}</p>
        </div>
      )}
    </div>
  )
}

// Componente para upload de assinatura múltipla
function MultiSignatureUploadContent({ signatureTemplate }: { signatureTemplate: any }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<any[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { sendForMultiSignature } = useElectronicSignatures()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
    } else {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos PDF.",
        variant: "destructive",
      })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const pdfFile = files.find(file => file.type === 'application/pdf')
    
    if (pdfFile) {
      setSelectedFile(pdfFile)
    } else {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos PDF.",
        variant: "destructive",
      })
    }
  }

  const handleMultiSignatureUpload = async () => {
    console.log('🚀 Iniciando upload de assinatura múltipla...')
    console.log('📋 sendForMultiSignature:', typeof sendForMultiSignature)
    
    if (!selectedFile) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo PDF.",
        variant: "destructive",
      })
      return
    }

    if (selectedUsers.length === 0) {
      toast({
        title: "Erro",
        description: "Por favor, selecione pelo menos um usuário para assinatura múltipla.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    
    try {
      console.log('📤 Enviando dados para assinatura múltipla...')
      const result = await sendForMultiSignature({
        users: selectedUsers,
        file: selectedFile,
        signatureTemplate: {
          title: signatureTemplate.title,
          show_date: signatureTemplate.showDate,
          show_time: signatureTemplate.showTime,
          show_user_name: signatureTemplate.showUserName,
          show_email: signatureTemplate.showEmail,
          show_verification_code: signatureTemplate.showVerificationCode,
          show_hash_code: signatureTemplate.showHashCode,
          position: signatureTemplate.position,
          background_color: signatureTemplate.backgroundColor,
          border_color: signatureTemplate.borderColor,
          text_color: signatureTemplate.textColor,
          font_size: parseInt(signatureTemplate.fontSize),
          include_logo: signatureTemplate.includeLogo,
          custom_text: signatureTemplate.customText,
        }
      })
      
      if (result.success) {
        toast({
          title: "✅ Processo Criado com Sucesso!",
          description: `Documento "${selectedFile.name}" enviado para ${selectedUsers.length} usuário(s). Cada usuário receberá uma notificação e deve aprovar individualmente. Acompanhe o progresso na seção "Gerenciar Assinaturas Múltiplas".`,
          duration: 8000,
        })
        
        // Limpar formulário
        setSelectedFile(null)
        setSelectedUsers([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        
        // Histórico será recarregado automaticamente na próxima visualização
      } else {
        throw new Error(result.error || 'Erro desconhecido')
      }
    } catch (error) {
      console.error('Erro ao enviar para assinatura múltipla:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar processo de assinatura múltipla. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
          {/* Upload de arquivo */}
          <div className="space-y-3">
            <Label className="text-base font-medium text-gray-700">Arquivo PDF para Assinatura Múltipla</Label>
            
            <input
              id="multi-signature-file"
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              ref={fileInputRef}
              className="hidden"
            />
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="relative cursor-pointer group"
            >
              <div className={`flex items-center justify-center w-full p-6 border-2 border-dashed rounded-xl transition-all duration-300 ${
                isDragOver 
                  ? 'border-purple-500 bg-purple-200 scale-105' 
                  : selectedFile 
                    ? 'border-green-300 bg-green-50 hover:bg-green-100 group-hover:border-green-400'
                    : 'border-purple-300 bg-purple-50 hover:bg-purple-100 group-hover:border-purple-400'
              }`}>
                {selectedFile ? (
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileCheck className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-green-800">{selectedFile.name}</p>
                      <p className="text-sm text-green-600">Clique para escolher outro arquivo</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-3">
                    <div className={`p-3 rounded-full transition-colors ${
                      isDragOver 
                        ? 'bg-purple-200 scale-110' 
                        : 'bg-purple-100 group-hover:bg-purple-200'
                    }`}>
                      <Upload className={`h-8 w-8 transition-colors ${
                        isDragOver ? 'text-purple-700' : 'text-purple-600'
                      }`} />
                    </div>
                    <div className="text-center">
                      <p className={`font-semibold text-lg transition-colors ${
                        isDragOver ? 'text-purple-900' : 'text-purple-800'
                      }`}>
                        {isDragOver ? 'Solte o arquivo aqui!' : 'Escolher Arquivo PDF'}
                      </p>
                      <p className={`text-sm mt-1 transition-colors ${
                        isDragOver ? 'text-purple-700' : 'text-purple-600'
                      }`}>
                        {isDragOver ? 'Solte para fazer upload' : 'Clique aqui ou arraste e solte seu documento'}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">Apenas arquivos PDF são aceitos</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Seleção de usuários */}
          <div className="space-y-3">
            <Label className="text-base font-medium text-gray-700">Usuários para Assinatura</Label>
            <MultiSignatureUserSelector
              selectedUsers={selectedUsers}
              onUsersChange={setSelectedUsers}
              disabled={isProcessing}
            />
          </div>


          <Button 
            onClick={handleMultiSignatureUpload} 
            disabled={!selectedFile || selectedUsers.length === 0 || isProcessing}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-6 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isProcessing ? (
              <>
                <Clock className="h-5 w-5 mr-2 animate-spin" />
                Criando Processo de Assinatura...
              </>
            ) : (
              <>
                <Users className="h-5 w-5 mr-2" />
                Enviar para Assinatura Múltipla ({selectedUsers.length} usuário{selectedUsers.length !== 1 ? 's' : ''})
              </>
            )}
          </Button>

    </div>
  )
}

// Componente para resumo de aprovações pendentes
function PendingApprovalsSummary({ onRefreshTrigger }: { onRefreshTrigger?: number }) {
  const { getMyPendingApprovals, cleanupOrphanedApprovals } = useMultiSignatureRequests()
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null)

  useEffect(() => {
    loadPendingApprovals()
    
    // Atualizar automaticamente a cada 30 segundos
    const interval = setInterval(() => {
      loadPendingApprovals()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Atualizar quando o trigger mudar (após envio de assinatura múltipla)
  useEffect(() => {
    if (onRefreshTrigger && onRefreshTrigger > 0) {
      loadPendingApprovals()
    }
  }, [onRefreshTrigger])

  const loadPendingApprovals = async () => {
    try {
      setLoading(true)
      // Limpar aprovações órfãs automaticamente
      await cleanupOrphanedApprovals()
      // Carregar aprovações pendentes
      const approvals = await getMyPendingApprovals()
      setPendingApprovals(approvals)
    } catch (error) {
      console.error('Erro ao carregar aprovações pendentes:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm">Carregando...</span>
      </div>
    )
  }

  if (pendingApprovals.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-8 w-8 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm mb-2">Nenhuma aprovação pendente</p>
        <p className="text-xs text-gray-400">
          Você não tem solicitações de assinatura pendentes
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {pendingApprovals.length} documento(s) pendente(s)
        </p>
        <Button onClick={loadPendingApprovals} variant="outline" size="sm">
          Atualizar
        </Button>
      </div>

      <div className="grid gap-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
        {pendingApprovals.map((approval) => (
          <div key={approval.id} className="p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm mb-1 truncate" title={approval.multi_signature_requests?.document_name || 'Documento sem nome'}>
                    {approval.multi_signature_requests?.document_name || 'Documento sem nome'}
                  </h3>
                  <div className="flex items-center space-x-3 text-xs text-gray-500 mb-2">
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(approval.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {approval.multi_signature_requests?.total_signatures} usuário{approval.multi_signature_requests?.total_signatures !== 1 ? 's' : ''}
                    </span>
                    <Badge className="text-xs bg-yellow-100 text-yellow-800">
                      Pendente
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-3">
                {approval.multi_signature_requests?.document_path ? (
                  <Button
                    onClick={() => window.open(`https://dhdeyznmncgukexofcxy.supabase.co/storage/v1/object/public/documents/${approval.multi_signature_requests.document_path}`, '_blank')}
                    size="sm"
                    variant="outline"
                    className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 hover:text-blue-800 text-xs"
                    title="Visualizar documento"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-gray-50 border-gray-200 text-gray-500 text-xs cursor-not-allowed"
                    disabled
                    title="Documento não disponível para visualização"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  onClick={() => setSelectedRequest(approval.request_id)}
                  size="sm"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs"
                >
                  Aprovar
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Detalhes */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Aprovar Documento</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRequest(null)}
                >
                  Fechar
                </Button>
              </div>
              
              <MultiSignatureApproval
                requestId={selectedRequest}
                documentName={pendingApprovals.find(a => a.request_id === selectedRequest)?.request?.document_name || ''}
                onSuccess={() => {
                  setSelectedRequest(null)
                  loadPendingApprovals()
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente para gerenciar assinaturas múltiplas
function MultiSignatureRequestsContent() {
  const { 
    getMyRequests, 
    finalizeSignature,
    loading, 
    error 
  } = useMultiSignatureRequests()
  
  const [myRequests, setMyRequests] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    loadMyRequests()
  }, [])

  const loadMyRequests = async () => {
    try {
      const requests = await getMyRequests()
      setMyRequests(requests)
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Concluído</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>
      case 'ready_for_signature':
        return <Badge className="bg-purple-100 text-purple-800">Pronto para Assinar</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">Em Andamento</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'ready_for_signature':
        return <CheckCircle className="h-4 w-4 text-purple-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const handleFinalizeSignature = async (requestId: string) => {
    try {
      const result = await finalizeSignature(requestId)
      if (result.success) {
        toast({
          title: "Sucesso!",
          description: "Assinatura múltipla finalizada com sucesso!",
        })
        loadMyRequests() // Recarregar dados
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao finalizar assinatura",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao finalizar assinatura",
        variant: "destructive"
      })
    }
  }

  const downloadSignedDocument = async (filePath: string, documentName: string) => {
    try {
      console.log('🔄 Iniciando download do documento:', documentName)
      console.log('📁 Caminho do arquivo:', filePath)

      const response = await fetch(`/api/download-signed-document?filePath=${encodeURIComponent(filePath)}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Erro na resposta da API:', response.status, errorText)
        throw new Error(`Erro ao baixar documento: ${response.status}`)
      }
      
      const blob = await response.blob()
      console.log('✅ Blob criado com sucesso, tamanho:', blob.size)
      
      // Usar uma abordagem mais simples e compatível
      const url = URL.createObjectURL(blob)
      
      // Abrir o arquivo em uma nova aba para download
      const newWindow = window.open(url, '_blank')
      
      if (!newWindow) {
        // Fallback: criar link de download
        const link = document.createElement('a')
        link.href = url
        link.download = `assinado_${documentName}`
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      
      // Limpar a URL após um tempo
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 1000)
      
      toast({
        title: "Sucesso",
        description: "Documento baixado com sucesso!"
      })
    } catch (error) {
      console.error('❌ Erro ao baixar documento:', error)
      toast({
        title: "Erro",
        description: `Erro ao baixar documento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive"
      })
    }
  }

  const viewSignedDocument = async (filePath: string) => {
    try {
      console.log('👁️ Visualizando documento:', filePath)
      
      // Criar URL direta para visualização
      const viewUrl = `/api/download-signed-document?filePath=${encodeURIComponent(filePath)}`
      
      // Abrir em nova aba para visualização
      const newWindow = window.open(viewUrl, '_blank')
      
      if (!newWindow) {
        toast({
          title: "Erro",
          description: "Não foi possível abrir o documento. Verifique se o popup está bloqueado.",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Sucesso",
          description: "Documento aberto para visualização!"
        })
      }
    } catch (error) {
      console.error('❌ Erro ao visualizar documento:', error)
      toast({
        title: "Erro",
        description: "Erro ao visualizar documento",
        variant: "destructive"
      })
    }
  }

  const deleteSignedDocument = async (requestId: string, documentName: string) => {
    try {
      // Confirmar exclusão
      const confirmed = window.confirm(
        `Tem certeza que deseja excluir o documento "${documentName}"?\n\nEsta ação não pode ser desfeita.`
      )
      
      if (!confirmed) {
        return
      }

      console.log('🗑️ Excluindo documento:', documentName, 'ID:', requestId)
      
      // Fazer requisição para excluir
      const response = await fetch('/api/delete-signed-document', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: requestId
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Erro na resposta da API:', response.status, errorText)
        throw new Error(`Erro ao excluir documento: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Documento excluído com sucesso!"
        })
        
        // Recarregar dados para atualizar a lista
        loadMyRequests()
      } else {
        throw new Error(result.error || 'Erro ao excluir documento')
      }
    } catch (error) {
      console.error('❌ Erro ao excluir documento:', error)
      toast({
        title: "Erro",
        description: `Erro ao excluir documento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">Carregando...</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm">Carregando...</span>
      </div>
    )
  }

  if (myRequests.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-8 w-8 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm mb-2">Nenhuma solicitação criada</p>
        <p className="text-xs text-gray-400">
          Você ainda não criou nenhuma solicitação de assinatura múltipla
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {myRequests.length} solicitação(ões) criada(s)
        </p>
        <Button onClick={loadMyRequests} variant="outline" size="sm">
          Atualizar
        </Button>
      </div>

      <div className="grid gap-3 max-h-96 overflow-y-auto">
        {myRequests.map((request) => (
          <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">{request.document_name}</h3>
                <div className="flex items-center space-x-3 text-xs text-gray-500">
                  <span className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(request.created_at).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    {request.completed_signatures}/{request.total_signatures}
                  </span>
                  {getStatusBadge(request.status)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              
              {request.status === 'completed' && (() => {
                const signedFilePath = request.signed_file_path || 
                  (request.metadata && request.metadata.signed_file_path)
                
                if (signedFilePath) {
                  return (
                    <Button
                      onClick={() => downloadSignedDocument(signedFilePath, request.document_name)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white text-xs"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  )
                }
                return null
              })()}
              
              {request.status === 'ready_for_signature' && (
                <Button
                  onClick={() => handleFinalizeSignature(request.id)}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                >
                  Finalizar
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
