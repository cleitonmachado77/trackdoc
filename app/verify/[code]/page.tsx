'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock, FileText, User, Hash } from 'lucide-react'

interface VerificationData {
  id: string
  user_id: string
  document_id: string | null
  arqsign_document_id: string
  status: string
  signature_url: string | null
  verification_code?: string
  verification_url?: string
  qr_code_data?: string
  document_hash?: string
  signature_hash?: string
  created_at: string
  user: {
    email: string
    user_metadata: {
      full_name?: string
    }
  } | null
  document: {
    title: string
    file_path: string
  } | null
}

export default function VerifyDocument() {
  const params = useParams()
  const code = params.code as string
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (code) {
      verifyDocument(code)
    }
  }, [code])

  const verifyDocument = async (verificationCode: string) => {
    try {
      setLoading(true)
      setError(null)

      // Usar função RPC para buscar dados completos
      const { data, error: fetchError } = await supabase
        .rpc('get_document_verification', {
          verification_code_param: verificationCode
        })

      if (fetchError) {
        console.error('Erro RPC:', fetchError)
        // Fallback para consulta simples se RPC falhar
        const { data: signatureData, error: simpleError } = await supabase
          .from('document_signatures')
          .select('*')
          .eq('verification_code', verificationCode)
          .single()

        if (simpleError) {
          if (simpleError.code === 'PGRST116') {
            setError('Código de verificação não encontrado')
          } else {
            setError('Erro ao verificar documento')
          }
          return
        }

        // Dados básicos sem JOINs
        const formattedData: VerificationData = {
          id: signatureData.id,
          user_id: signatureData.user_id,
          document_id: signatureData.document_id,
          arqsign_document_id: signatureData.arqsign_document_id,
          status: signatureData.status,
          signature_url: signatureData.signature_url,
          verification_code: signatureData.verification_code,
          verification_url: signatureData.verification_url,
          qr_code_data: signatureData.qr_code_data,
          document_hash: signatureData.document_hash,
          signature_hash: signatureData.signature_hash,
          created_at: signatureData.created_at,
          user: null,
          document: null
        }
        
        setVerificationData(formattedData)
        return
      }

      if (!data || data.length === 0) {
        setError('Código de verificação não encontrado')
        return
      }

      const signatureData = data[0]
      
      // Converter os dados RPC para o formato esperado
      const formattedData: VerificationData = {
        id: signatureData.id,
        user_id: signatureData.user_id,
        document_id: signatureData.document_id,
        arqsign_document_id: signatureData.arqsign_document_id,
        status: signatureData.status,
        signature_url: signatureData.signature_url,
        verification_code: signatureData.verification_code,
        verification_url: signatureData.verification_url,
        qr_code_data: signatureData.qr_code_data,
        document_hash: signatureData.document_hash,
        signature_hash: signatureData.signature_hash,
        created_at: signatureData.created_at,
        user: {
          email: signatureData.user_email,
          user_metadata: signatureData.user_metadata
        },
        document: {
          title: signatureData.document_title,
          file_path: signatureData.document_file_path
        }
      }
      
      setVerificationData(formattedData)

    } catch (err) {
      console.error('Erro na verificação:', err)
      setError('Erro interno na verificação')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído'
      case 'pending':
        return 'Pendente'
      case 'failed':
        return 'Falhou'
      default:
        return 'Desconhecido'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando documento...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Erro na Verificação</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => {
              if (window.history.length > 1) {
                window.history.back()
              } else {
                window.location.href = '/'
              }
            }}>
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!verificationData) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Documento Não Encontrado</CardTitle>
            <CardDescription>O código de verificação não foi encontrado</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Verificação de Documento</h1>
          <p className="text-gray-600 mt-2">
            Documento assinado digitalmente com código de verificação
          </p>
        </div>

        {/* Status da Assinatura */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(verificationData.status)}
              Status da Assinatura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge className={getStatusColor(verificationData.status)}>
                {getStatusText(verificationData.status)}
              </Badge>
              <span className="text-sm text-gray-500">
                Verificado em: {new Date().toLocaleString('pt-BR')}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Informações do Documento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informações do Documento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Título</label>
                <p className="text-gray-900">{verificationData.document?.title || 'Documento direto'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">ID da Assinatura</label>
                <p className="text-gray-900 font-mono text-sm">{verificationData.arqsign_document_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Código de Verificação</label>
                <p className="text-gray-900 font-mono text-sm">{verificationData.verification_code || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Data de Criação</label>
                <p className="text-gray-900">
                  {new Date(verificationData.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações da Assinatura */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações da Assinatura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Assinado por</label>
                <p className="text-gray-900">
                  {verificationData.user?.user_metadata?.full_name || verificationData.user?.email || 'Usuário'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">E-mail</label>
                <p className="text-gray-900">{verificationData.user?.email || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hashes de Segurança */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Hashes de Segurança
            </CardTitle>
            <CardDescription>
              Códigos únicos para verificar a integridade do documento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Hash do Documento</label>
                <p className="text-gray-900 font-mono text-sm break-all">
                  {verificationData.document_hash || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Hash da Assinatura</label>
                <p className="text-gray-900 font-mono text-sm break-all">
                  {verificationData.signature_hash || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex justify-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => {
              // Tentar voltar no histórico, se não funcionar, ir para a página de assinatura
              if (window.history.length > 1) {
                window.history.back()
              } else {
                window.location.href = '/'
              }
            }}
          >
            Voltar
          </Button>
          {verificationData.signature_url && (
            <Button 
              onClick={() => {
                const downloadUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${verificationData.signature_url}`
                window.open(downloadUrl, '_blank')
              }}
            >
              Baixar Documento Assinado
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
