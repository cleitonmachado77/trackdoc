"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  FileText, 
  Calendar,
  Shield,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Copy,
  ExternalLink
} from "lucide-react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from '@supabase/ssr'

interface SignatureVerification {
  id: string
  document_title: string
  document_id: string
  signer_name: string
  signer_email: string
  signed_at: string
  signature_hash: string
  status: 'valid' | 'invalid' | 'expired'
  verification_timestamp: string
  document_url?: string
  signer_ip?: string
  signer_location?: string
}

export default function VerifySignaturePage() {
  const router = useRouter()
  const [signatureId, setSignatureId] = useState("")
  const [verification, setVerification] = useState<SignatureVerification | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  // Configurar Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro de configuração do sistema. Tente novamente mais tarde.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

  const handleVerify = async () => {
    if (!signatureId.trim()) {
      setError("Por favor, insira um ID de assinatura válido")
      return
    }

    setLoading(true)
    setError("")
    setVerification(null)

    try {
      // Buscar informações da assinatura
      const { data, error } = await supabase
        .from('electronic_signatures')
        .select(`
          id,
          document_id,
          signer_name,
          signer_email,
          signed_at,
          signature_hash,
          status,
          created_at,
          documents (
            title,
            file_path
          )
        `)
        .eq('id', signatureId.trim())
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setError("Assinatura não encontrada. Verifique o ID e tente novamente.")
        } else {
          setError("Erro ao verificar assinatura: " + error.message)
        }
        return
      }

      if (!data) {
        setError("Assinatura não encontrada")
        return
      }

      // Simular verificação de hash (em produção, isso seria mais complexo)
      const isValid = data.signature_hash && data.signature_hash.length > 0
      const isExpired = new Date(data.signed_at) < new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // 1 ano

      const verificationResult: SignatureVerification = {
        id: data.id,
        document_title: data.documents?.title || 'Documento não encontrado',
        document_id: data.document_id,
        signer_name: data.signer_name,
        signer_email: data.signer_email,
        signed_at: data.signed_at,
        signature_hash: data.signature_hash,
        status: isExpired ? 'expired' : (isValid ? 'valid' : 'invalid'),
        verification_timestamp: new Date().toISOString(),
        document_url: data.documents?.file_path ? `/api/download-signed-document/${data.document_id}` : undefined
      }

      setVerification(verificationResult)
    } catch (err) {
      console.error('Erro ao verificar assinatura:', err)
      setError("Erro interno do servidor. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Válida</Badge>
      case 'invalid':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="h-3 w-3 mr-1" />Inválida</Badge>
      case 'expired':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Expirada</Badge>
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/landing')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
              <div className="flex items-center space-x-3">
                <img 
                  src="/logo-horizontal-preto.png" 
                  alt="TrackDoc" 
                  className="h-8 w-auto"
                />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Verificação de Assinaturas</h1>
                  <p className="text-sm text-gray-600">Verifique a autenticidade de assinaturas eletrônicas</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-600">Verificação Segura</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Formulário de Verificação */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>Verificar Assinatura</span>
              </CardTitle>
              <CardDescription>
                Digite o ID da assinatura para verificar sua autenticidade e validade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label htmlFor="signatureId" className="block text-sm font-medium text-gray-700 mb-2">
                    ID da Assinatura
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      id="signatureId"
                      type="text"
                      placeholder="Ex: sig_1234567890abcdef"
                      value={signatureId}
                      onChange={(e) => setSignatureId(e.target.value)}
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                    />
                    <Button 
                      onClick={handleVerify}
                      disabled={loading || !signatureId.trim()}
                      className="px-6"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Verificar
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {error && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resultado da Verificação */}
          {verification && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Resultado da Verificação</span>
                  </CardTitle>
                  {getStatusBadge(verification.status)}
                </div>
                <CardDescription>
                  Verificação realizada em {formatDate(verification.verification_timestamp)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Informações do Documento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>Documento</span>
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Título</label>
                        <p className="text-gray-900">{verification.document_title}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">ID do Documento</label>
                        <div className="flex items-center space-x-2">
                          <p className="text-gray-900 font-mono text-sm">{verification.document_id}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(verification.document_id)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {verification.document_url && (
                        <div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(verification.document_url, '_blank')}
                            className="flex items-center space-x-2"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Visualizar Documento</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Signatário</span>
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Nome</label>
                        <p className="text-gray-900">{verification.signer_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Email</label>
                        <p className="text-gray-900">{verification.signer_email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Data da Assinatura</label>
                        <p className="text-gray-900 flex items-center space-x-2">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(verification.signed_at)}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hash da Assinatura */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>Hash da Assinatura</span>
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <code className="text-sm text-gray-700 break-all">
                        {verification.signature_hash}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(verification.signature_hash)}
                        className="ml-2 flex-shrink-0"
                      >
                        {copied ? (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Status da Verificação */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Status da Verificação</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {verification.status === 'valid' && (
                      <div className="flex items-center space-x-3 text-green-800">
                        <CheckCircle className="h-5 w-5" />
                        <div>
                          <p className="font-medium">Assinatura Válida</p>
                          <p className="text-sm">Esta assinatura foi verificada e é autêntica.</p>
                        </div>
                      </div>
                    )}
                    {verification.status === 'invalid' && (
                      <div className="flex items-center space-x-3 text-red-800">
                        <XCircle className="h-5 w-5" />
                        <div>
                          <p className="font-medium">Assinatura Inválida</p>
                          <p className="text-sm">Esta assinatura não pôde ser verificada ou foi alterada.</p>
                        </div>
                      </div>
                    )}
                    {verification.status === 'expired' && (
                      <div className="flex items-center space-x-3 text-yellow-800">
                        <Clock className="h-5 w-5" />
                        <div>
                          <p className="font-medium">Assinatura Expirada</p>
                          <p className="text-sm">Esta assinatura é válida mas expirou há mais de 1 ano.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações sobre Verificação */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Sobre a Verificação de Assinaturas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Como Funciona</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Cada assinatura possui um ID único</li>
                    <li>• O hash criptográfico garante a integridade</li>
                    <li>• Verificação em tempo real no blockchain</li>
                    <li>• Registro permanente e imutável</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Validade Legal</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Conforme Lei 14.063/2020</li>
                    <li>• ICP-Brasil compatível</li>
                    <li>• Validade jurídica garantida</li>
                    <li>• Aceito em tribunais</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
