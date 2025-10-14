"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  User, 
  Clock,
  Database,
  Send,
  Eye
} from "lucide-react"
import { useAuth } from '@/lib/hooks/use-auth-final'
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface DebugData {
  approvalRequests: any[]
  documents: any[]
  profiles: any[]
  notifications: any[]
  stats: {
    totalApprovalRequests: number
    pendingApprovals: number
    docsPendingApproval: number
    totalProfiles: number
    totalNotifications: number
  }
}

export default function DebugApprovalSystem() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [debugData, setDebugData] = useState<DebugData | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string>("")
  const [testDocumentTitle, setTestDocumentTitle] = useState("Documento de Teste")
  const [testComments, setTestComments] = useState("")

  const fetchDebugData = async () => {
    try {
      setLoading(true)
      
      // Buscar approval_requests
      const { data: approvalRequests } = await supabase
        .from('approval_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      // Buscar documentos
      const { data: documents } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      // Buscar profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      // Buscar notificações
      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      // Buscar estatísticas
      const { data: stats } = await supabase.rpc('get_approval_stats')

      setDebugData({
        approvalRequests: approvalRequests || [],
        documents: documents || [],
        profiles: profiles || [],
        notifications: notifications || [],
        stats: stats || {
          totalApprovalRequests: approvalRequests?.length || 0,
          pendingApprovals: approvalRequests?.filter(ar => ar.status === 'pending').length || 0,
          docsPendingApproval: documents?.filter(d => d.status === 'pending_approval').length || 0,
          totalProfiles: profiles?.length || 0,
          totalNotifications: notifications?.length || 0
        }
      })

    } catch (error) {
      console.error('Erro ao buscar dados de debug:', error)
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados de debug.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createTestApproval = async () => {
    if (!user || !selectedUser) {
      toast({
        title: "Erro",
        description: "Selecione um usuário para aprovar.",
        variant: "destructive",
      })
      return
    }

    try {
      // 1. Criar documento de teste
      const { data: document, error: docError } = await supabase
        .from('documents')
        .insert({
          title: testDocumentTitle,
          description: "Documento criado para teste do sistema de aprovações",
          status: 'pending_approval',
          author_id: user.id,
          created_by: user.id,
          file_name: 'teste.pdf',
          file_type: 'application/pdf',
          file_size: 1024
        })
        .select()
        .single()

      if (docError) throw docError

      // 2. Criar approval_request
      const { data: approval, error: approvalError } = await supabase
        .from('approval_requests')
        .insert({
          document_id: document.id,
          approver_id: selectedUser,
          status: 'pending',
          step_order: 1,
          comments: testComments || undefined
        })
        .select()
        .single()

      if (approvalError) throw approvalError

      toast({
        title: "Teste criado!",
        description: `Documento "${testDocumentTitle}" enviado para aprovação.`,
      })

      // Recarregar dados
      await fetchDebugData()

    } catch (error) {
      console.error('Erro ao criar teste:', error)
      toast({
        title: "Erro ao criar teste",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
    }
  }

  const approveTestDocument = async (approvalId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('approval_requests')
        .update({
          status: approved ? 'approved' : 'rejected',
          approved_at: new Date().toISOString(),
          comments: approved ? 'Aprovado via debug' : 'Rejeitado via debug'
        })
        .eq('id', approvalId)

      if (error) throw error

      toast({
        title: approved ? "Documento aprovado!" : "Documento rejeitado!",
        description: `Ação executada com sucesso.`,
      })

      // Recarregar dados
      await fetchDebugData()

    } catch (error) {
      console.error('Erro ao processar aprovação:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (user) {
      fetchDebugData()
    }
  }, [user])

  if (!user) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Você precisa estar logado para usar o debug do sistema de aprovações.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Debug - Sistema de Aprovações</h2>
        <Button onClick={fetchDebugData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      {debugData && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Approval Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{debugData.stats.totalApprovalRequests}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{debugData.stats.pendingApprovals}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Docs Pending Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{debugData.stats.docsPendingApproval}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Profiles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{debugData.stats.totalProfiles}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Notificações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{debugData.stats.totalNotifications}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Criar Teste */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Criar Teste de Aprovação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Título do Documento</Label>
            <input
              type="text"
              value={testDocumentTitle}
              onChange={(e) => setTestDocumentTitle(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Nome do documento de teste"
            />
          </div>
          
          <div>
            <Label>Aprovador</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um usuário" />
              </SelectTrigger>
              <SelectContent>
                {debugData?.profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.full_name || profile.email} ({profile.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Comentários (opcional)</Label>
            <Textarea
              value={testComments}
              onChange={(e) => setTestComments(e.target.value)}
              placeholder="Comentários do teste..."
              rows={2}
            />
          </div>
          
          <Button onClick={createTestApproval} disabled={!selectedUser}>
            <Send className="h-4 w-4 mr-2" />
            Criar Teste
          </Button>
        </CardContent>
      </Card>

      {/* Approval Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Approval Requests ({debugData?.approvalRequests.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {debugData?.approvalRequests.length === 0 ? (
            <p className="text-muted-foreground">Nenhum approval request encontrado.</p>
          ) : (
            <div className="space-y-2">
              {debugData?.approvalRequests.map((ar) => (
                <div key={ar.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={ar.status === 'pending' ? 'default' : ar.status === 'approved' ? 'secondary' : 'destructive'}>
                        {ar.status}
                      </Badge>
                      <span className="text-sm">Doc ID: {ar.document_id?.substring(0, 8)}...</span>
                      <span className="text-sm">Aprovador: {ar.approver_id?.substring(0, 8)}...</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Criado: {new Date(ar.created_at).toLocaleString()}
                    </p>
                    {ar.comments && (
                      <p className="text-xs text-blue-600 mt-1">Comentários: {ar.comments}</p>
                    )}
                  </div>
                  
                  {ar.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => approveTestDocument(ar.id, true)}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => approveTestDocument(ar.id, false)}
                      >
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos Recentes ({debugData?.documents.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {debugData?.documents.length === 0 ? (
            <p className="text-muted-foreground">Nenhum documento encontrado.</p>
          ) : (
            <div className="space-y-2">
              {debugData?.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={doc.status === 'pending_approval' ? 'default' : doc.status === 'approved' ? 'secondary' : 'outline'}>
                        {doc.status}
                      </Badge>
                      <span className="font-medium">{doc.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ID: {doc.id.substring(0, 8)}... | Criado: {new Date(doc.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Notificações Recentes ({debugData?.notifications.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {debugData?.notifications.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma notificação encontrada.</p>
          ) : (
            <div className="space-y-2">
              {debugData?.notifications.map((notif) => (
                <div key={notif.id} className="p-3 border rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={notif.type === 'success' ? 'secondary' : notif.type === 'error' ? 'destructive' : 'default'}>
                      {notif.type}
                    </Badge>
                    <span className="font-medium text-sm">{notif.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{notif.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notif.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}