"use client"

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Document {
  id: string
  title: string
  file_path: string
  status: string
  created_at: string
  metadata?: any
}

interface DocumentSelectorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  processId: string
  onDocumentsSelected: (documentIds: string[]) => void
  title?: string
  description?: string
}

export default function DocumentSelectorModal({
  open,
  onOpenChange,
  processId,
  onDocumentsSelected,
  title = "Selecionar Documentos para Assinatura",
  description = "Escolha um ou mais documentos do processo para assinar:"
}: DocumentSelectorModalProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Carregar documentos do processo
  useEffect(() => {
    if (open && processId) {
      loadProcessDocuments()
    }
  }, [open, processId])

  const loadProcessDocuments = async () => {
    try {
      setLoading(true)

      // Buscar o processo para obter o document_id principal
      const { data: process, error: processError } = await supabase
        .from('document_processes')
        .select('document_id')
        .eq('id', processId)
        .single()

      if (processError || !process) {
        throw new Error('Processo não encontrado')
      }

      // Buscar documentos anexados ao processo
      const { data: attachedDocuments, error: attachedError } = await supabase
        .from('process_attachments')
        .select(`
          document:documents(
            id,
            title,
            file_path,
            status,
            created_at,
            metadata
          )
        `)
        .eq('process_id', processId)

      if (attachedError) {
        console.warn('Erro ao buscar documentos anexados:', attachedError)
      }

      // Buscar o documento principal
      const { data: mainDocument, error: mainError } = await supabase
        .from('documents')
        .select('id, title, file_path, status, created_at, metadata')
        .eq('id', process.document_id)
        .single()

      if (mainError) {
        console.warn('Erro ao buscar documento principal:', mainError)
      }

      // Combinar documentos
      const allDocuments: Document[] = []

      // Adicionar documento principal se existir
      if (mainDocument) {
        allDocuments.push(mainDocument)
      }

      // Adicionar documentos anexados
      if (attachedDocuments) {
        const attachedDocs = attachedDocuments
          .map(att => att.document)
          .filter(Boolean)
          .filter(doc => doc.id !== process.document_id) // Evitar duplicação

        allDocuments.push(...attachedDocs)
      }

      setDocuments(allDocuments)

    } catch (error) {
      console.error('Erro ao carregar documentos:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar documentos do processo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDocumentToggle = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId) 
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    )
  }

  const handleSelectAll = () => {
    if (selectedDocuments.length === documents.length) {
      setSelectedDocuments([])
    } else {
      setSelectedDocuments(documents.map(doc => doc.id))
    }
  }

  const handleConfirm = () => {
    if (selectedDocuments.length === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos um documento para assinar",
        variant: "destructive",
      })
      return
    }

    onDocumentsSelected(selectedDocuments)
    onOpenChange(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'signed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'signed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Assinado</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendente</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>
      default:
        return <Badge variant="outline">Não assinado</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </DialogTitle>
          <p className="text-sm text-gray-600">{description}</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Carregando documentos...</p>
              </div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum documento encontrado neste processo</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Controles */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedDocuments.length === documents.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium">
                    Selecionar todos ({documents.length} documentos)
                  </label>
                </div>
                <Badge variant="outline">
                  {selectedDocuments.length} selecionado(s)
                </Badge>
              </div>

              {/* Lista de documentos */}
              <div className="space-y-3">
                {documents.map((document) => (
                  <Card 
                    key={document.id} 
                    className={`cursor-pointer transition-all ${
                      selectedDocuments.includes(document.id) 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleDocumentToggle(document.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={selectedDocuments.includes(document.id)}
                          onCheckedChange={() => handleDocumentToggle(document.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(document.status)}
                            <h3 className="font-medium text-gray-900 truncate">
                              {document.title}
                            </h3>
                            {getStatusBadge(document.status)}
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            <p>Criado em: {new Date(document.created_at).toLocaleDateString('pt-BR')}</p>
                            {document.metadata?.signed_at && (
                              <p>Assinado em: {new Date(document.metadata.signed_at).toLocaleDateString('pt-BR')}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={selectedDocuments.length === 0}
          >
            Confirmar Seleção ({selectedDocuments.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
