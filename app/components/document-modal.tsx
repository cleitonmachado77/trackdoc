"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Upload,
  FileText,
  FileSpreadsheet,
  Presentation,
  Save,
  Send,
  ArrowRight,
  X,
  File,
  GitBranch,
  Eye,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useDocumentTypes } from "@/hooks/use-document-types"
import { useUsers } from "@/hooks/use-users"
import { InlineCreateSelect } from "./inline-create-select"
import { useToast } from "@/hooks/use-toast"
import { useProfile } from "./profile-context"

// Note: Next.js 13+ shows warnings about function props in "use client" components
// These are false positives - the functions work correctly on the client side
interface DocumentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document?: any
  mode?: "view" | "edit" | "create" | "new-version"
  onSave: (document: any) => void
}

// Simulação de contadores de documentos por tipo para o ano atual
const getCurrentYear = () => new Date().getFullYear()

// Função removida - números de documentos agora são gerados automaticamente pelo banco de dados
// ao criar o documento, usando uma sequência numérica simples (ex: 000001, 000002, etc)

// Função para obter usuário atual (simulado)
const getCurrentUser = () => {
  return {
    name: "Usuário Teste",
    email: "usuario.teste@empresa.com",
    role: "Usuário",
  }
}

// Tipos de arquivo suportados
const fileTypes = [
  { value: "word", label: "Word Document", icon: FileText, accept: ".doc,.docx", color: "text-blue-600" },
  { value: "excel", label: "Excel Spreadsheet", icon: FileSpreadsheet, accept: ".xls,.xlsx", color: "text-green-600" },
  {
    value: "powerpoint",
    label: "PowerPoint Presentation",
    icon: Presentation,
    accept: ".ppt,.pptx",
    color: "text-orange-600",
  },
  { value: "pdf", label: "PDF Document", icon: File, accept: ".pdf", color: "text-red-600" },
]

export default function DocumentModal({ open, onOpenChange, document, mode = "create", onSave }: DocumentModalProps) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { toast } = useToast()
  const { profile } = useProfile()
  const { users } = useUsers()

  const [formData, setFormData] = useState({
    number: "",
    title: "",
    author: "",
    version: "1.0",
    status: "draft",
    sector: "",
    type: "",
    content: "",
    metadata: {
      description: "",
      tags: "",
      category: "",
    },
  })

  const [selectedFileType, setSelectedFileType] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState("metadata")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileWasRemoved, setFileWasRemoved] = useState(false)
  const [availableSectors, setAvailableSectors] = useState<{ name: string; shortName: string }[]>([])
  const { documentTypes: initialDocumentTypes, loading: documentTypesLoading } = useDocumentTypes()
  const [availableDocumentTypes, setAvailableDocumentTypes] = useState(initialDocumentTypes)
  const [availableCategories, setAvailableCategories] = useState<
    { id: number; name: string; description: string; color: string; status: string }[]
  >([])
  const [isEdit, setIsEdit] = useState(false)
  const [isNewVersion, setIsNewVersion] = useState(false)
  const [isCreate, setIsCreate] = useState(false)
  const [isReadOnly, setIsReadOnly] = useState(false)
  
  // Atualizar lista de tipos de documento quando mudar
  useEffect(() => {
    setAvailableDocumentTypes(initialDocumentTypes)
  }, [initialDocumentTypes])

  useEffect(() => {
    if (open) {
      const fetchDropdownData = async () => {
        // Fetch Departments
        const { data: departmentsData, error: departmentsError } = await supabase
          .from("departments")
          .select("name, short_name, status")
          .eq("status", "active")
        if (departmentsError) {
          console.error("Erro ao buscar departamentos:", departmentsError)
        } else {
          setAvailableSectors(
            departmentsData.map((dept) => ({
              name: dept.name,
              shortName: dept.short_name,
            })),
          )
        }



        // Fetch Categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("id, name, description, color, status")
          .eq("status", "active")
        if (categoriesError) {
          console.error("Erro ao buscar categorias:", categoriesError)
        } else {
          setAvailableCategories(categoriesData)
        }
      }
      fetchDropdownData()
    }
  }, [open, supabase])

  useEffect(() => {
    setFileWasRemoved(false)

    if (document && (mode === "edit" || mode === "new-version" || mode === "view")) {
      setFormData({
        number: document.number || "",
        title: document.title || "",
        author: document.author || "",
        version: document.version || "1.0",
        status: document.status || "draft",
        sector: document.sector || "",
        type: document.type || "",
        content: document.content || "",
        metadata: {
          description: document.metadata?.description || "",
          tags: document.metadata?.tags || "",
          category: document.metadata?.category || "",
        },
      })
      setSelectedFileType(document.fileType || "")
      setIsEdit(mode === "edit")
      setIsNewVersion(mode === "new-version")
      setIsReadOnly(mode === "view")
    } else if (mode === "create") {
      const currentUser = getCurrentUser()
      setFormData({
        number: "",
        title: "",
        author: currentUser.name,
        version: "1.0",
        status: "draft",
        sector: "",
        type: "",
        content: "",
        metadata: {
          description: "",
          tags: "",
          category: "",
        },
      })
      setSelectedFileType("")
      setUploadedFile(null)
      setIsCreate(true)
      setIsEdit(false)
      setIsNewVersion(false)
      setIsReadOnly(false)
    }
  }, [document, open, mode])

  // Removido: números de documentos agora são gerados automaticamente pelo banco de dados
  // useEffect(() => {
  //   if ((isCreate || (isEdit && formData.status === "draft")) && formData.type && availableDocumentTypes.length > 0) {
  //     const newNumber = getNextDocumentNumber(formData.type, availableDocumentTypes, mockExistingDocuments)
  //     setFormData((prev) => ({ ...prev, number: newNumber }))
  //   }
  // }, [formData.type, isCreate, isEdit, formData.status, availableDocumentTypes])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setIsUploading(true)
      setUploadProgress(0)

      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            setIsUploading(false)
            setUploadedFile(file)
            return 100
          }
          return prev + 10
        })
      }, 200)
    }
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    if (isCreate || isNewVersion || (isEdit && formData.status !== "draft")) {
      setSelectedFileType("")
    }
    setFileWasRemoved(true)
  }

  const handleSave = (status = "draft") => {
    // Verificar se aprovação é obrigatória baseada no tipo de documento
    const selectedDocType = availableDocumentTypes.find(dt => dt.name === formData.type)
    const isApprovalRequired = selectedDocType?.approvalRequired || false
    const retentionPeriod = selectedDocType?.retentionPeriod ?? 0

    // Se requer aprovação, usar o status passado (draft/pending)
    // Se não requer aprovação e status é draft, mudar para approved
    const finalStatus = (!isApprovalRequired && status === 'draft') ? 'approved' : status

    const saveData = {
      ...formData,
      status: finalStatus,
      fileType: selectedFileType,
      fileName: uploadedFile?.name || document?.fileName,
      fileSize: uploadedFile?.size || document?.fileSize,
      createdAt: document?.createdAt || new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      approval_required: isApprovalRequired,
      retention_period: retentionPeriod,
      retention_end_date: retentionPeriod > 0 ? new Date(Date.now() + retentionPeriod * 30 * 24 * 60 * 60 * 1000).toISOString() : null
    }

    onSave(saveData)
  }

  const handleAdvanceToContent = () => {
    setActiveTab("content")
  }

  const canAdvanceToContent = () => {
    return formData.title && formData.type && formData.sector
  }

  const canSubmitDocument = () => {
    return canAdvanceToContent() && selectedFileType && (uploadedFile || document?.fileName)
  }

  const getFileTypeInfo = (type: string) => {
    return fileTypes.find((ft) => ft.value === type)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getModalTitle = () => {
    switch (mode) {
      case "view":
        return "Visualizar Documento"
      case "edit":
        return "Editar Documento"
      case "new-version":
        return "Nova Versão do Documento"
      case "create":
      default:
        return "Novo Documento"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {isNewVersion && <GitBranch className="h-5 w-5 text-blue-600" />}
            {mode === "view" && <Eye className="h-5 w-5 text-gray-600" />}
            <span>{getModalTitle()}</span>
            {isNewVersion && (
              <Badge variant="outline" className="ml-2">
                v{document?.version} → v{formData.version}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className={`grid w-full ${isEdit || mode === "view" ? "grid-cols-3" : "grid-cols-2"}`}>
            <TabsTrigger value="metadata">Metadados</TabsTrigger>
            <TabsTrigger value="content" disabled={!canAdvanceToContent() && isReadOnly}>
              Conteúdo
            </TabsTrigger>
            {(isEdit || mode === "view") && <TabsTrigger value="versions">Versões</TabsTrigger>}
          </TabsList>

          <TabsContent value="metadata" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="number">Número do Documento</Label>
                <Input
                  id="number"
                  value={formData.number}
                  disabled={true}
                  className="bg-gray-50"
                  placeholder={isCreate ? "Será gerado automaticamente" : ""}
                />
                <p className="text-xs text-gray-500">
                  {isCreate && !formData.type && "Selecione o tipo para gerar o número"}
                  {isCreate &&
                    formData.type &&
                    `Formato: ${formData.type.substring(0, 3).toUpperCase()}-${getCurrentYear()}-XXX`}
                  {isNewVersion && "Número mantido da versão anterior"}
                  {(isEdit || mode === "view") && "Número do documento (não editável)"}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="version">Versão</Label>
                <Input id="version" value={formData.version} disabled={true} className="bg-gray-50" />
                <p className="text-xs text-gray-500">
                  {isCreate && "Primeira versão será 1.0"}
                  {isNewVersion && `Nova versão será ${formData.version}`}
                  {(isEdit || mode === "view") && "Versão atual do documento"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Digite o título do documento"
                required
                disabled={isReadOnly}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="author">Autor</Label>
                <Input id="author" value={formData.author} disabled={true} className="bg-gray-50" />
                <p className="text-xs text-gray-500">
                  {isCreate && "Usuário atual (você)"}
                  {isNewVersion && "Autor da nova versão (você)"}
                  {(isEdit || mode === "view") && "Autor original do documento"}
                </p>
              </div>
              <InlineCreateSelect
                value={formData.sector}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, sector: value }))}
                options={availableSectors.map(s => ({ id: s.shortName, name: s.name }))}
                placeholder="Selecione o setor"
                label="Setor *"
                disabled={isReadOnly || (isEdit && formData.status !== "draft")}
                className={isReadOnly ? "bg-gray-50" : ""}
                onCreate={async (data) => {
                  // Buscar usuário atual da sessão
                  const { data: sessionData } = await supabase.auth.getSession()
                  const currentUserId = sessionData?.session?.user?.id
                  
                  const { data: newDept, error } = await supabase
                    .from('departments')
                    .insert({
                      name: data.name,
                      description: data.description || '',
                      manager_id: data.manager_id || null,
                      status: 'active',
                      entity_id: profile?.entity_id || null,
                      created_by: currentUserId
                    })
                    .select()
                    .single()
                  
                  if (error) throw error
                  
                  // Atualizar lista - usar id ao invés de short_name
                  setAvailableSectors([...availableSectors, { name: newDept.name, shortName: newDept.id }])
                  
                  toast({
                    title: "Departamento criado!",
                    description: `${newDept.name} foi criado com sucesso.`,
                  })
                  
                  return { id: newDept.id, name: newDept.name }
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

            <div className="grid grid-cols-2 gap-4">
              <InlineCreateSelect
                value={formData.type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                options={availableDocumentTypes.map(dt => ({ id: dt.name, name: dt.name }))}
                placeholder="Selecione o tipo"
                label="Tipo de Documento *"
                disabled={isReadOnly || (isEdit && formData.status !== "draft")}
                className={isReadOnly || isEdit ? "bg-gray-50" : ""}
                onCreate={async (data) => {
                  // Buscar usuário atual da sessão
                  const { data: sessionData } = await supabase.auth.getSession()
                  const currentUserId = sessionData?.session?.user?.id
                  
                  const { data: newType, error } = await supabase
                    .from('document_types')
                    .insert({
                      name: data.name,
                      description: data.description,
                      prefix: data.prefix,
                      color: data.color || '#3B82F6',
                      status: 'active',
                      entity_id: profile?.entity_id || null,
                      created_by: currentUserId
                    })
                    .select()
                    .single()
                  
                  if (error) throw error
                  
                  // Atualizar lista
                  setAvailableDocumentTypes([...availableDocumentTypes, newType])
                  
                  toast({
                    title: "Tipo de documento criado!",
                    description: `${newType.name} foi criado com sucesso.`,
                  })
                  
                  return { id: newType.name, name: newType.name }
                }}
                createFields={[
                  { name: 'name', label: 'Nome do Tipo', type: 'text', required: true, placeholder: 'Ex: Política de Segurança' },
                  { name: 'prefix', label: 'Prefixo', type: 'text', required: true, placeholder: 'Ex: POL' }
                ]}
                createTitle="Criar Novo Tipo de Documento"
              />
              <InlineCreateSelect
                value={formData.metadata.category}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    metadata: { ...prev.metadata, category: value },
                  }))
                }
                options={availableCategories.map(c => ({ id: c.name, name: c.name }))}
                placeholder="Selecione a categoria"
                label="Categoria"
                disabled={isReadOnly || (isEdit && formData.status !== "draft")}
                className={isReadOnly ? "bg-gray-50" : ""}
                onCreate={async (data) => {
                  // Buscar usuário atual da sessão
                  const { data: sessionData } = await supabase.auth.getSession()
                  const currentUserId = sessionData?.session?.user?.id
                  
                  const { data: newCat, error } = await supabase
                    .from('categories')
                    .insert({
                      name: data.name,
                      description: data.description,
                      color: data.color || '#3B82F6',
                      status: 'active',
                      entity_id: profile?.entity_id || null,
                      created_by: currentUserId
                    })
                    .select()
                    .single()
                  
                  if (error) throw error
                  
                  // Atualizar lista
                  setAvailableCategories([...availableCategories, newCat])
                  
                  toast({
                    title: "Categoria criada!",
                    description: `${newCat.name} foi criada com sucesso.`,
                  })
                  
                  return { id: newCat.name, name: newCat.name }
                }}
                createFields={[
                  { name: 'name', label: 'Nome da Categoria', type: 'text', required: true, placeholder: 'Ex: Documentos Internos' },
                  { name: 'description', label: 'Descrição', type: 'textarea', placeholder: 'Descrição da categoria' }
                ]}
                createTitle="Criar Nova Categoria"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.metadata.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    metadata: { ...prev.metadata, description: e.target.value },
                  }))
                }
                placeholder="Breve descrição do documento e seu objetivo"
                rows={3}
                disabled={isReadOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={formData.metadata.tags}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    metadata: { ...prev.metadata, tags: e.target.value },
                  }))
                }
                placeholder="Palavras-chave separadas por vírgula (ex: segurança, política, TI)"
                disabled={isReadOnly}
              />
            </div>

            {/* Preview do número que será gerado */}
            {(isCreate || isNewVersion) && formData.type && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      {isNewVersion
                        ? `Nova versão: ${formData.number} v${formData.version}`
                        : `Número do documento: ${formData.number || "Será gerado automaticamente"}`}
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    {isNewVersion
                      ? "Baseado na versão anterior com numeração incrementada"
                      : formData.type && `Próximo número disponível para ${formData.type}`}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Informações do usuário atual */}
            {(isCreate || isNewVersion) && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      {isCreate ? "Criado por: " : "Nova versão por: "}
                      {formData.author}
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    {getCurrentUser().email} • {getCurrentUser().role}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Botões da aba Metadados */}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <div className="flex space-x-2">
                {(formData.status === "draft" || isCreate || isNewVersion) && (
                  <Button variant="outline" onClick={() => handleSave("draft")}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Rascunho
                  </Button>
                )}
                <Button onClick={handleAdvanceToContent} disabled={!canAdvanceToContent()}>
                  Avançar
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            {/* Seleção do tipo de arquivo */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Arquivo *</Label>
                {(formData.status === "draft" || isCreate || isNewVersion || (isEdit && formData.status === "draft")) &&
                  !selectedFileType &&
                  uploadedFile === null &&
                  !document?.fileName && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <p className="text-sm text-blue-800">
                          <strong>Selecione o tipo de arquivo:</strong> Escolha o formato do documento que será enviado.
                        </p>
                      </div>
                    </div>
                  )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {fileTypes.map((fileType) => {
                    const Icon = fileType.icon
                    const isSelected = selectedFileType === fileType.value
                    return (
                      <Card
                        key={fileType.value}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          isSelected ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
                        } ${isReadOnly || (isEdit && formData.status !== "draft") ? "opacity-50 cursor-not-allowed" : ""}`}
                        onClick={() =>
                          !isReadOnly && !(isEdit && formData.status !== "draft") && setSelectedFileType(fileType.value)
                        }
                      >
                        <CardContent className="p-4 text-center">
                          <Icon className={`h-8 w-8 mx-auto mb-2 ${isSelected ? "text-blue-600" : fileType.color}`} />
                          <p className={`text-sm font-medium ${isSelected ? "text-blue-800" : "text-gray-700"}`}>
                            {fileType.label}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{fileType.accept}</p>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {/* Upload de arquivo */}
              {selectedFileType && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 mb-4">
                        {(() => {
                          const fileTypeInfo = getFileTypeInfo(selectedFileType)
                          const Icon = fileTypeInfo?.icon || File
                          return (
                            <>
                              <Icon className={`h-5 w-5 ${fileTypeInfo?.color}`} />
                              <span className="font-medium">Upload de {getFileTypeInfo(selectedFileType)?.label}</span>
                              <Badge variant="outline">
                                {formData.number} - v{formData.version}
                              </Badge>
                            </>
                          )
                        })()}
                      </div>

                      {!uploadedFile && (!document?.fileName || fileWasRemoved) ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept={getFileTypeInfo(selectedFileType)?.accept}
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                            disabled={isReadOnly}
                          />
                          <label
                            htmlFor="file-upload"
                            className={`cursor-pointer ${isReadOnly ? "cursor-not-allowed opacity-50" : ""}`}
                          >
                            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-medium text-gray-700 mb-2">
                              Clique para fazer upload ou arraste o arquivo aqui
                            </p>
                            <p className="text-sm text-gray-500">
                              Formatos aceitos: {getFileTypeInfo(selectedFileType)?.accept}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">Tamanho máximo: 50MB</p>
                          </label>
                        </div>
                      ) : (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="font-medium text-green-800">{uploadedFile?.name || document?.fileName}</p>
                                <p className="text-sm text-green-600">
                                  {formatFileSize(uploadedFile?.size || document?.fileSize || 0)} • Upload concluído
                                </p>
                              </div>
                            </div>
                            {!isReadOnly && (
                              <Button variant="outline" size="sm" onClick={handleRemoveFile}>
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Barra de progresso durante upload */}
                      {isUploading && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Fazendo upload...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Informações do arquivo atual (modo edição) */}
              {(isEdit || mode === "view") && document?.fileName && !fileWasRemoved && (
                <Card className="bg-gray-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Arquivo Atual</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      {(() => {
                        const fileTypeInfo = getFileTypeInfo(selectedFileType || document?.fileType)
                        const Icon = fileTypeInfo?.icon || FileText
                        return <Icon className={`h-5 w-5 ${fileTypeInfo?.color || "text-blue-600"}`} />
                      })()}
                      <div>
                        <p className="font-medium">{document.fileName}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(document.fileSize || 0)} • Última modificação: {document.updatedAt}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Botões da aba Conteúdo */}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setActiveTab("metadata")}>
                Voltar
              </Button>
              <div className="flex space-x-2">
                {!isReadOnly && (
                  <>
                    {(formData.status === "draft" || isCreate || isNewVersion) && (
                      <Button variant="outline" onClick={() => handleSave("draft")} disabled={!selectedFileType}>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Rascunho
                      </Button>
                    )}
                    <Button onClick={() => handleSave("pending")} disabled={!canSubmitDocument()}>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar para Aprovação
                    </Button>
                  </>
                )}
                {isReadOnly && (
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Fechar
                  </Button>
                )}
              </div>
            </div>

            {/* Avisos */}
            {selectedFileType && !uploadedFile && (!document?.fileName || fileWasRemoved) && !isReadOnly && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    <strong>Upload obrigatório:</strong> Faça o upload do arquivo para continuar.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="versions">
            <div className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Histórico de Versões</p>
                <p className="text-sm">Esta funcionalidade será implementada em breve.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
