"use client"

import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  File,
  FileImage,
  FileVideo,
  FileAudio,
  Send,
  User,
  Plus,
} from "lucide-react"
import { useAuth } from '@/lib/hooks/use-auth-final'
import { useProfile } from './profile-context'
import { getFileIcon } from "@/lib/utils/file-icons"
import { useDocuments } from "@/hooks/use-documents"
import { useCategories } from "@/hooks/use-categories"
import { useDepartments } from "@/hooks/use-departments"
import { useDocumentTypes } from "@/hooks/use-document-types"
import { useUsers } from "@/hooks/use-users"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@supabase/ssr"
import { InlineCreateSelect } from "./inline-create-select"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface UploadFile {
  file: File
  id: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

interface DocumentUploadProps {
  onSuccess?: () => void
}

export default function DocumentUploadWithApproval({ onSuccess }: DocumentUploadProps) {
  const { user } = useAuth()
  const { createDocument } = useDocuments()
  const { toast } = useToast()
  const { categories: initialCategories } = useCategories()
  const { departments: initialDepartments } = useDepartments()
  const { documentTypes: initialDocumentTypes, validateFile } = useDocumentTypes()
  const { users } = useUsers()
  const { profile } = useProfile()

  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedDepartment, setSelectedDepartment] = useState<string>("")
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [selectedApprover, setSelectedApprover] = useState<string>("")
  const [showApproverSelect, setShowApproverSelect] = useState(false)
  const [isRequestingApproval, setIsRequestingApproval] = useState(false)
  
  // Estados locais para listas que podem ser atualizadas
  const [categories, setCategories] = useState(initialCategories)
  const [departments, setDepartments] = useState(initialDepartments)
  const [documentTypes, setDocumentTypes] = useState(initialDocumentTypes)
  
  // Atualizar listas quando os dados iniciais mudarem
  useEffect(() => {
    setCategories(initialCategories)
  }, [initialCategories])
  
  useEffect(() => {
    setDepartments(initialDepartments)
  }, [initialDepartments])
  
  useEffect(() => {
    setDocumentTypes(initialDocumentTypes)
  }, [initialDocumentTypes])

  // Verificar se aprovação é obrigatória baseada no tipo de documento
  const selectedDocType = documentTypes.find(dt => dt.id === selectedDocumentType)
  const isApprovalRequired = selectedDocType?.approvalRequired || false
  // Usar 0 se não houver retention_period definido (não usar 24 como padrão)
  const retentionPeriod = selectedDocType?.retentionPeriod ?? 0

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'pending'
    }))
    setUploadFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true
  })

  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(file => file.id !== id))
  }

  const getFileIconComponent = (fileType: string, fileName: string) => {
    return getFileIcon(fileType, fileName, "h-4 w-4")
  }

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Função para solicitar aprovação
  const requestApproval = async (documentId: string, approverId: string) => {
    try {
      setIsRequestingApproval(true)

      // 1. Atualizar status do documento para pending_approval
      const { error: docError } = await supabase
        .from('documents')
        .update({ status: 'pending_approval' })
        .eq('id', documentId)

      if (docError) throw docError

      // 2. Criar workflow de aprovação
      const { error: workflowError } = await supabase
        .from('approval_requests')
        .insert({
          document_id: documentId,
          approver_id: approverId,
          step_order: 1,
          status: 'pending'
        })

      if (workflowError) throw workflowError

      // Nota: A notificação será criada automaticamente pelo trigger do banco de dados
      // (trigger_notify_approval_request)

      // Buscar informações do aprovador para exibir no toast
      const { data: approverData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', approverId)
        .single()

      toast({
        title: "Aprovação solicitada!",
        description: `Documento enviado para aprovação${approverData ? ` de ${approverData.full_name}` : ''}.`,
      })

    } catch (error) {
      console.error('Erro ao solicitar aprovação:', error)
      toast({
        title: "Erro ao solicitar aprovação",
        description: "Ocorreu um erro ao solicitar aprovação do documento.",
        variant: "destructive",
      })
    } finally {
      setIsRequestingApproval(false)
    }
  }

  const handleUpload = async () => {
    if (!user || uploadFiles.length === 0) return

    // Validar campos obrigatórios
    if (!selectedCategory) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, selecione uma categoria para o documento.",
        variant: "destructive",
      })
      return
    }

    if (!selectedDepartment) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, selecione um departamento para o documento.",
        variant: "destructive",
      })
      return
    }

    if (!selectedDocumentType) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, selecione um tipo de documento.",
        variant: "destructive",
      })
      return
    }

    // Verificar se aprovação é obrigatória e se aprovador foi selecionado
    if (isApprovalRequired && !selectedApprover) {
      toast({
        title: "Aprovação obrigatória",
        description: "Este tipo de documento requer aprovação. Por favor, selecione um aprovador.",
        variant: "destructive",
      })
      return
    }

    const uploadPromises = uploadFiles.map(async (uploadFile) => {
      try {
        console.log(`\n--- PROCESSANDO ARQUIVO: ${uploadFile.file.name} ---`)

        // Validar arquivo se tipo de documento selecionado
        if (selectedDocumentType) {
          console.log('Validando arquivo com tipo de documento...')
          const documentType = documentTypes.find(dt => dt.id === selectedDocumentType)
          if (documentType) {
            const errors = validateFile(uploadFile.file, documentType)
            if (errors.length > 0) {
              console.error('Erros de validação:', errors)
              throw new Error(errors.join(', '))
            }
            console.log('Arquivo validado com sucesso')
          }
        }

        // Atualizar status para uploading
        setUploadFiles(prev => prev.map(f =>
          f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 0 } : f
        ))

        // Simular progresso
        const progressInterval = setInterval(() => {
          setUploadFiles(prev => prev.map(f =>
            f.id === uploadFile.id ? { ...f, progress: Math.min(f.progress + 10, 90) } : f
          ))
        }, 200)

        // Criar documento
        const documentData = {
          title: uploadFile.file.name.replace(/\.[^/.]+$/, ""), // Remove extensão
          description: description || `Upload de ${uploadFile.file.name}`,
          category_id: selectedCategory || undefined,
          department_id: selectedDepartment || undefined,
          document_type_id: selectedDocumentType || undefined,
          is_public: false, // Documentos sempre privados para aprovação
          tags: tags,
          file_name: uploadFile.file.name,
          file_size: uploadFile.file.size,
          file_type: uploadFile.file.type,
          retention_period: retentionPeriod,
          approval_required: isApprovalRequired,
          retention_end_date: retentionPeriod > 0 ? new Date(Date.now() + retentionPeriod * 30 * 24 * 60 * 60 * 1000).toISOString() : null,
          // Definir status baseado se requer aprovação ou não
          status: (isApprovalRequired ? 'pending_approval' : 'approved') as 'draft' | 'pending_approval' | 'approved' | 'rejected'
        }

        console.log('Dados do documento:', documentData)
        console.log('Iniciando createDocument...')

        const document = await createDocument(documentData, uploadFile.file)

        clearInterval(progressInterval)

        // Atualizar status para success
        setUploadFiles(prev => prev.map(f =>
          f.id === uploadFile.id ? { ...f, status: 'success', progress: 100 } : f
        ))

        console.log('Documento criado com sucesso:', document)

        // Se foi selecionado um aprovador, solicitar aprovação
        if (selectedApprover && document) {
          await requestApproval(document.id, selectedApprover)
        }

        return document

      } catch (error: any) {
        console.error(`\n!!! ERRO NO UPLOAD DE ${uploadFile.file.name} !!!`)
        console.error('Erro completo:', error)
        console.error('Tipo do erro:', typeof error)
        console.error('Mensagem do erro:', error instanceof Error ? error.message : 'Erro desconhecido')
        console.error('Código do erro:', error?.code)
        console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A')

        // Mensagem de erro mais amigável
        let errorMessage = 'Erro no upload'
        
        if (error?.message?.includes('número')) {
          errorMessage = 'Erro ao gerar número do documento. Por favor, tente novamente.'
        } else if (error?.code === '23505') {
          errorMessage = 'Conflito de numeração. Por favor, tente novamente.'
        } else if (error instanceof Error) {
          errorMessage = error.message
        }

        setUploadFiles(prev => prev.map(f =>
          f.id === uploadFile.id ? {
            ...f,
            status: 'error',
            error: errorMessage
          } : f
        ))

        // Mostrar toast de erro
        toast({
          title: "Erro ao criar documento",
          description: error instanceof Error ? error.message : "Erro inesperado no upload",
          variant: "destructive",
          duration: 5000,
        })
      }
    })

    try {
      await Promise.all(uploadPromises)

      toast({
        title: "Upload concluído!",
        description: `${uploadFiles.length} arquivo(s) enviado(s) com sucesso.`,
      })

      // Limpar formulário
      setUploadFiles([])
      setSelectedCategory("")
      setSelectedDepartment("")
      setSelectedDocumentType("")
      setDescription("")
      setTags([])
      setSelectedApprover("")
      setShowApproverSelect(false)

      onSuccess?.()
    } catch (error) {
      console.error('Erro no upload:', error)
      toast({
        title: "Erro no upload",
        description: "Ocorreu um erro ao fazer upload dos arquivos.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-2">

      {/* Área de Drop */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded p-2 text-center cursor-pointer transition-colors ${isDragActive
          ? "border-primary bg-primary/5"
          : "border-gray-300 hover:border-primary/50"
          }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-4 w-4 text-gray-400 mb-1" />
        {isDragActive ? (
          <p className="text-xs font-medium text-primary">Solte os arquivos aqui...</p>
        ) : (
          <div>
            <p className="text-xs font-medium">Arraste arquivos ou clique</p>
            <Button variant="outline" size="sm" className="mt-1 h-6 text-xs px-2">
              Selecionar
            </Button>
          </div>
        )}
        <p className="text-xs text-gray-400 mt-1">
          PDF, DOC, XLS, PPT, TXT, JPG, PNG | Max: 50MB
        </p>
      </div>

      {/* Lista de Arquivos */}
      {uploadFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Arquivos Selecionados</h3>
          {uploadFiles.map((uploadFile) => (
            <div
              key={uploadFile.id}
              className="flex items-center justify-between p-2 border rounded text-sm"
            >
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                {getFileIconComponent(uploadFile.file.type, uploadFile.file.name)}
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{uploadFile.file.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(uploadFile.file.size)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1 ml-2">
                {uploadFile.status === 'uploading' && (
                  <div className="w-16">
                    <Progress value={uploadFile.progress} className="h-1" />
                  </div>
                )}

                {uploadFile.status === 'success' && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}

                {uploadFile.status === 'error' && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(uploadFile.id)}
                  disabled={uploadFile.status === 'uploading'}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}

          {uploadFiles.some(f => f.status === 'error') && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Alguns arquivos falharam no upload. Verifique os erros acima.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Configurações do Documento */}
      {uploadFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Configurações do Documento</h3>
            <span className="text-xs text-gray-500">
              <span className="text-red-500">*</span> Campos obrigatórios
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-2">
              <InlineCreateSelect
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                options={categories}
                placeholder="Selecione uma categoria"
                label="Categoria *"
                className={`h-8 text-sm ${!selectedCategory ? 'border-red-300 focus:border-red-500' : ''}`}
                onCreate={async (data) => {
                  const { data: newCat, error } = await supabase
                    .from('categories')
                    .insert({
                      name: data.name,
                      description: data.description || '',
                      color: data.color || '#3B82F6',
                      status: 'active',
                      entity_id: profile?.entity_id || null
                    })
                    .select()
                    .single()
                  
                  if (error) throw error
                  
                  // Adicionar à lista local
                  setCategories([...categories, newCat])
                  
                  toast({
                    title: "Categoria criada!",
                    description: `${newCat.name} foi criada com sucesso.`,
                  })
                  
                  return newCat
                }}
                createFields={[
                  { name: 'name', label: 'Nome da Categoria', type: 'text', required: true, placeholder: 'Ex: Documentos Internos' },
                  { name: 'description', label: 'Descrição', type: 'textarea', placeholder: 'Descrição da categoria' },
                  { 
                    name: 'color', 
                    label: 'Cor', 
                    type: 'select', 
                    options: [
                      { value: '#3B82F6', label: 'Azul' },
                      { value: '#10B981', label: 'Verde' },
                      { value: '#F59E0B', label: 'Amarelo' },
                      { value: '#EF4444', label: 'Vermelho' },
                      { value: '#8B5CF6', label: 'Roxo' },
                      { value: '#EC4899', label: 'Rosa' }
                    ]
                  }
                ]}
                createTitle="Criar Nova Categoria"
              />
            </div>

            <div className="space-y-2">
              <InlineCreateSelect
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
                options={departments}
                placeholder="Selecione um departamento"
                label="Departamento *"
                className={`h-8 text-sm ${!selectedDepartment ? 'border-red-300 focus:border-red-500' : ''}`}
                onCreate={async (data) => {
                  const { data: newDept, error } = await supabase
                    .from('departments')
                    .insert({
                      name: data.name,
                      description: data.description || '',
                      manager_id: data.manager_id || null,
                      status: 'active',
                      entity_id: profile?.entity_id || null
                    })
                    .select()
                    .single()
                  
                  if (error) throw error
                  
                  // Adicionar à lista local
                  setDepartments([...departments, newDept])
                  
                  toast({
                    title: "Departamento criado!",
                    description: `${newDept.name} foi criado com sucesso.`,
                  })
                  
                  return newDept
                }}
                createFields={[
                  { name: 'name', label: 'Nome do Departamento', type: 'text', required: true, placeholder: 'Ex: Tecnologia da Informação' },
                  { name: 'description', label: 'Descrição', type: 'textarea', placeholder: 'Descrição do departamento' },
                  { 
                    name: 'manager_id', 
                    label: 'Gerente do Departamento', 
                    type: 'select', 
                    placeholder: 'Selecione um gerente (opcional)',
                    options: users.map(u => ({ value: u.id, label: u.full_name }))
                  }
                ]}
                createTitle="Criar Novo Departamento"
              />
            </div>

            <div className="space-y-2">
              <InlineCreateSelect
                value={selectedDocumentType}
                onValueChange={setSelectedDocumentType}
                options={documentTypes}
                placeholder="Selecione um tipo"
                label="Tipo de Documento *"
                className={`h-8 text-sm ${!selectedDocumentType ? 'border-red-300 focus:border-red-500' : ''}`}
                onCreate={async (data) => {
                  const { data: newType, error } = await supabase
                    .from('document_types')
                    .insert({
                      name: data.name,
                      prefix: data.prefix,
                      description: data.description || '',
                      color: data.color || '#3B82F6',
                      status: 'active',
                      approval_required: data.approval_required === 'true',
                      retention_period: parseInt(data.retention_period) || 24,
                      required_fields: ['title', 'author'], // Garantir campos obrigatórios padrão
                      entity_id: profile?.entity_id || null
                    })
                    .select()
                    .single()
                  
                  if (error) throw error
                  
                  // Mapear para o formato esperado
                  const mappedType = {
                    id: newType.id,
                    name: newType.name,
                    description: newType.description,
                    prefix: newType.prefix || 'DOC',
                    color: newType.color || '#3B82F6',
                    requiredFields: newType.required_fields || ['title', 'author'],
                    approvalRequired: newType.approval_required || false,
                    retentionPeriod: newType.retention_period,
                    status: newType.status || 'active',
                    template: newType.template,
                  }
                  
                  // Adicionar à lista local
                  setDocumentTypes([...documentTypes, mappedType])
                  
                  toast({
                    title: "Tipo de documento criado!",
                    description: `${newType.name} foi criado com sucesso.`,
                  })
                  
                  return mappedType
                }}
                createFields={[
                  { name: 'name', label: 'Nome do Tipo', type: 'text', required: true, placeholder: 'Ex: Política de Segurança' },
                  { name: 'prefix', label: 'Prefixo', type: 'text', required: true, placeholder: 'Ex: POL' },
                  { name: 'description', label: 'Descrição', type: 'textarea', placeholder: 'Descrição do tipo de documento' },
                  { 
                    name: 'approval_required', 
                    label: 'Requer Aprovação?', 
                    type: 'select', 
                    options: [
                      { value: 'false', label: 'Não' },
                      { value: 'true', label: 'Sim' }
                    ]
                  },
                  { name: 'retention_period', label: 'Período de Retenção (meses)', type: 'text', placeholder: '24' },
                  { 
                    name: 'color', 
                    label: 'Cor', 
                    type: 'select', 
                    options: [
                      { value: '#3B82F6', label: 'Azul' },
                      { value: '#10B981', label: 'Verde' },
                      { value: '#F59E0B', label: 'Amarelo' },
                      { value: '#EF4444', label: 'Vermelho' },
                      { value: '#8B5CF6', label: 'Roxo' },
                      { value: '#EC4899', label: 'Rosa' }
                    ]
                  }
                ]}
                createTitle="Criar Novo Tipo de Documento"
              />
            </div>

            {/* Botão Solicitar Aprovação */}
            <div className="flex items-center">
              <Button
                type="button"
                variant={selectedApprover ? "default" : isApprovalRequired ? "destructive" : "outline"}
                onClick={() => setShowApproverSelect(!showApproverSelect)}
                className={`w-full h-8 text-xs ${isApprovalRequired ? 'animate-pulse' : ''}`}
              >
                {selectedApprover ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Aprovador Selecionado
                  </>
                ) : isApprovalRequired ? (
                  <>
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Aprovação Obrigatória
                  </>
                ) : (
                  <>
                    <Send className="h-3 w-3 mr-1" />
                    Solicitar Aprovação
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Informações do tipo selecionado */}
          {selectedDocType && (selectedDocType.approvalRequired || (selectedDocType.retentionPeriod && selectedDocType.retentionPeriod > 0)) && (
            <div className="mt-1 p-2 bg-blue-50 rounded text-xs">
              <div className="flex flex-wrap gap-2 items-center">
                {selectedDocType.approvalRequired && (
                  <Badge variant="destructive" className="text-xs">
                    ⚠️ Aprovação Obrigatória
                  </Badge>
                )}
                {selectedDocType.retentionPeriod && selectedDocType.retentionPeriod > 0 && (
                  <Badge variant="outline" className="text-xs">
                    🔒 Retenção: {selectedDocType.retentionPeriod} meses
                  </Badge>
                )}
              </div>
              {selectedDocType.approvalRequired && (
                <p className="text-blue-700 mt-1">
                  Este tipo de documento requer aprovação antes de ser publicado.
                </p>
              )}
              {selectedDocType.retentionPeriod && selectedDocType.retentionPeriod > 0 && (
                <p className="text-blue-700 mt-1">
                  Documentos deste tipo não podem ser excluídos durante o período de retenção.
                </p>
              )}
            </div>
          )}

          {/* Seletor de Aprovador */}
          {showApproverSelect && (
            <div className="p-2 border rounded bg-gray-50">
              <Label htmlFor="approver" className="text-xs font-medium mb-1 block">
                Selecionar Aprovador
              </Label>
              <Select value={selectedApprover} onValueChange={setSelectedApprover}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Escolha um usuário para aprovar" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span className="text-xs">{user.full_name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedApprover && (
                <div className="mt-1">
                  <Button
                    onClick={() => {
                      setSelectedApprover("")
                      setShowApproverSelect(false)
                    }}
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs px-2"
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="description" className="text-xs">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do documento..."
              rows={1}
              className="text-sm h-8 resize-none"
            />
          </div>

          <div>
            <Label htmlFor="tags" className="text-xs">Tags</Label>
            <div className="space-y-1">
              <div className="flex space-x-1">
                <Input
                  id="tags"
                  placeholder="Adicionar tag..."
                  className="h-8 text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag(e.currentTarget.value)
                      e.currentTarget.value = ''
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => {
                    const input = document.getElementById('tags') as HTMLInputElement
                    if (input.value) {
                      addTag(input.value)
                      input.value = ''
                    }
                  }}
                >
                  Adicionar
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer text-xs h-5">
                      {tag}
                      <X
                        className="h-2 w-2 ml-1"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Button
            onClick={handleUpload}
            disabled={
              uploadFiles.some(f => f.status === 'uploading') ||
              !selectedCategory ||
              !selectedDepartment ||
              !selectedDocumentType
            }
            className="w-full h-8 text-sm"
          >
            {uploadFiles.some(f => f.status === 'uploading') ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Fazendo Upload...
              </>
            ) : (
              <>
                <Upload className="mr-1 h-3 w-3" />
                Fazer Upload ({uploadFiles.length} arquivo{uploadFiles.length !== 1 ? 's' : ''})
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
