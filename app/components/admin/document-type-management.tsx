"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
// import { useRouter } from "next/navigation" // Temporariamente removido
import { createDocumentType, updateDocumentType, deleteDocumentType } from "@/app/admin/actions"
import DocumentTypeForm from "./document-type-form"
import {
  Tag,
  FileText,
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  LayoutGrid,
  List,
} from "lucide-react"

/* ---------- TIPOS ---------- */
type Status = "active" | "inactive"

interface DocumentType {
  id: string
  name: string
  prefix: string
  color: string
  requiredFields: string[]
  approvalRequired: boolean
  retentionPeriod: number
  status: Status
  template: string | null
  documentsCount: number // Assumindo que este campo virá do banco ou será calculado
}

/* ---------- CONSTANTES ---------- */
// 🎨 Opções de cores baseadas no novo design
const colorOptions = [
  { value: "trackdoc-blue", label: "Azul Principal", class: "bg-trackdoc-blue/20 text-trackdoc-blue" },
  { value: "trackdoc-blue-dark", label: "Azul Escuro", class: "bg-trackdoc-blue-dark/20 text-trackdoc-blue-dark" },
  { value: "trackdoc-blue-light", label: "Azul Claro", class: "bg-trackdoc-blue-light/20 text-trackdoc-blue" },
  { value: "trackdoc-black", label: "Preto", class: "bg-trackdoc-black/20 text-trackdoc-black" },
  { value: "trackdoc-gray", label: "Cinza", class: "bg-trackdoc-gray/20 text-trackdoc-gray" },
  { value: "trackdoc-gray-light", label: "Cinza Claro", class: "bg-trackdoc-gray-light/20 text-trackdoc-gray" },
  { value: "success", label: "Sucesso", class: "bg-success/20 text-success" },
  { value: "warning", label: "Aviso", class: "bg-warning/20 text-warning" },
  { value: "destructive", label: "Erro", class: "bg-destructive/20 text-destructive" },
]

const statusColors: Record<Status, string> = {
  active: "bg-success/20 text-success",
  inactive: "bg-destructive/20 text-destructive",
}



/* ---------- PROPS ---------- */
interface DocumentTypeManagementProps {
  initialDocumentTypes: DocumentType[]
  totalDocuments: number
}

/* ---------- COMPONENTE PRINCIPAL ---------- */
export default function DocumentTypeManagement({ initialDocumentTypes = [], totalDocuments = 0 }: DocumentTypeManagementProps) {
  const router = useRouter()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null)
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [typeToDelete, setTypeToDelete] = useState<DocumentType | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isUpdating, setIsUpdating] = useState(false)

  // Usar estado local para gerenciar os tipos de documento
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>(initialDocumentTypes)
  
  // Atualizar o estado local quando as props mudarem
  useEffect(() => {
    setDocumentTypes(initialDocumentTypes)
  }, [initialDocumentTypes])

  // Log quando a lista de tipos muda
  useEffect(() => {
    console.log("📊 [STATE] Lista de tipos atualizada:", documentTypes.length, "tipos")
  }, [documentTypes])

  // Limpeza de event listeners ao desmontar componente
  useEffect(() => {
    return () => {
      // Limpar qualquer listener que possa estar causando problemas
      console.log("🧹 [CLEANUP] Limpando componente")
    }
  }, [])

  // Removido sistema de prevenção de navegação para debug

  /* --------- DERIVADOS --------- */
  const filteredTypes = documentTypes.filter((type) => type.name?.toLowerCase().includes(searchTerm.toLowerCase()))

  const stats = {
    total: documentTypes.length,
    totalDocuments: totalDocuments,
  }



  /* --------- HANDLERS --------- */
  const handleSaveDocumentType = async (typeData: Partial<DocumentType>) => {
    // Se não há dados válidos, apenas fechar o modal (cancelamento)
    if (!typeData.name || Object.keys(typeData).length === 0) {
      setShowTypeModal(false)
      setSelectedType(null)
      return
    }

    try {
      setIsUpdating(true)
      
      let result
      if (typeData.id) {
        result = await updateDocumentType(typeData.id, typeData)
      } else {
        result = await createDocumentType(typeData as Omit<DocumentType, "id">)
      }

      if (result.success) {
        console.log("✅ Tipo de documento salvo com sucesso!")
        
        // Fechar modal imediatamente
        setShowTypeModal(false)
        setSelectedType(null)
        
        // Atualizar estado local imediatamente para feedback visual
        if (result.data) {
          if (!typeData.id) {
            // Criação - adicionar à lista
            const newType: DocumentType = {
              id: result.data.id,
              name: result.data.name,
              prefix: result.data.prefix,
              color: result.data.color,
              requiredFields: result.data.requiredFields,
              approvalRequired: result.data.approvalRequired,
              retentionPeriod: result.data.retentionPeriod,
              status: result.data.status,
              template: result.data.template,
              documentsCount: 0
            }
            setDocumentTypes(prevTypes => [...prevTypes, newType])
          } else {
            // Edição - atualizar na lista
            setDocumentTypes(prevTypes => 
              prevTypes.map(type => 
                type.id === typeData.id ? { ...type, ...typeData } : type
              )
            )
          }
        }
        
        // Estado local já foi atualizado
        console.log("✅ [CREATE] Estado local atualizado com sucesso")
        
      } else {
        console.error("Falha ao salvar tipo de documento:", result.error)
        alert(`Erro ao salvar: ${result.error || "Erro desconhecido"}`)
      }
    } catch (error) {
      console.error("Erro inesperado ao salvar tipo de documento:", error)
      alert(`Erro inesperado: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteDocumentType = async () => {
    if (!typeToDelete) return

    console.log("🗑️ [DELETE] Iniciando exclusão do tipo:", typeToDelete.name)
    
    // Salvar referência do tipo antes de limpar
    const typeToDeleteRef = typeToDelete
    
    try {
      // Executar exclusão primeiro
      const result = await deleteDocumentType(typeToDeleteRef.id)
      console.log("🗑️ [DELETE] Resultado da exclusão:", result)
      
      if (result.success) {
        console.log("✅ Tipo de documento excluído com sucesso!")
        
        // Atualizar estado local imediatamente
        setDocumentTypes(prevTypes => prevTypes.filter(type => type.id !== typeToDeleteRef.id))
        
        // Fechar modal após sucesso
        setShowDeleteConfirm(false)
        setTypeToDelete(null)
        
        console.log("✅ [DELETE] Estado local atualizado com sucesso")
        
      } else {
        console.error("❌ [DELETE] Falha ao deletar tipo de documento:", result.error)
        // Fechar modal mesmo em caso de erro
        setShowDeleteConfirm(false)
        setTypeToDelete(null)
        // Mostrar erro via alert simples
        alert(`Erro ao excluir: ${result.error || "Erro desconhecido"}`)
      }
    } catch (error) {
      console.error("💥 [DELETE] Erro inesperado:", error)
      // Fechar modal mesmo em caso de erro
      setShowDeleteConfirm(false)
      setTypeToDelete(null)
      // Mostrar erro via alert simples
      alert(`Erro inesperado: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
    }
  }

  /* --------- RENDER --------- */
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipos de Documento</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Documentos</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar tipos de documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8 p-0"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Dialog open={showTypeModal} onOpenChange={setShowTypeModal}>
                <DialogTrigger asChild>
                  <Button onClick={() => setSelectedType(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Tipo
                  </Button>
                </DialogTrigger>
                                 <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                   <DialogHeader>
                     <DialogTitle>{selectedType ? "Editar Tipo de Documento" : "Novo Tipo de Documento"}</DialogTitle>
                     <DialogDescription>
                       {selectedType ? "Edite as informações do tipo de documento." : "Crie um novo tipo de documento para organizar seus documentos."}
                     </DialogDescription>
                   </DialogHeader>
                   <DocumentTypeForm documentType={selectedType} onSave={handleSaveDocumentType} />
                 </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === "grid" ? (
        /* Document Types Grid */
        <div className="grid grid-cols-1 lg:col-span-3 xl:grid-cols-3 gap-6">
          {filteredTypes.map((type) => (
            <Card key={type.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        colorOptions.find((c) => c.value === type.color)?.class
                      }`}
                    >
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{type.name}</CardTitle>
                      <p className="text-sm text-gray-500">Prefixo: {type.prefix}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={statusColors[type.status]}>
                      {type.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedType(type)
                            setShowTypeModal(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setTypeToDelete(type)
                            setShowDeleteConfirm(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
                             <CardContent>
                 <div className="space-y-4">



                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Aprovação:</p>
                      <p className={type.approvalRequired ? "text-green-600" : "text-gray-500"}>
                        {type.approvalRequired ? "Obrigatória" : "Não obrigatória"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Retenção:</p>
                      <p className="text-gray-600">{type.retentionPeriod} meses</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t">
                    <span>{type.documentsCount} documentos</span>
                    <span>Template: {type.template ? "Sim" : "Não"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Document Types List */
        <Card>
          <CardContent className="p-0">
            <div className="space-y-0">
              {filteredTypes.map((type, index) => (
                <div key={type.id} className={`p-4 ${index !== filteredTypes.length - 1 ? "border-b" : ""}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          colorOptions.find((c) => c.value === type.color)?.class
                        }`}
                      >
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <h3 className="font-medium text-lg">{type.name}</h3>
                          <Badge className={statusColors[type.status]} variant="secondary">
                            {type.status === "active" ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                                                 <div className="flex items-center space-x-6 text-sm text-gray-500 mt-1">
                           <span>Prefixo: {type.prefix}</span>
                           <span>{type.documentsCount} documentos</span>
                           <span>Retenção: {type.retentionPeriod} meses</span>
                           <span className={type.approvalRequired ? "text-green-600" : "text-gray-500"}>
                             {type.approvalRequired ? "Aprovação obrigatória" : "Sem aprovação"}
                           </span>
                         </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedType(type)
                            setShowTypeModal(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setTypeToDelete(type)
                            setShowDeleteConfirm(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={(open) => {
        console.log("🔄 [MODAL] Modal de exclusão:", open ? "aberto" : "fechado")
        setShowDeleteConfirm(open)
        if (!open) {
          setTypeToDelete(null)
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir este tipo de documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso removerá permanentemente o tipo de documento{" "}
              <span className="font-semibold">{typeToDelete?.name}</span> e todos os seus dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              console.log("❌ [MODAL] Cancelando exclusão")
              setShowDeleteConfirm(false)
              setTypeToDelete(null)
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                console.log("✅ [MODAL] Confirmando exclusão")
                handleDeleteDocumentType()
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}


