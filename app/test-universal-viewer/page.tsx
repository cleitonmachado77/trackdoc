"use client"

import { useState } from 'react'
import UniversalDocumentViewer from '@/app/components/universal-document-viewer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileSpreadsheet, FileText, FileImage, FileType, Presentation } from 'lucide-react'

const testDocuments = [
  {
    id: 'pdf',
    name: 'Documento PDF',
    description: 'Teste de visualização de PDF',
    url: 'test/sample.pdf',
    type: 'application/pdf',
    fileName: 'sample.pdf',
    icon: FileType,
    color: 'text-red-500'
  },
  {
    id: 'excel',
    name: 'Planilha Excel',
    description: 'Teste de visualização de Excel',
    url: 'test/sample.xlsx',
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileName: 'sample.xlsx',
    icon: FileSpreadsheet,
    color: 'text-green-500'
  },
  {
    id: 'word',
    name: 'Documento Word',
    description: 'Teste de visualização de Word',
    url: 'test/sample.docx',
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileName: 'sample.docx',
    icon: FileText,
    color: 'text-blue-500'
  },
  {
    id: 'powerpoint',
    name: 'Apresentação PowerPoint',
    description: 'Teste de visualização de PowerPoint',
    url: 'test/sample.pptx',
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    fileName: 'sample.pptx',
    icon: Presentation,
    color: 'text-orange-500'
  },
  {
    id: 'image',
    name: 'Imagem JPG',
    description: 'Teste de visualização de imagem',
    url: 'test/sample.jpg',
    type: 'image/jpeg',
    fileName: 'sample.jpg',
    icon: FileImage,
    color: 'text-purple-500'
  }
]

export default function TestUniversalViewerPage() {
  const [selectedDoc, setSelectedDoc] = useState(testDocuments[0])
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.25))
  const handleRotate = () => setRotation(prev => (prev + 90) % 360)
  const handleReset = () => {
    setScale(1)
    setRotation(0)
  }

  const handleDocumentSelect = (doc: typeof testDocuments[0]) => {
    setSelectedDoc(doc)
    setLoadStatus('loading')
    setScale(1)
    setRotation(0)
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Teste de Visualizador Universal</h1>
        <p className="text-muted-foreground">
          Teste a visualização de diferentes formatos de documentos (PDF, Excel, Word, PowerPoint, Imagens)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        {/* Seletor de Documentos */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-lg font-semibold mb-3">Selecione um Documento</h2>
          {testDocuments.map((doc) => {
            const Icon = doc.icon
            return (
              <Card
                key={doc.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedDoc.id === doc.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleDocumentSelect(doc)}
              >
                <CardHeader className="p-4">
                  <div className="flex items-start gap-3">
                    <Icon className={`h-6 w-6 ${doc.color} shrink-0`} />
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm mb-1">{doc.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {doc.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )
          })}

          {/* Controles */}
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm mb-3">Controles</CardTitle>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Zoom:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomOut}
                      disabled={scale <= 0.25}
                    >
                      -
                    </Button>
                    <Badge variant="outline" className="text-xs min-w-[60px] justify-center">
                      {Math.round(scale * 100)}%
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomIn}
                      disabled={scale >= 3}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Rotação:</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs min-w-[60px] justify-center">
                      {rotation}°
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRotate}
                    >
                      ↻
                    </Button>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleReset}
                  className="w-full"
                >
                  Resetar
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm mb-2">Status</CardTitle>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Documento:</span>
                  <Badge variant="outline">{selectedDoc.fileName}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Tipo:</span>
                  <Badge variant="outline" className="text-xs">
                    {selectedDoc.type.split('/')[1]}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Carregamento:</span>
                  <Badge
                    variant={
                      loadStatus === 'success'
                        ? 'default'
                        : loadStatus === 'error'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {loadStatus === 'idle' && 'Aguardando'}
                    {loadStatus === 'loading' && 'Carregando...'}
                    {loadStatus === 'success' && 'Sucesso'}
                    {loadStatus === 'error' && 'Erro'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Visualizador */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedDoc.name}</CardTitle>
                  <CardDescription>{selectedDoc.description}</CardDescription>
                </div>
                <Badge variant="outline">{selectedDoc.fileName}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[calc(100vh-300px)] min-h-[600px]">
                <UniversalDocumentViewer
                  url={selectedDoc.url}
                  fileType={selectedDoc.type}
                  fileName={selectedDoc.fileName}
                  scale={scale}
                  rotation={rotation}
                  onLoadSuccess={() => {
                    console.log('✅ Documento carregado:', selectedDoc.name)
                    setLoadStatus('success')
                  }}
                  onLoadError={() => {
                    console.error('❌ Erro ao carregar:', selectedDoc.name)
                    setLoadStatus('error')
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Informações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">ℹ️ Informações</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>
            <strong>Nota:</strong> Esta é uma página de teste. Os arquivos de exemplo devem estar
            disponíveis no bucket do Supabase Storage em <code>test/</code>.
          </p>
          <p>
            <strong>Formatos suportados:</strong> PDF, Excel (.xlsx, .xls), Word (.docx, .doc),
            PowerPoint (.pptx, .ppt), Imagens (.jpg, .png, .gif, .webp)
          </p>
          <p>
            <strong>Visualizadores:</strong> PDFs usam visualizador nativo com fallback para Google Docs.
            Excel, Word e PowerPoint usam Google Docs Viewer. Imagens usam visualizador nativo.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
