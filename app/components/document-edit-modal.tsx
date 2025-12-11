"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useCategories } from "@/hooks/use-categories"
import { useDepartments } from "@/hooks/use-departments"
import { useDocumentTypes } from "@/hooks/use-document-types"
import { toast } from "@/hooks/use-toast"
import { 
  FileText, 
  Tag, 
  Building2, 
  Save, 
  X, 
  AlertCircle,
  Info
} from "lucide-react"

interface Document {
  id: string
  title: string
  description?: string
  document_type_id?: string
  category_id?: string
  department_id?: string
  entity_id?: string
  status: string
  document_type?: { name: string; color: string }
  category?: { name: string; color: string }
  department?: { name: string }
}

interface DocumentEditModalProps {
  document: Document | null
  isOpen: boolean
  onClose: () => void
  onSave: (documentId: string, updates: Partial<Document>) => Promise<void>
}

export default function DocumentEditModal({
  document,
  isOpen,
  onClose,
  onSave
}: DocumentEditModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    document_type_id: '',
    category_id: '',
    department_id: ''
  })
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const { categories } = useCategories()
  const { departments } = useDepartments()
  const { documentTypes } = useDocumentTypes()

  // Resetar formulário quando o documento mudar
  useEffect(() => {
    if (document) {
      setFormData({
        title: document.title || '',
        description: document.description || '',
        document_type_id: document.document_type_id || 'none',
        category_id: document.category_id || 'none',
        department_id: document.department_id || 'none'
      })
      setHasChanges(false)
    }
  }, [document])

  // Detectar mudanças no formulário
  useEffect(() => {
    if (document) {
      const hasChanged = 
        formData.title !== (document.title || '') ||
        formData.description !== (document.description || '') ||
        formData.document_type_id !== (document.document_type_id || 'none') ||
        formData.category_id !== (document.category_id || 'none') ||
        formData.department_id !== (document.department_id || 'none')
      
      setHasChanges(hasChanged)
    }
  }, [formData, document])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!document || !hasChanges) return

    try {
      setLoading(true)

      // Preparar dados para atualização
      const updates: Partial<Document> = {}
      
      if (formData.title !== document.title) {
        updates.title = formData.title
      }
      
      if (formData.description !== (document.description || '')) {
        updates.description = formData.description || null
      }
      
      if (formData.document_type_id !== (document.document_type_id || '')) {
        updates.document_type_id = formData.document_type_id === 'none' ? null : formData.document_type_id || null
      }
      
      if (formData.category_id !== (document.category_id || '')) {
        updates.category_id = formData.category_id === 'none' ? null : formData.category_id || null
      }
      
      if (formData.department_id !== (document.department_id || '')) {
        updates.department_id = formData.department_id === 'none' ? null : formData.department_id || null
      }

      await onSave(document.id, updates)
      
      toast({
        title: "Documento atualizado",
        description: "As informações do documento foram atualizadas com sucesso.",
      })
      
      onClose()
    } catch (error) {
      console.error('Erro ao atualizar documento:', error)
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o documento. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (hasChanges) {
      if (confirm('Há alterações não salvas. Deseja realmente fechar?')) {
        onClose()
      }
    } else {
      onClose()
    }
  }

  if (!document) return null

  const isBlocked = document.status === 'pending_approval' || document.status === 'rejected'

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Editar Informações do Documento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Aviso se documento estiver bloqueado */}
          {isBlocked && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <div className="text-sm text-yellow-800">
                <strong>Documento bloqueado:</strong> Este documento está em processo de aprovação ou foi rejeitado. 
                Algumas alterações podem não ser permitidas.
              </div>
            </div>
          )}

          {/* Informações básicas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Info className="h-4 w-4" />
              Informações Básicas
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Digite o título do documento"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Digite uma descrição para o documento (opcional)"
                  rows={3}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Classificação */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Tag className="h-4 w-4" />
              Classificação
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tipo de Documento */}
              <div className="space-y-2">
                <Label htmlFor="document_type">Tipo de Documento</Label>
                <Select
                  value={formData.document_type_id}
                  onValueChange={(value) => handleInputChange('document_type_id', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum tipo</SelectItem>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: type.color }}
                          />
                          {type.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.document_type_id && (
                  <div className="text-xs text-gray-500">
                    Tipo atual: {documentTypes.find(t => t.id === formData.document_type_id)?.name}
                  </div>
                )}
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => handleInputChange('category_id', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma categoria</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.category_id && (
                  <div className="text-xs text-gray-500">
                    Categoria atual: {categories.find(c => c.id === formData.category_id)?.name}
                  </div>
                )}
              </div>
            </div>

            {/* Departamento */}
            <div className="space-y-2">
              <Label htmlFor="department">Departamento</Label>
              <Select
                value={formData.department_id}
                onValueChange={(value) => handleInputChange('department_id', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum departamento</SelectItem>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3 h-3" />
                        {department.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.department_id && (
                <div className="text-xs text-gray-500">
                  Departamento atual: {departments.find(d => d.id === formData.department_id)?.name}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Status atual */}
          <div className="space-y-2">
            <Label>Status Atual</Label>
            <div className="flex items-center gap-2">
              <Badge 
                variant={document.status === 'approved' ? 'default' : 
                        document.status === 'pending_approval' ? 'secondary' : 
                        document.status === 'rejected' ? 'destructive' : 'outline'}
              >
                {document.status === 'approved' ? 'Aprovado' :
                 document.status === 'pending_approval' ? 'Em aprovação' :
                 document.status === 'rejected' ? 'Rejeitado' :
                 document.status === 'draft' ? 'Rascunho' : document.status}
              </Badge>
              <span className="text-xs text-gray-500">
                (O status não pode ser alterado aqui)
              </span>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-xs text-gray-500">
            {hasChanges ? (
              <span className="text-orange-600">• Há alterações não salvas</span>
            ) : (
              <span>Nenhuma alteração detectada</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={loading || !hasChanges || !formData.title.trim()}
              className="min-w-[100px]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}