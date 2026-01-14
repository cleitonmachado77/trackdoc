"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  FileText, 
  Plus, 
  Upload, 
  FolderOpen, 
  Edit, 
  Trash2, 
  Download,
  AlertCircle,
  Loader2,
  Search,
  File
} from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useAuth } from "@/lib/hooks/use-auth-final"
import { useToast } from "@/hooks/use-toast"
import DocumentEditor from "../components/document-editor"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Document {
  id: string
  title: string
  file_path: string
  file_type: string
  created_at: string
  updated_at: string
}

export default function OfficePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (user) {
      loadDocuments()
    }
  }, [user])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('office_documents')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Erro ao carregar documentos:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os documentos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    setIsCreatingNew(true)
    setSelectedDocument(null)
  }

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.oasis.opendocument.text'
    ]
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Por favor, envie apenas arquivos Word (.docx, .doc) ou ODT",
        variant: "destructive"
      })
      return
    }

    try {
      setUploading(true)
      
      // Upload do arquivo para o Supabase Storage
      const fileName = `${user?.id}/${Date.now()}_${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Criar registro no banco de dados
      const { data: docData, error: docError } = await supabase
        .from('office_documents')
        .insert({
          user_id: user?.id,
          title: file.name.replace(/\.[^/.]+$/, ""),
          file_path: fileName,
          file_type: file.type,
          file_size: file.size,
          entity_id: user?.user_metadata?.entity_id
        })
        .select()
        .single()

      if (docError) throw docError

      toast({
        title: "Sucesso",
        description: "Documento enviado com sucesso"
      })

      loadDocuments()
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      toast({
        title: "Erro",
        description: "Não foi possível fazer upload do documento",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return

    try {
      const { error } = await supabase
        .from('office_documents')
        .delete()
        .eq('id', docId)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Documento excluído com sucesso"
      })

      loadDocuments()
      if (selectedDocument?.id === docId) {
        setSelectedDocument(null)
      }
    } catch (error) {
      console.error('Erro ao excluir documento:', error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o documento",
        variant: "destructive"
      })
    }
  }

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.file_path)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = `${doc.title}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao baixar documento:', error)
      toast({
        title: "Erro",
        description: "Não foi possível baixar o documento",
        variant: "destructive"
      })
    }
  }

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (selectedDocument || isCreatingNew) {
    return (
      <DocumentEditor
        document={selectedDocument}
        onClose={() => {
          setSelectedDocument(null)
          setIsCreatingNew(false)
          loadDocuments()
        }}
      />
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Editor de Documentos</h1>
        <p className="text-muted-foreground">
          Crie e edite documentos Word diretamente na plataforma
        </p>
      </div>

      {/* Ações principais */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Button onClick={handleCreateNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Criar Novo Documento
        </Button>
        
        <label htmlFor="upload-doc" className="cursor-pointer">
          <Button 
            variant="outline" 
            className="flex items-center gap-2 w-full sm:w-auto"
            disabled={uploading}
            asChild
          >
            <span>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Enviar Documento
                </>
              )}
            </span>
          </Button>
          <input
            id="upload-doc"
            type="file"
            accept=".doc,.docx,.odt"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {/* Busca */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar documentos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lista de documentos */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {searchQuery 
                ? "Nenhum documento encontrado com esse nome" 
                : "Nenhum documento ainda. Crie um novo ou envie um existente."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                    <CardTitle className="text-lg truncate">{doc.title}</CardTitle>
                  </div>
                </div>
                <CardDescription className="text-xs">
                  Atualizado em {new Date(doc.updated_at).toLocaleDateString('pt-BR')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setSelectedDocument(doc)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadDocument(doc)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteDocument(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Informações */}
      <Alert className="mt-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Dica:</strong> Você pode criar novos documentos do zero ou enviar documentos Word existentes para editar na plataforma.
        </AlertDescription>
      </Alert>
    </div>
  )
}
