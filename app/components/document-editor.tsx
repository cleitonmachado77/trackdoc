"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  AlertCircle,
  Download,
  FileText
} from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useAuth } from "@/lib/hooks/use-auth-final"
import { useToast } from "@/hooks/use-toast"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Document {
  id: string
  title: string
  file_path: string
  file_type: string
}

interface DocumentEditorProps {
  document: Document | null
  onClose: () => void
}

export default function DocumentEditor({ document, onClose }: DocumentEditorProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [title, setTitle] = useState(document?.title || "Novo Documento")
  const [saving, setSaving] = useState(false)
  const [editorUrl, setEditorUrl] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    if (document) {
      setTitle(document.title)
    }
    initializeDocument()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document])

  const initializeDocument = async () => {
    try {
      setLoading(true)
      setError("")

      // Criar sessão no Zoho Office Integrator
      const response = await fetch('/api/zoho/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: document?.id || null,
          documentName: title,
          isNewDocument: !document
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar sessão do editor')
      }

      const data = await response.json()
      
      if (!data.success || !data.editorUrl) {
        throw new Error('Resposta inválida do servidor')
      }

      setEditorUrl(data.editorUrl)
    } catch (err) {
      console.error('Erro ao inicializar documento:', err)
      setError(err instanceof Error ? err.message : 'Não foi possível carregar o documento')
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Não foi possível carregar o documento",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // O salvamento é feito automaticamente pelo Zoho através do callback
      // Aqui apenas atualizamos o título se necessário
      if (document) {
        const { error } = await supabase
          .from('office_documents')
          .update({
            title: title,
            updated_at: new Date().toISOString()
          })
          .eq('id', document.id)

        if (error) throw error
      }

      toast({
        title: "Sucesso",
        description: "Documento salvo com sucesso"
      })
    } catch (error) {
      console.error('Erro ao salvar documento:', error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar o documento",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-4">
          <Button variant="ghost" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <div className="container mx-auto max-w-7xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <FileText className="h-5 w-5 text-primary flex-shrink-0" />
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="max-w-md"
                placeholder="Nome do documento"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              size="sm"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando editor...</p>
            </div>
          </div>
        ) : error ? (
          <Card className="h-full m-4 overflow-hidden">
            <Alert variant="destructive" className="m-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Erro ao carregar editor:</strong> {error}
              </AlertDescription>
            </Alert>
          </Card>
        ) : editorUrl ? (
          <div className="h-full w-full">
            <iframe
              src={editorUrl}
              className="w-full h-full border-0"
              title="Editor de Documentos Zoho"
              allow="clipboard-read; clipboard-write"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ) : (
          <Card className="h-full m-4 overflow-hidden">
            <div className="p-4 h-full flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Preparando editor...</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
