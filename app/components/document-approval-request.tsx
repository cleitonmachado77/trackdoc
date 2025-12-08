"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, User, CheckCircle } from "lucide-react"
import { useUsers } from "@/hooks/use-users"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface DocumentApprovalRequestProps {
  documentId: string
  documentTitle: string
  onSuccess?: () => void
}

export default function DocumentApprovalRequest({ 
  documentId, 
  documentTitle, 
  onSuccess 
}: DocumentApprovalRequestProps) {
  const { users, loading: usersLoading } = useUsers()
  const { toast } = useToast()
  const [selectedApprover, setSelectedApprover] = useState<string>("")
  const [isRequestingApproval, setIsRequestingApproval] = useState(false)

  // Função para solicitar aprovação
  const requestApproval = async () => {
    if (!selectedApprover) {
      toast({
        title: "Aprovador não selecionado",
        description: "Por favor, selecione um usuário para aprovar o documento.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsRequestingApproval(true)
      
      // 1. Atualizar status do documento para pending_approval
      const { error: docError } = await supabase
        .from('documents')
        .update({ 
          status: 'pending_approval',
          approval_required: true 
        })
        .eq('id', documentId)

      if (docError) throw docError

      // 2. Criar workflow de aprovação
      const { error: workflowError } = await supabase
        .from('approval_requests')
        .insert({
          document_id: documentId,
          approver_id: selectedApprover,
          step_order: 1,
          status: 'pending'
        })

      if (workflowError) throw workflowError

      // 3. Buscar informações do aprovador para o toast
      const { data: approverData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', selectedApprover)
        .single()

      // Nota: A notificação será criada automaticamente pelo trigger do banco de dados
      // (trigger_notify_approval_request)

      toast({
        title: "Aprovação solicitada!",
        description: `Documento enviado para aprovação de ${approverData?.full_name || 'aprovador'}.`,
      })

      // Limpar seleção
      setSelectedApprover("")
      
      // Disparar evento global para atualizar outras páginas
      window.dispatchEvent(new CustomEvent('approval-requested', { 
        detail: { documentId, approverId: selectedApprover } 
      }))
      
      // Chamar callback de sucesso
      onSuccess?.()

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Solicitar Aprovação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="approver">Selecionar Aprovador</Label>
          <Select value={selectedApprover} onValueChange={setSelectedApprover}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um usuário para aprovar" />
            </SelectTrigger>
            <SelectContent>
              {usersLoading ? (
                <SelectItem value="loading" disabled>
                  Carregando usuários...
                </SelectItem>
              ) : (
                users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {user.full_name} ({user.email})
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={requestApproval}
          disabled={!selectedApprover || isRequestingApproval}
          className="w-full"
        >
          {isRequestingApproval ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4 animate-spin" />
              Solicitando Aprovação...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Solicitar Aprovação
            </>
          )}
        </Button>

        <p className="text-sm text-muted-foreground">
          O documento será marcado como "Pendente de Aprovação" e uma notificação será enviada para o usuário selecionado.
        </p>
      </CardContent>
    </Card>
  )
}
