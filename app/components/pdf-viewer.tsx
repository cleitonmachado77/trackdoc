"use client"

import { useEffect, useState } from "react"
import { Download, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface PDFViewerProps {
  url: string
  scale: number
  rotation: number
  onLoadSuccess?: (numPages: number) => void
  onLoadError?: () => void
}

export default function PDFViewer({ url, scale, rotation, onLoadSuccess, onLoadError }: PDFViewerProps) {
    const [error, setError] = useState<string | null>(null)
    const [signedUrl, setSignedUrl] = useState<string | null>(null)
    const [useGoogleViewer, setUseGoogleViewer] = useState(false)

     useEffect(() => {
     if (!url) {
       return
     }
     
     // Usar URL pública do Supabase Storage
     const generatePublicUrl = () => {
       try {
         console.log('PDFViewer - Gerando URL pública para:', url)
         
         // Construir URL pública do Supabase Storage
         const publicUrl = `https://dhdeyznmncgukexofcxy.supabase.co/storage/v1/object/public/documents/${url}`
         
         console.log('PDFViewer - URL pública gerada:', publicUrl)
         setSignedUrl(publicUrl)
         onLoadSuccess?.(1)
       } catch (error) {
         console.error('PDFViewer - Erro ao gerar URL pública:', error)
         setError('Erro ao carregar PDF')
         onLoadError?.()
       }
     }
     
     generatePublicUrl()
   }, [url, onLoadSuccess, onLoadError])

  const handleDownload = () => {
    if (signedUrl) {
      const link = document.createElement('a')
      link.href = signedUrl
      link.download = 'documento.pdf'
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

     return (
     <div className="w-full h-full flex flex-col">

             {/* Loading indicator - removido para evitar sobreposição */}

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div className="flex justify-center">
          <div
            className="w-full max-w-4xl bg-white shadow-lg rounded"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transformOrigin: 'center top',
              transition: 'transform 0.2s ease-in-out'
            }}
          >
            {/* Visualizador de PDF */}
            {signedUrl ? (
              <div className="w-full h-[800px] border border-gray-300 rounded overflow-hidden">
                {useGoogleViewer ? (
                  /* Google Docs Viewer */
                  <iframe
                    src={`https://docs.google.com/gview?url=${encodeURIComponent(signedUrl)}&embedded=true`}
                    className="w-full h-full"
                    title="Google PDF Viewer"
                    onLoad={() => {
                      console.log('PDFViewer - Google Viewer carregado')
                    }}
                    onError={(e) => {
                      console.error('PDFViewer - Erro ao carregar Google Viewer:', e)
                      setError('Erro ao carregar PDF no Google Viewer')
                    }}
                  />
                ) : (
                  /* Visualizador nativo */
                  <>
                    {/* Tentar primeiro com embed */}
                    <embed
                      src={signedUrl}
                      type="application/pdf"
                      className="w-full h-full"
                      onLoad={() => {
                        console.log('PDFViewer - Embed carregado com sucesso')
                      }}
                      onError={(e) => {
                        console.error('PDFViewer - Erro ao carregar embed:', e)
                        // Fallback para iframe
                        console.log('PDFViewer - Tentando fallback com iframe')
                      }}
                    />
                    
                    {/* Fallback com iframe */}
                    <iframe
                      src={signedUrl}
                      className="w-full h-full hidden"
                      title="PDF Viewer Fallback"
                      onLoad={() => {
                        console.log('PDFViewer - Iframe fallback carregado')
                      }}
                      onError={(e) => {
                        console.error('PDFViewer - Erro ao carregar iframe fallback:', e)
                        setError('Erro ao carregar PDF. Tente usar o Google Viewer.')
                      }}
                    />
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[800px]">
                <div className="text-center">
                  <p className="text-muted-foreground">Carregando PDF...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botões sempre visíveis */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-blue-800 mb-3">
              Se o PDF não aparecer acima, use uma das opções abaixo:
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Baixar PDF
              </Button>
              <Button onClick={handleOpenInNewTab} variant="default" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir em Nova Aba
              </Button>
              <Button 
                onClick={() => setUseGoogleViewer(!useGoogleViewer)} 
                variant="secondary" 
                size="sm"
              >
                {useGoogleViewer ? 'Visualizador Nativo' : 'Google Viewer'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
