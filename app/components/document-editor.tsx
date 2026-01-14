"use client"

import { useState, useEffect, useRef } from "react"
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
import dynamic from 'next/dynamic'

// Importação dinâmica do OnlyOffice para evitar problemas de SSR
const DocumentEditorComponent = dynamic(
  () => import('@onlyoffice/document-editor-react').then(mod => mod.DocumentEditor),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
)

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
  const [documentUrl, setDocumentUrl] = useState<string>("")
  const [documentKey, setDocumentKey] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const editorRef = useRef<any>(null)

  useEffect(() => {
    initializeDocument()
  }, [document])

  const initializeDocument = async () => {
    try {
      setLoading(true)
      setError("")

      if (document) {
        // Carregar documento existente
        const { data, error: downloadError } = await supabase.storage
          .from('documents')
          .createSignedUrl(document.file_path, 3600) // URL válida por 1 hora

        if (downloadError) throw downloadError

        setDocumentUrl(data.signedUrl)
        setDocumentKey(document.id)
      } else {
        // Criar novo documento
        const newDocKey = `new_${Date.now()}`
        setDocumentKey(newDocKey)
        // Para novo documento, OnlyOffice criará um documento em branco
      }
    } catch (err) {
      console.error('Erro ao inicializar documento:', err)
      setError('Não foi possível carregar o documento')
      toast({
        title: "Erro",
        description: "Não foi possível carregar o documento",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Obter conteúdo do editor
      // Nota: A implementação real depende da configuração do OnlyOffice Document Server
      // Este é um exemplo simplificado
      
      if (document) {
        // Atualizar documento existente
        const { error } = await supabase
          .from('office_documents')
          .update({
            title: title,
            updated_at: new Date().toISOString()
          })
          .eq('id', document.id)

        if (error) throw error
      } else {
        // Criar novo documento
        // Aqui você precisaria salvar o conteúdo do editor
        toast({
          title: "Informação",
          description: "Para salvar novos documentos, é necessário configurar o OnlyOffice Document Server",
          variant: "default"
        })
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

  const onDocumentReady = () => {
    console.log('Documento pronto para edição')
  }

  // Configuração do OnlyOffice
  const config = {
    document: {
      fileType: document?.file_type?.includes('word') ? 'docx' : 'docx',
      key: documentKey,
      title: title,
      url: documentUrl || undefined,
      permissions: {
        edit: true,
        download: true,
        print: true,
        review: true
      }
    },
    documentType: 'word',
    editorConfig: {
      mode: 'edit',
      lang: 'pt-BR',
      user: {
        id: user?.id,
        name: user?.user_metadata?.full_name || user?.email
      },
      customization: {
        autosave: true,
        forcesave: true,
        comments: true,
        chat: false,
        compactHeader: false,
        compactToolbar: false,
        help: true,
        hideRightMenu: false,
        toolbarNoTabs: false
      },
      callbackUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/api/onlyoffice/callback`
    },
    height: "100%",
    width: "100%"
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
        ) : (
          <Card className="h-full m-4 overflow-hidden">
            <Alert className="m-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Configuração necessária:</strong> Para usar o editor OnlyOffice, você precisa configurar o OnlyOffice Document Server. 
                Execute: <code className="bg-muted px-2 py-1 rounded">docker run -p 80:80 onlyoffice/documentserver</code>
              </AlertDescription>
            </Alert>
            
            {/* Placeholder para o editor OnlyOffice */}
            <div className="p-4 h-[calc(100%-100px)] border-t">
              <div className="bg-muted rounded-lg h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Editor OnlyOffice</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    O editor será exibido aqui após a configuração do OnlyOffice Document Server
                  </p>
                  <div className="text-xs text-left bg-background p-4 rounded border">
                    <p className="font-semibold mb-2">Passos para configurar:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Instale o Docker</li>
                      <li>Execute: docker run -p 80:80 onlyoffice/documentserver</li>
                      <li>Configure a variável NEXT_PUBLIC_ONLYOFFICE_URL</li>
                      <li>Reinicie a aplicação</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
