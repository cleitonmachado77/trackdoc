"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createBrowserClient } from '@supabase/ssr'
import dynamic from 'next/dynamic'

import {
  Download,
  ExternalLink,
  FileText,
  Image,
  File,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react"
import { Document as DocumentType } from "@/hooks/use-documents"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Importação direta para teste
import PDFViewer from './pdf-viewer'

// Carregamento dinâmico do PDFViewer para evitar problemas de SSR (comentado para teste)
// const PDFViewer = dynamic(() => import('./pdf-viewer'), {
//   ssr: false,
//   loading: () => {
//     console.log('DocumentViewer - Carregando PDFViewer dinamicamente...')
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="text-center">
//           <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
//           <p className="text-muted-foreground">Carregando visualizador...</p>
//         </div>
//       </div>
//     )
//   }
// })

interface DocumentViewerProps {
  document: DocumentType
  onClose: () => void
}

export function DocumentViewer({ document: doc, onClose }: DocumentViewerProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [generatedDownloadUrl, setGeneratedDownloadUrl] = useState<string | null>(null)

  const isPDF = doc.file_type === "application/pdf"
  const isImage = doc.file_type?.startsWith("image/")
  const isText = doc.file_type?.startsWith("text/")

  // Função para gerar URL de download dinamicamente
  const generateDownloadUrl = async (filePath: string): Promise<string> => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600) // 1 hora de validade
      
      if (error) throw error
      return data.signedUrl
    } catch (error) {
      console.error('Erro ao gerar URL de download:', error)
      throw error
    }
  }

  useEffect(() => {
    console.log('DocumentViewer - Document:', doc)
    console.log('DocumentViewer - File path:', doc.file_path)
    console.log('DocumentViewer - File type:', doc.file_type)
    console.log('DocumentViewer - Download URL:', doc.download_url)
    
    if (doc.file_path) {
      setLoading(true)
      setError(null)
      setIframeLoaded(false)
      
      // Gerar URL de download se não estiver disponível
      if (!doc.download_url) {
        console.log('DocumentViewer - Gerando URL de download dinamicamente...')
        generateDownloadUrl(doc.file_path)
          .then(url => {
            console.log('DocumentViewer - URL gerada com sucesso:', url)
            setGeneratedDownloadUrl(url)
          })
          .catch(err => {
            console.error('DocumentViewer - Erro ao gerar URL:', err)
            setError("Erro ao gerar URL de download")
          })
      }
      
      // Timeout de segurança para evitar loading infinito
      const timeout = setTimeout(() => {
        console.log('DocumentViewer - Timeout reached, stopping loading')
        setLoading(false)
        setError("Tempo limite de carregamento excedido. Tente novamente.")
      }, 10000) // 10 segundos
      
      return () => clearTimeout(timeout)
    } else {
      console.log('DocumentViewer - No file path available')
      setError("Caminho do arquivo não disponível")
    }
  }, [doc.file_path, doc.download_url])

  const handleDownload = async () => {
    if (doc.file_path && doc.file_name) {
      try {
        // Gerar URL de download do Supabase Storage
        const { data, error } = await supabase.storage
          .from('documents')
          .createSignedUrl(doc.file_path, 3600) // 1 hora de validade
        
        if (error) throw error
        
        const link = document.createElement('a')
        link.href = data.signedUrl
        link.download = doc.file_name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } catch (error) {
        console.error('Erro ao baixar arquivo:', error)
        setError('Erro ao baixar arquivo')
      }
    }
  }

  const handleOpenInNewTab = async () => {
    if (doc.file_path) {
      try {
        // Gerar URL de download do Supabase Storage
        const { data, error } = await supabase.storage
          .from('documents')
          .createSignedUrl(doc.file_path, 3600) // 1 hora de validade
        
        if (error) throw error
        
        window.open(data.signedUrl, '_blank')
      } catch (error) {
        console.error('Erro ao abrir arquivo:', error)
        setError('Erro ao abrir arquivo')
      }
    }
  }

  const getFileIcon = () => {
    if (isPDF) return <FileText className="h-8 w-8 text-red-500" />
    if (isImage) return <Image className="h-8 w-8 text-blue-500" />
    return <File className="h-8 w-8 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.25))
  const handleRotate = () => setRotation(prev => (prev + 90) % 360)
  const handlePreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1))
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages))

             const renderPDFViewer = () => {
    
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={scale <= 0.25}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Badge variant="outline">{Math.round(scale * 100)}%</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={scale >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={handleRotate}>
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          <div className="flex justify-center">
            <div
              className="bg-white shadow-lg w-full max-w-4xl"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: 'center top',
                transition: 'transform 0.2s ease-in-out'
              }}
            >
              {console.log('DocumentViewer - Renderizando PDF com iframe simples, file_path:', doc.file_path)}
              
              {/* Implementação simples baseada no ApprovalReviewModal que funciona */}
              <div className="w-full h-[800px] border border-gray-300 rounded overflow-hidden">
                <iframe
                  src={`https://dhdeyznmncgukexofcxy.supabase.co/storage/v1/object/public/documents/${doc.file_path}`}
                  className="w-full h-full"
                  title="Documento PDF"
                  onLoad={() => {
                    console.log('DocumentViewer - Iframe PDF carregado com sucesso')
                    setLoading(false)
                    setIframeLoaded(true)
                  }}
                  onError={() => {
                    console.log('DocumentViewer - Erro ao carregar iframe PDF')
                    setLoading(false)
                    setIframeLoaded(false)
                    setError("Erro ao carregar o PDF. Use as opções de download ou nova aba.")
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderImageViewer = () => (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={scale <= 0.25}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Badge variant="outline">{Math.round(scale * 100)}%</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={scale >= 3}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={handleRotate}>
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div className="flex justify-center">
                                 <img
             src={doc.download_url || generatedDownloadUrl || ''}
             alt={doc.title}
              className="max-w-full h-auto"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease-in-out'
              }}
              onLoad={() => {
                setLoading(false)
              }}
              onError={() => {
                setLoading(false)
                setError("Erro ao carregar a imagem")
              }}
            />
        </div>
      </div>
    </div>
  )

  const renderTextPreview = () => (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-auto bg-gray-50 p-4">
        <Card>
          <CardContent className="p-6">
            <div className="prose max-w-none">
                             <h3>{doc.title}</h3>
               <p className="text-muted-foreground">{doc.description}</p>
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <p className="text-sm text-gray-600">
                  Para visualizar o conteúdo completo deste arquivo, 
                  faça o download ou abra em uma nova aba.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

       const renderPreview = () => {
    // Primeiro verificar se é PDF e tem file_path
    if (isPDF && doc.file_path) {
      console.log('DocumentViewer - renderPreview: PDF detectado, chamando renderPDFViewer')
      // Se o iframe carregou, mostra o PDF mesmo que loading ainda esteja ativo
      if (iframeLoaded || !loading) {
        return renderPDFViewer()
      }
      
      // Se ainda está carregando, mostra o PDF mesmo assim
      return renderPDFViewer()
    }
    
    // Se ainda está carregando e não é PDF, mostra loading genérico
    if (loading && !iframeLoaded) {
       return (
         <div className="flex items-center justify-center h-64">
           <div className="text-center">
             <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
             <p className="text-muted-foreground">Carregando documento...</p>
           </div>
         </div>
       )
     }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <File className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
              <Button variant="outline" onClick={handleOpenInNewTab}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir em Nova Aba
              </Button>
            </div>
          </div>
        </div>
      )
    }

         if (!doc.download_url && !generatedDownloadUrl) {
       return (
         <div className="flex items-center justify-center h-64">
           <div className="text-center">
             <File className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
             <p className="text-muted-foreground mb-4">URL do documento não disponível</p>
             <div className="flex gap-2 justify-center">
               <Button variant="outline" onClick={handleDownload}>
                 <Download className="h-4 w-4 mr-2" />
                 Baixar
               </Button>
             </div>
           </div>
         </div>
       )
     }

    if (isImage) {
      return renderImageViewer()
    }

    return renderTextPreview()
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex ml-16"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Coluna da Esquerda - Visualização */}
        <div className="flex-1 flex flex-col border-r">
          {/* Header da Visualização */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              {getFileIcon()}
                             <div>
                 <h2 className="text-lg font-semibold">{doc.title}</h2>
                 <p className="text-sm text-muted-foreground">
                   {doc.file_name} • {formatFileSize(doc.file_size || 0)}
                 </p>
               </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation()
                  handleDownload()
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenInNewTab()
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Nova Aba
              </Button>
            </div>
          </div>

          {/* Área de Visualização */}
          <div className="flex-1 overflow-hidden">
            {renderPreview()}
          </div>
        </div>

        {/* Coluna da Direita - Detalhes */}
        <div className="w-80 flex flex-col">
          {/* Header dos Detalhes */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Detalhes</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => {
                console.log('Botão de fechar clicado')
                e.stopPropagation()
                e.preventDefault()
                onClose()
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Conteúdo dos Detalhes */}
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-4">
                             <div>
                 <label className="text-sm font-medium text-muted-foreground">Título</label>
                 <p className="text-sm font-medium">{doc.title}</p>
               </div>
               
               <div>
                 <label className="text-sm font-medium text-muted-foreground">Número</label>
                 <p className="text-sm">{doc.document_number}</p>
               </div>
               
               <div>
                 <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                 <p className="text-sm">{doc.document_type?.name || 'N/A'}</p>
               </div>
               
               <div>
                 <label className="text-sm font-medium text-muted-foreground">Categoria</label>
                 <p className="text-sm">{doc.category?.name || 'N/A'}</p>
               </div>
               
               <div>
                 <label className="text-sm font-medium text-muted-foreground">Departamento</label>
                 <p className="text-sm">{doc.department?.name || 'N/A'}</p>
               </div>
               
               <div>
                 <label className="text-sm font-medium text-muted-foreground">Autor</label>
                 <p className="text-sm">{doc.author?.full_name || 'N/A'}</p>
               </div>
               
               <div>
                 <label className="text-sm font-medium text-muted-foreground">Status</label>
                 <div className="mt-1">
                   <Badge variant="outline">{doc.status}</Badge>
                 </div>
               </div>
               
               <div>
                 <label className="text-sm font-medium text-muted-foreground">Visibilidade</label>
                 <div className="mt-1">
                   <Badge variant="outline">
                     {doc.is_public ? 'Público' : 'Privado'}
                   </Badge>
                 </div>
               </div>
               
               <div>
                 <label className="text-sm font-medium text-muted-foreground">Criado em</label>
                 <p className="text-sm">{formatDate(doc.created_at)}</p>
               </div>
               
               <div>
                 <label className="text-sm font-medium text-muted-foreground">Atualizado em</label>
                 <p className="text-sm">{formatDate(doc.updated_at)}</p>
               </div>
               
               {doc.description && (
                 <div>
                   <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                   <p className="text-sm mt-1">{doc.description}</p>
                 </div>
               )}
               
               {doc.tags && doc.tags.length > 0 && (
                 <div>
                   <label className="text-sm font-medium text-muted-foreground">Tags</label>
                   <div className="flex flex-wrap gap-1 mt-1">
                     {doc.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
