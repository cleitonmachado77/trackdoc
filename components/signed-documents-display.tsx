'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/hooks/use-auth-final'
import { 
  FileText, 
  Download, 
  Users, 
  Calendar, 
  CheckCircle, 
  Clock,
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

  const downloadDocument = async (document: SignedDocument) => {
    try {
      if (!document.signed_file_path) {
        toast({
          title: "Erro",
          description: "Arquivo assinado não encontrado",
          variant: "destructive"
        })
        return
      }

      console.log('🔄 Iniciando download do documento:', document.document_name)
      console.log('📁 Caminho do arquivo assinado:', document.signed_file_path)

      const response = await fetch(`/api/download-signed-document?filePath=${encodeURIComponent(document.signed_file_path)}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Erro na resposta da API:', response.status, errorText)
        throw new Error(`Erro ao baixar documento: ${response.status}`)
      }
      
      const blob = await response.blob()
      console.log('✅ Blob criado com sucesso, tamanho:', blob.size)
      
      // Usar uma abordagem mais simples e compatível
      const url = URL.createObjectURL(blob)
      
      // Abrir o arquivo em uma nova aba para download
      const newWindow = window.open(url, '_blank')
      
      if (!newWindow) {
        // Fallback: criar link de download
        const link = document.createElement('a')
        link.href = url
        link.download = `assinado_${document.document_name}`
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      
      // Limpar a URL após um tempo
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 1000)
      
      toast({
        title: "Sucesso",
        description: "Documento baixado com sucesso!"
      })
    } catch (error) {
      console.error('❌ Erro ao baixar documento:', error)
      toast({
        title: "Erro",
        description: `Erro ao baixar documento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive"
      })
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">Carregando documentos assinados...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-red-500 mb-4">
            <FileText className="h-12 w-12 mx-auto mb-2" />
            <p className="text-lg font-medium">Erro ao carregar documentos</p>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
          <Button onClick={loadSignedDocuments} variant="outline">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (signedDocuments.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum documento assinado
          </h3>
          <p className="text-gray-500">
            Você ainda não tem documentos assinados por múltiplos usuários.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {signedDocuments.length} documento(s) assinado(s)
        </p>
        <Button onClick={loadSignedDocuments} variant="outline" size="sm">
          Atualizar
        </Button>
      </div>

      <div className="grid gap-3">
        {signedDocuments.map((document) => (
          <div key={document.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">{document.document_name}</h3>
                <div className="flex items-center space-x-3 text-xs text-gray-500">
                  <span className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(document.created_at).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    {document.completed_signatures}/{document.total_signatures}
                  </span>
                  <Badge className={`text-xs ${
                    document.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {document.status === 'completed' ? 'Concluído' : 'Em Andamento'}
                  </Badge>
                </div>
              </div>
            </div>
            
            {document.status === 'completed' && document.signed_file_path && (
              <Button
                onClick={() => downloadDocument(document)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-xs"
              >
                <Download className="h-3 w-3" />
                Baixar
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
