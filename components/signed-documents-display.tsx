'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/hooks/use-auth-final'
import { 
  FileText, 
  Users, 
  Calendar, 
  Eye
} from 'lucide-react'

interface SignedDocument {
  id: string
  document_id?: string
  document_name: string
  document_path?: string
  signed_file_path?: string
  requester_id: string
  requester_name: string
  total_signatures: number
  completed_signatures: number
  status: string
  created_at: string
  completed_at?: string
  signatures: Array<{
    userName: string
    userEmail: string
    timestamp: string
  }>
}

export function SignedDocumentsDisplay() {
  const [signedDocuments, setSignedDocuments] = useState<SignedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const { toast } = useToast()
  const { session } = useAuth()

  useEffect(() => {
    loadSignedDocuments()
  }, [])

  const loadSignedDocuments = async () => {
    try {
      setLoading(true)
      const headers: HeadersInit = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch('/api/signed-documents', {
        headers,
      })
      
      if (!response.ok) {
        throw new Error('Erro ao carregar documentos assinados')
      }
      
      const data = await response.json()
      const documents: SignedDocument[] = data.documents || []

      if (documents.length === 0) {
        setSignedDocuments([])
        return
      }

      if (!data.documentsWithStatus) {
        console.warn('Resposta da API não contém documentos com status detalhado. Estrutura atual:', data)
      }

      setSignedDocuments(documents)
    } catch (error) {
      console.error('Erro ao carregar documentos assinados:', error)
      setError('Erro ao carregar documentos assinados')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 text-white">Concluído</Badge>
      case 'ready_for_signature':
        return <Badge className="bg-blue-500 text-white">Pronto para Assinatura</Badge>
      case 'in_progress':
        return <Badge className="bg-yellow-500 text-white">Em Andamento</Badge>
      case 'cancelled':
        return <Badge className="bg-red-500 text-white">Cancelado</Badge>
      default:
        return <Badge className="bg-gray-500 text-white">Pendente</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 md:h-64">
        <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-blue-600"></div>
        <span className="ml-2 md:ml-3 text-sm md:text-lg">Carregando...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-4 md:p-8 text-center">
          <div className="text-red-500 mb-4">
            <FileText className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-2" />
            <p className="text-sm md:text-lg font-medium">Erro ao carregar documentos</p>
            <p className="text-xs md:text-sm text-gray-600">{error}</p>
          </div>
          <Button onClick={loadSignedDocuments} variant="outline" size="sm">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (signedDocuments.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 md:p-8 text-center">
          <FileText className="h-8 w-8 md:h-12 md:w-12 text-gray-400 mx-auto mb-3 md:mb-4" />
          <h3 className="text-sm md:text-lg font-medium text-gray-900 mb-1 md:mb-2">
            Nenhum documento assinado
          </h3>
          <p className="text-xs md:text-sm text-gray-500">
            Você ainda não tem documentos assinados.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Determinar quais documentos mostrar
  const documentsToShow = showAll ? signedDocuments : signedDocuments.slice(0, 5)
  const hasMoreDocuments = signedDocuments.length > 5

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs md:text-sm text-gray-600">
          {showAll 
            ? `${signedDocuments.length} documento(s)` 
            : `${Math.min(5, signedDocuments.length)} de ${signedDocuments.length}`
          }
        </p>
        <Button onClick={loadSignedDocuments} variant="outline" size="sm" className="h-8 text-xs md:text-sm">
          Atualizar
        </Button>
      </div>

      <div className="grid gap-2 md:gap-3">
        {documentsToShow.map((document) => (
          <div key={document.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-2">
            <div className="flex items-start sm:items-center space-x-2 md:space-x-3 min-w-0">
              <div className="p-1.5 md:p-2 bg-green-100 rounded-lg flex-shrink-0">
                <FileText className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-gray-900 text-xs md:text-sm truncate">{document.document_name}</h3>
                <div className="flex items-center flex-wrap gap-2 md:gap-3 text-[10px] md:text-xs text-gray-500">
                  <span className="flex items-center">
                    <Calendar className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" />
                    {new Date(document.created_at).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="flex items-center">
                    <Users className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" />
                    {document.completed_signatures}/{document.total_signatures}
                  </span>
                  <Badge className={`text-[10px] md:text-xs px-1.5 py-0.5 ${
                    document.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {document.status === 'completed' ? 'OK' : 'Andamento'}
                  </Badge>
                </div>
              </div>
            </div>
            
            {document.status === 'completed' && document.signed_file_path && (
              <Button
                onClick={async () => {
                  try {
                    const fileName = document.signed_file_path
                    
                    // Se já é uma URL completa, usar diretamente
                    if (fileName.startsWith('http')) {
                      window.open(fileName, '_blank')
                      return
                    }

                    // Tentar obter URL assinada do Supabase via API
                    const response = await fetch('/api/download-signed-document', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` })
                      },
                      body: JSON.stringify({ 
                        filePath: fileName,
                        documentId: document.document_id || document.id
                      })
                    })

                    if (response.ok) {
                      const data = await response.json()
                      if (data.url) {
                        window.open(data.url, '_blank')
                        return
                      }
                    }

                    // Fallback: tentar URLs públicas em diferentes buckets
                    const buckets = ['documents', 'signed-documents', 'document-signatures']
                    let opened = false

                    for (const bucket of buckets) {
                      const url = `https://dhdeyznmncgukexofcxy.supabase.co/storage/v1/object/public/${bucket}/${fileName}`
                      const testWindow = window.open(url, '_blank')
                      if (testWindow && !testWindow.closed) {
                        opened = true
                        break
                      }
                    }

                    if (!opened) {
                      toast({
                        title: "Erro",
                        description: "Não foi possível abrir o documento. Ele pode ter sido movido ou excluído.",
                        variant: "destructive"
                      })
                    }
                  } catch (err) {
                    console.error('Erro ao abrir documento:', err)
                    toast({
                      title: "Erro",
                      description: "Erro ao tentar abrir o documento.",
                      variant: "destructive"
                    })
                  }
                }}
                variant="outline"
                size="sm"
                className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 h-8 w-full sm:w-auto"
                title="Visualizar documento"
              >
                <Eye className="h-3 w-3 mr-1 sm:mr-0" />
                <span className="sm:hidden">Ver</span>
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Botão para mostrar mais/menos documentos */}
      {hasMoreDocuments && (
        <div className="flex justify-center pt-2 md:pt-4">
          <Button
            onClick={() => setShowAll(!showAll)}
            variant="outline"
            size="sm"
            className="w-full max-w-xs text-xs md:text-sm"
          >
            {showAll 
              ? `Mostrar 5 recentes` 
              : `Ver todos (${signedDocuments.length})`
            }
          </Button>
        </div>
      )}
    </div>
  )
}
