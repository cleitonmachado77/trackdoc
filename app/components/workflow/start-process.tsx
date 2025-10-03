'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Plus, FileText } from 'lucide-react'
import { useWorkflowTemplates } from '@/hooks/useWorkflow'
import { useDocuments } from '@/hooks/use-documents'
import { useToast } from '@/hooks/use-toast'

interface StartProcessProps {
  onProcessStarted?: () => void
}

export default function StartProcess({ onProcessStarted }: StartProcessProps) {
  const { templates, fetchTemplates } = useWorkflowTemplates()
  const { documents, loading: documentsLoading, fetchDocuments } = useDocuments()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [selectedDocument, setSelectedDocument] = useState('')
  const [processName, setProcessName] = useState('')
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (open) {
      fetchTemplates()
      fetchDocuments?.()
    }
  }, [open, fetchTemplates, fetchDocuments])

  const handleStartProcess = async () => {
    if (!selectedTemplate || !selectedDocument || !processName.trim()) return
    setStarting(true)
    try {
      console.log('🚀 [StartProcess] Enviando requisição', {
        templateId: selectedTemplate,
        documentId: selectedDocument,
        processName: processName.trim(),
      })

      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: selectedTemplate,
          documentId: selectedDocument,
          processName: processName.trim(),
        }),
      })

      const data = await response.json()
      console.log('📥 [StartProcess] Resposta', { status: response.status, body: data })
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao iniciar processo')
      }

      setOpen(false)
      setSelectedTemplate('')
      setSelectedDocument('')
      setProcessName('')
      toast({ title: 'Processo iniciado com sucesso!' })
      onProcessStarted?.()
    } catch (err) {
      console.error('Erro ao iniciar processo:', err)
      toast({
        title: 'Erro ao iniciar processo',
        description: err instanceof Error ? err.message : 'Tente novamente mais tarde.',
        variant: 'destructive',
      })
    } finally {
      setStarting(false)
    }
  }

  const documentOptions = useMemo(() => {
    return (documents ?? [])
      .filter((doc) => doc.status === 'approved')
      .map((doc) => ({ id: doc.id, title: doc.title }))
  }, [documents])

  return (
    <>
      <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
        <Plus className="h-4 w-4" /> Novo Processo
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Iniciar Novo Processo
            </DialogTitle>
            <DialogDescription>
              Selecione um template e documento para iniciar um novo processo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Template de Workflow</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Documento</Label>
              <Select
                value={selectedDocument}
                onValueChange={setSelectedDocument}
                disabled={documentsLoading || documentOptions.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={documentsLoading
                      ? 'Carregando documentos...'
                      : documentOptions.length === 0
                        ? 'Nenhum documento aprovado disponível'
                        : 'Selecione um documento'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {documentOptions.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nome do Processo</Label>
              <Input
                value={processName}
                onChange={(e) => setProcessName(e.target.value)}
                placeholder="Digite um nome para o processo"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleStartProcess}
                disabled={starting || !selectedTemplate || !selectedDocument || !processName.trim()}
              >
                {starting ? 'Iniciando...' : 'Iniciar Processo'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

