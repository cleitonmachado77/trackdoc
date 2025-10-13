"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getFileTypeInfo, getFileIconWithBackground } from "@/lib/utils/file-icons"

const fileExamples = [
  { type: 'application/pdf', name: 'documento.pdf' },
  { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', name: 'relatorio.docx' },
  { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', name: 'planilha.xlsx' },
  { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', name: 'apresentacao.pptx' },
  { type: 'image/jpeg', name: 'foto.jpg' },
  { type: 'video/mp4', name: 'video.mp4' },
  { type: 'audio/mpeg', name: 'musica.mp3' },
  { type: 'application/zip', name: 'arquivo.zip' },
  { type: 'text/javascript', name: 'script.js' },
  { type: 'text/plain', name: 'texto.txt' },
  { type: 'application/octet-stream', name: 'arquivo.bin' },
]

export function FileIconsDemo() {
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Ícones de Tipos de Arquivo</CardTitle>
        <p className="text-sm text-muted-foreground">
          Demonstração dos ícones coloridos para diferentes tipos de documentos
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fileExamples.map((example, index) => {
            const fileInfo = getFileTypeInfo(example.type, example.name)
            const IconComponent = fileInfo.icon
            
            return (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                {getFileIconWithBackground(example.type, example.name, "h-6 w-6", "p-2")}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{example.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {fileInfo.name}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {example.type.split('/')[1]}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Cores por Tipo:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-600 rounded"></div>
              <span>PDF</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded"></div>
              <span>Word</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-600 rounded"></div>
              <span>Excel</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-600 rounded"></div>
              <span>PowerPoint</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-600 rounded"></div>
              <span>Imagem</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-pink-600 rounded"></div>
              <span>Vídeo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-600 rounded"></div>
              <span>Áudio</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-600 rounded"></div>
              <span>Outros</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}