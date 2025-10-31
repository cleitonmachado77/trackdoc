"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Loader2, AlertCircle, CheckCircle, Mail } from "lucide-react"
import { useAuth } from '@/lib/hooks/use-auth-final'
import Link from "next/link"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Verificar se há erro na URL
  useEffect(() => {
    const urlError = searchParams.get('error')
    if (urlError === 'invalid_link') {
      setError("Link de recuperação inválido ou expirado. Solicite um novo link.")
    }
  }, [searchParams])

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      setError("Email é obrigatório")
      return
    }

    if (!validateEmail(email)) {
      setError("Digite um email válido")
      return
    }

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const { error } = await resetPassword(email)
      
      if (error) {
        if (error.message.includes("User not found")) {
          setError("Email não encontrado. Verifique se o email está correto ou crie uma nova conta.")
        } else if (error.message.includes("Email rate limit exceeded")) {
          setError("Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.")
        } else {
          setError(error.message)
        }
      } else {
        setSuccess("Email de recuperação enviado com sucesso! Verifique sua caixa de entrada e spam.")
      }
    } catch (err) {
      setError("Erro interno do servidor. Tente novamente mais tarde.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (value: string) => {
    setEmail(value)
    if (error) setError("")
    if (success) setSuccess("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo e Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src="/logo-vertical-preto.png" 
              alt="TrackDoc Logo" 
              className="h-20 w-auto object-contain"
            />
          </div>
        </div>

        {/* Card de Recuperação */}
        <Card className="shadow-lg border border-gray-200 bg-white">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-trackdoc-black">Recuperar Senha</CardTitle>
            <CardDescription className="text-center text-trackdoc-gray">
              Digite seu email para receber as instruções de recuperação
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Campo Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className="h-11"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>

                {/* Mensagem de Erro */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Botão de Enviar */}
                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Enviar Email de Recuperação
                    </>
                  )}
                </Button>
              </form>
            ) : (
              /* Mensagem de Sucesso */
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Próximos passos:</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Verifique sua caixa de entrada</li>
                    <li>• Clique no link recebido por email</li>
                    <li>• Defina sua nova senha</li>
                    <li>• Faça login com a nova senha</li>
                  </ul>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    Não recebeu o email? Verifique sua pasta de spam ou tente novamente.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSuccess("")
                      setEmail("")
                    }}
                    className="w-full"
                  >
                    Tentar Novamente
                  </Button>
                </div>
              </div>
            )}

            {/* Link para Login */}
            <div className="mt-6 text-center">
              <Link href="/login" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para o Login
              </Link>
            </div>

            {/* Link para Registro */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Não tem uma conta?{" "}
                <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                  Crie uma conta gratuita
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 TrackDoc. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  )
}

// Desabilitar prerendering para páginas com autenticação
export const dynamic = 'force-dynamic'