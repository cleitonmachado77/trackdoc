"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, FileText, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from '@/lib/hooks/use-auth-final'
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn, user } = useAuth()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Verificar se há mensagem de sucesso na URL
  useEffect(() => {
    const message = searchParams.get('message')
    if (message === 'password_updated') {
      setSuccess("Senha redefinida com sucesso! Faça login com sua nova senha.")
    }
  }, [searchParams])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError("")
  }

  const validateForm = () => {
    if (!formData.email) {
      setError("Email é obrigatório")
      return false
    }
    if (!formData.email.includes("@")) {
      setError("Email inválido")
      return false
    }
    if (!formData.password) {
      setError("Senha é obrigatória")
      return false
    }
    if (formData.password.length < 6) {
      setError("Senha deve ter pelo menos 6 caracteres")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setError("")

    try {
      const { error } = await signIn(formData.email, formData.password)

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setError("Email ou senha incorretos")
        } else if (error.message.includes("Email not confirmed")) {
          setError("Email não confirmado. Verifique sua caixa de entrada e clique no link de confirmação.")
        } else {
          setError(error.message)
        }
      } else {
        setSuccess("Login realizado com sucesso!")
        
        // Redirecionar diretamente para o dashboard após login bem-sucedido
        console.log('Login bem-sucedido, redirecionando para dashboard...')
        router.push("/")
      }
    } catch (err) {
      setError("Erro interno do servidor. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 🎨 Logo e Header - Novo Design */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src="/logo-vertical-preto.png" 
              alt="TrackDoc Logo" 
              className="h-20 w-auto object-contain"
            />
          </div>
        </div>

        {/* 🎨 Card de Login - Novo Design */}
        <Card className="shadow-lg border border-gray-200 bg-white">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-trackdoc-black">Entrar na sua conta</CardTitle>
            <CardDescription className="text-center text-trackdoc-gray">Digite suas credenciais para acessar o sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="h-11"
                  disabled={isLoading}
                />
              </div>

              {/* Campo Senha */}
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="h-11 pr-10"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Opções */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) => handleInputChange("rememberMe", checked as boolean)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="remember" className="text-sm font-normal">
                    Lembrar de mim
                  </Label>
                </div>
                <Link href="/forgot-password">
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 font-normal text-blue-600 hover:text-blue-700"
                    disabled={isLoading}
                  >
                    Esqueci minha senha
                  </Button>
                </Link>
              </div>

              {/* Mensagens de Erro/Sucesso */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
              )}

              {/* Botão de Login */}
              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            {/* Link para Registro */}
            <div className="mt-6 text-center">
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
          <div className="flex justify-center space-x-4 mt-2">
            <Button variant="link" className="px-0 text-gray-500 hover:text-gray-700">
              Termos de Uso
            </Button>
            <Button variant="link" className="px-0 text-gray-500 hover:text-gray-700">
              Política de Privacidade
            </Button>
            <Button variant="link" className="px-0 text-gray-500 hover:text-gray-700">
              Suporte
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}


// Desabilitar prerendering para páginas com autenticação
export const dynamic = 'force-dynamic'
