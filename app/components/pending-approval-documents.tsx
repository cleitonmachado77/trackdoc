"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, X, Eye, Clock, FileText, User } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface PendingApprovalDocument {
  id: string
  document_id: string
  approver_id: string
  step_order: number
  status: string
  comments?: string
  approved_at?: string
  created_at: string
  document: {
    id: string
    title: string
    description?: string
    file_name?: string
    author: {
      full_name: string
    }
  }
}

export default function PendingApprovalDocuments() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [pendingDocuments, setPendingDocuments] = useState<PendingApprovalDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDocument, setSelectedDocument] = useState<PendingApprovalDocument | null>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [approvalDecision, setApprovalDecision] = useState<'approve' | 'reject' | null>(null)
  const [comments, setComments] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (user?.id) {
      fetchPendingApprovals()
    }
  }, [user?.id])

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('approval_requests')
        .select(`
          *,
          document:documents!approval_requests_document_id_fkey(
            id,
            title,
            description,
            file_name,
            author:profiles!documents_author_id_fkey(full_name)
          )
        `)
        .eq('approver_id', user?.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error

      setPendingDocuments(data || [])
    } catch (error) {
      console.error('Erro ao buscar documentos pendentes:', error)
      toast({
        title: "Erro ao carregar documentos",
        description: "Não foi possível carregar os documentos pendentes de aprovação.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (approved: boolean) => {
    if (!selectedDocument) return

    try {
      setIsProcessing(true)
      
      // 1. Atualizar workflow de aprovação
      const { error: workflowError } = await supabase
        .from('approval_requests')
        .update({ 
          status: approved ? 'approved' : 'rejected',
          comments: comments || undefined,
          approved_at: new Date().toISOString()
        })
        .eq('id', selectedDocument.id)

      if (workflowError) throw workflowError

      // 2. Verificar se é o último aprovador
      const { data: remainingWorkflows, error: remainingError } = await supabase
        .from('approval_requests')
        .select('*')
        .eq('document_id', selectedDocument.document_id)
        .eq('status', 'pending')

      if (remainingError) throw remainingError

      // 3. Se não há mais aprovações pendentes, finalizar documento
      if (remainingWorkflows.length === 0) {
        const finalStatus = approved ? 'approved' : 'rejected'
        await supabase
          .from('documents')
          .update({ status: finalStatus })
          .eq('id', selectedDocument.document_id)
      }

      // 4. Criar notificação para o autor do documento
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          title: approved ? 'Documento aprovado' : 'Documento rejeitado',
          message: `Seu documento "${selectedDocument.document.title}" foi ${approved ? 'aprovado' : 'rejeitado'}${comments ? ` com comentários: ${comments}` : ''}.`,
          type: approved ? 'success' : 'error',
          priority: 'high',
          recipients: [user?.email || ''],
          channels: ['email'],
          status: 'sent',
          created_by: user?.id
        })

      if (notificationError) throw notificationError

      toast({
        title: approved ? "Documento aprovado!" : "Documento rejeitado!",
        description: `O documento foi ${approved ? 'aprovado' : 'rejeitado'} com sucesso.`,
      })

      // Fechar dialog e atualizar lista
      setShowApprovalDialog(false)
      setSelectedDocument(null)
      setApprovalDecision(null)
      setComments("")
      
      // Recarregar lista
      await fetchPendingApprovals()

    } catch (error) {
      console.error('Erro ao processar aprovação:', error)
      toast({
        title: "Erro ao processar aprovação",
        description: "Ocorreu um erro ao processar a aprovação do documento.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Carregando documentos pendentes...</p>
        </div>
      </div>
    )
  }

  if (pendingDocuments.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
          <h3 className="text-lg font-semibold mb-2">Nenhum documento pendente</h3>
          <p className="text-muted-foreground">
            Você não tem documentos pendentes de aprovação no momento.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Documentos Pendentes de Aprovação</h2>
        <Badge variant="secondary">{pendingDocuments.length} pendente(s)</Badge>
      </div>

      <div className="grid gap-4">
        {pendingDocuments.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    {item.document.title}
                  </CardTitle>
                  {item.document.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.document.description}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="ml-2">
                  <Clock className="h-3 w-3 mr-1" />
                  Pendente
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Autor: {item.document.author.full_name}
                  </div>
                  {item.document.file_name && (
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {item.document.file_name}
                    </div>
                  )}
                </div>
                
                <Dialog open={showApprovalDialog && selectedDocument?.id === item.id} onOpenChange={(open) => {
                  if (open) {
                    setSelectedDocument(item)
                    setShowApprovalDialog(true)
                  } else {
                    setShowApprovalDialog(false)
                    setSelectedDocument(null)
                    setApprovalDecision(null)
                    setComments("")
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver e Aprovar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Aprovar Documento</DialogTitle>
                      <DialogDescription>
                        Revise o documento e decida se deve ser aprovado ou rejeitado.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Detalhes do Documento</h4>
                        <div className="bg-muted p-3 rounded-lg space-y-2">
                          <p><strong>Título:</strong> {item.document.title}</p>
                          {item.document.description && (
                            <p><strong>Descrição:</strong> {item.document.description}</p>
                          )}
                          <p><strong>Autor:</strong> {item.document.author.full_name}</p>
                          {item.document.file_name && (
                            <p><strong>Arquivo:</strong> {item.document.file_name}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="comments">Comentários (opcional)</Label>
                        <Textarea
                          id="comments"
                          placeholder="Adicione comentários sobre sua decisão..."
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          onClick={() => setShowApprovalDialog(false)}
                          disabled={isProcessing}
                        >
                          Cancelar
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleApproval(false)}
                          disabled={isProcessing}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Rejeitar
                        </Button>
                        <Button
                          onClick={() => handleApproval(true)}
                          disabled={isProcessing}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aprovar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
