"use client"

import { useEffect, useState } from "react"
import { Download, ExternalLink, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface UniversalDocumentViewerProps {
  url: string
  fileType: string
  fileName?: string
  scale: number
  rotation: number
  onLoadSuccess?: (numPages: number) => void
  onLoadError?: () => void
}

type ViewerMode = 'native' | 'google' | 'office' | 'image' | 'microsoft'

export default function UniversalDocumentViewer({ 
  url, 
  fileType,
  fileName = '',
  scale, 
  rotation, 
  onLoadSuccess, 
  onLoadError 
}: UniversalDocumentViewerProps) {
  const [error, setError] = useState<string | null>(null)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [viewerMode, setViewerMode] = useState<ViewerMode>('native')
  const [isLoading, setIsLoading] = useState(true)

  // Detectar tipo de arquivo e escolher visualizador apropriado
  const detectViewerMode = (type: string, name: string): ViewerMode => {
    const lowerName = name.toLowerCase()
    const lowerType = type.toLowerCase()

    // Imagens - visualização direta
    if (lowerType.startsWith('image/')) {
      return 'image'
    }

    // Excel - usar Microsoft Office Online Viewer
    if (
      lowerType.includes('spreadsheet') ||
      lowerType.includes('excel') ||
      lowerName.endsWith('.xlsx') ||
      lowerName.endsWith('.xls') ||
      lowerName.endsWith('.csv')
    ) {
      return 'microsoft' // Microsoft Office Online Viewer funciona melhor com Excel
    }

    // Word
    if (
      lowerType.includes('word') ||
      lowerType.includes('document') ||
      lowerName.endsWith('.docx') ||
      lowerName.endsWith('.doc')
    ) {
      return 'google' // Google Docs Viewer suporta Word
    }

    // PowerPoint
    if (
      lowerType.includes('presentation') ||
      lowerType.includes('powerpoint') ||
      lowerName.endsWith('.pptx') ||
      lowerName.endsWith('.ppt')
    ) {
      return 'google' // Google Docs Viewer suporta PowerPoint
    }

    // PDF - tentar nativo primeiro
    if (lowerType === 'application/pdf' || lowerName.endsWith('.pdf')) {
      return 'native'
    }

    // Fallback para Google Viewer
    return 'google'
  }

  useEffect(() => {
    if (!url) {
      return
    }

    const generatePublicUrl = () => {
      try {
        console.log('UniversalDocumentViewer - Gerando URL pública para:', url)
        
        // Construir URL pública do Supabase Storage
        const publicUrl = `https://dhdeyznmncgukexofcxy.supabase.co/storage/v1/object/public/documents/${url}`
        
        console.log('UniversalDocumentViewer - URL pública gerada:', publicUrl)
        setSignedUrl(publicUrl)
        
        // Detectar modo de visualização
        const mode = detectViewerMode(fileType, fileName)
        console.log('UniversalDocumentViewer - Modo detectado:', mode)
        setViewerMode(mode)
        
        setIsLoading(false)
        onLoadSuccess?.(1)
      } catch (error) {
        console.error('UniversalDocumentViewer - Erro ao gerar URL pública:', error)
        setError('Erro ao carregar documento')
        setIsLoading(false)
        onLoadError?.()
      }
    }
    
    generatePublicUrl()
  }, [url, fileType, fileName, onLoadSuccess, onLoadError])

  const handleDownload = () => {
    if (signedUrl) {
      const link = document.createElement('a')
      link.href = signedUrl
      link.download = fileName || 'documento'
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleOpenInNewTab = () => {
    if (signedUrl) {
      window.open(signedUrl, '_blank')
    }
  }

  const toggleViewerMode = () => {
    const lowerName = fileName.toLowerCase()
    const isExcel = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')
    
    if (isExcel) {
      // Para Excel, alternar entre Microsoft e Google
      if (viewerMode === 'microsoft') {
        setViewerMode('google')
      } else {
        setViewerMode('microsoft')
      }
    } else if (viewerMode === 'native') {
      setViewerMode('google')
    } else if (viewerMode === 'google') {
      setViewerMode('native')
    }
  }

  const getFileTypeLabel = () => {
    const lowerName = fileName.toLowerCase()
    if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) return 'Excel'
    if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) return 'Word'
    if (lowerName.endsWith('.pptx') || lowerName.endsWith('.ppt')) return 'PowerPoint'
    if (lowerName.endsWith('.pdf')) return 'PDF'
    if (fileType.startsWith('image/')) return 'Imagem'
    return 'Documento'
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Baixar
            </Button>
            <Button onClick={handleOpenInNewTab} variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Nova Aba
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const renderViewer = () => {
    if (!signedUrl) {
      return (
        <div className="flex items-center justify-center h-[800px]">
          <div className="text-center">
            <p className="text-muted-foreground">Carregando documento...</p>
          </div>
        </div>
      )
    }

    // Visualizador de imagens
    if (viewerMode === 'image') {
      return (
        <div className="flex items-center justify-center h-[800px] bg-gray-50">
          <img
            src={signedUrl}
            alt={fileName}
            className="max-w-full max-h-full object-contain"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease-in-out'
            }}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setError('Erro ao carregar imagem')
              setIsLoading(false)
            }}
          />
        </div>
      )
    }

    // Microsoft Office Online Viewer (melhor para Excel)
    if (viewerMode === 'microsoft') {
      return (
        <iframe
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(signedUrl)}`}
          className="w-full h-[800px]"
          title="Microsoft Office Viewer"
          onLoad={() => {
            console.log('UniversalDocumentViewer - Microsoft Office Viewer carregado')
            setIsLoading(false)
          }}
          onError={(e) => {
            console.error('UniversalDocumentViewer - Erro ao carregar Microsoft Office Viewer:', e)
            // Tentar Google Viewer como fallback
            console.log('UniversalDocumentViewer - Tentando Google Viewer como fallback')
            setViewerMode('google')
          }}
        />
      )
    }

    // Google Docs Viewer (Word, PowerPoint, etc)
    if (viewerMode === 'google') {
      return (
        <iframe
          src={`https://docs.google.com/gview?url=${encodeURIComponent(signedUrl)}&embedded=true`}
          className="w-full h-[800px]"
          title="Google Docs Viewer"
          onLoad={() => {
            console.log('UniversalDocumentViewer - Google Viewer carregado')
            setIsLoading(false)
          }}
          onError={(e) => {
            console.error('UniversalDocumentViewer - Erro ao carregar Google Viewer:', e)
            setError('Erro ao carregar documento no Google Viewer')
            setIsLoading(false)
          }}
        />
      )
    }

    // Visualizador nativo (PDF)
    if (viewerMode === 'native') {
      return (
        <>
          <embed
            src={signedUrl}
            type="application/pdf"
            className="w-full h-[800px]"
            onLoad={() => {
              console.log('UniversalDocumentViewer - Embed carregado')
              setIsLoading(false)
            }}
            onError={(e) => {
              console.error('UniversalDocumentViewer - Erro ao carregar embed:', e)
              // Tentar Google Viewer como fallback
              setViewerMode('google')
            }}
          />
        </>
      )
    }

    return null
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Área de visualização */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div className="flex justify-center">
          <div
            className="w-full max-w-4xl bg-white shadow-lg rounded"
            style={{
              transform: viewerMode !== 'image' ? `scale(${scale}) rotate(${rotation}deg)` : undefined,
              transformOrigin: 'center top',
              transition: 'transform 0.2s ease-in-out'
            }}
          >
            {renderViewer()}
          </div>
        </div>

        {/* Barra de informações e ações */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Badge variant="outline">{getFileTypeLabel()}</Badge>
              {isLoading && (
                <Badge variant="secondary">Carregando...</Badge>
              )}
            </div>
            
            <p className="text-sm text-blue-800 mb-3">
              {viewerMode === 'microsoft' && 'Visualizando com Microsoft Office Online'}
              {viewerMode === 'google' && 'Visualizando com Google Docs Viewer'}
              {viewerMode === 'native' && 'Visualizando com visualizador nativo'}
              {viewerMode === 'image' && 'Visualizando imagem'}
            </p>
            
            {/* Mensagem de ajuda para Excel */}
            {getFileTypeLabel() === 'Excel' && (
              <p className="text-xs text-blue-700 mb-3 max-w-2xl mx-auto">
                💡 Se o arquivo não carregar, tente alternar o visualizador ou faça o download para abrir no Excel.
              </p>
            )}
            
            <div className="flex gap-3 justify-center flex-wrap">
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
              <Button onClick={handleOpenInNewTab} variant="default" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir em Nova Aba
              </Button>
              
              {/* Botão para alternar visualizador */}
              {(() => {
                const lowerName = fileName.toLowerCase()
                const isExcel = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')
                const isPdf = fileType === 'application/pdf'
                
                if (isExcel && (viewerMode === 'microsoft' || viewerMode === 'google')) {
                  return (
                    <Button 
                      onClick={toggleViewerMode} 
                      variant="secondary" 
                      size="sm"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {viewerMode === 'microsoft' ? 'Tentar Google Viewer' : 'Tentar Microsoft Viewer'}
                    </Button>
                  )
                }
                
                if (isPdf && (viewerMode === 'native' || viewerMode === 'google')) {
                  return (
                    <Button 
                      onClick={toggleViewerMode} 
                      variant="secondary" 
                      size="sm"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {viewerMode === 'google' ? 'Visualizador Nativo' : 'Google Viewer'}
                    </Button>
                  )
                }
                
                return null
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
