"use client"

import { useState, useCallback } from "react"
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
} from "lucide-react"
import { useAuth } from '@/lib/hooks/use-auth-final'
import { getFileIcon } from "@/lib/utils/file-icons"
import { useDocuments } from "@/hooks/use-documents"
import { useCategories } from "@/hooks/use-categories"
import { useDepartments } from "@/hooks/use-departments"
import { useDocumentTypes } from "@/hooks/use-document-types"
import { useUsers } from "@/hooks/use-users"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@supabase/ssr"

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

export default function DocumentUpload({ onSuccess }: DocumentUploadProps) {
  const { user } = useAuth()
  const { createDocument } = useDocuments()
  const { toast } = useToast()
  const { categories } = useCategories()
  const { departments } = useDepartments()
  const { documentTypes, validateFile } = useDocumentTypes()
  const { users } = useUsers()

  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedDepartment, setSelectedDepartment] = useState<string>("")
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>("")
  const [isPublic, setIsPublic] = useState(false)
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [selectedApprover, setSelectedApprover] = useState<string>("")
  const [showApproverSelect, setShowApproverSelect] = useState(false)
  const [isRequestingApproval, setIsRequestingApproval] = useState(false)

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleUpload = async () => {
    if (!user || uploadFiles.length === 0) return

    console.log('=== INICIANDO UPLOAD ===')
    console.log('Usuário:', user)
    console.log('Arquivos para upload:', uploadFiles.length)
    console.log('Configurações:', {
      selectedCategory,
      selectedDepartment,
      selectedDocumentType,
      isPublic,
      description,
      tags
    })

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
          is_public: isPublic,
          tags: tags,
          file_name: uploadFile.file.name,
          file_size: uploadFile.file.size,
          file_type: uploadFile.file.type
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

      } catch (error) {
        console.error(`Erro no upload de ${uploadFile.file.name}:`, error)
        
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { 
            ...f, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Erro no upload' 
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

    await Promise.all(uploadPromises)
  }

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
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

      // 3. Buscar informações do aprovador
      const { data: approverData, error: approverError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', approverId)
        .single()

      if (approverError) throw approverError

      // 4. Criar notificação para o aprovador
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          title: 'Documento pendente de aprovação',
          message: `O documento "${uploadFiles[0]?.file.name}" foi enviado para sua aprovação.`,
          type: 'warning',
          priority: 'high',
          recipients: [approverData.email],
          channels: ['email'],
          status: 'sent',
          created_by: user?.id
        })

      if (notificationError) throw notificationError

      toast({
        title: "Aprovação solicitada!",
        description: `Documento enviado para aprovação de ${approverData.full_name}.`,
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

  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-base font-medium">Upload de Documentos</h3>
        <p className="text-xs text-gray-500">
          Arraste e solte arquivos ou clique para selecionar.
        </p>
      </div>
      
      {/* Área de Drop */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded p-2 text-center cursor-pointer transition-colors ${
          isDragActive
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
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Alguns arquivos falharam no upload. Verifique os erros acima.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Configurações do Documento */}
      {uploadFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Configurações do Documento</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <Label htmlFor="category" className="text-xs">Categoria</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="department" className="text-xs">Departamento</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Selecione um departamento" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="documentType" className="text-xs">Tipo de Documento</Label>
              <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Selecione um tipo" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-4">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="isPublic" className="text-xs">Documento público</Label>
            </div>
          </div>

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
            disabled={uploadFiles.some(f => f.status === 'uploading')}
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
