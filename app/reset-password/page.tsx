"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle, Shield, ArrowLeft } from "lucide-react"
import { useAuth } from '@/lib/hooks/use-auth-final'
import { createBrowserClient } from '@supabase/ssr'
import Link from "next/link"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { updatePassword } = useAuth()
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isValidToken, setIsValidToken] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Verificar se o usuário chegou através do link de email
  useEffect(() => {
    const validateResetToken = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Erro ao verificar sessão:', error)
          setError("Link de recuperação inválido ou expirado. Solicite um novo link.")
          setIsValidToken(false)
        } else if (session?.user) {
          // Usuário tem uma sessão válida, pode redefinir a senha
          setIsValidToken(true)
        } else {
          // Verificar se há parâmetros de recuperação na URL
          const access_token = searchParams.get('access_token')
          const refresh_token = searchParams.get('refresh_token')
          const type = searchParams.get('type')
          
          if (access_token && refresh_token && type === 'recovery') {
            // Definir a sessão com os tokens de recuperação
            const { error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token
            })
            
            if (sessionError) {
              console.error('Erro ao definir sessão:', sessionError)
              setError("Link de recuperação inválido ou expirado. Solicite um novo link.")
              setIsValidToken(false)
            } else {
              setIsValidToken(true)
            }
          } else {
            setError("Acesso negado. Use o link enviado por email para redefinir sua senha.")
            setIsValidToken(false)
          }
        }
      } catch (err) {
        console.error('Erro ao validar token:', err)
        setError("Erro ao validar link de recuperação. Tente novamente.")
        setIsValidToken(false)
      } finally {
        setIsValidating(false)
      }
    }

    validateResetToken()
  }, [searchParams, supabase])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError("")
  }

  const validatePassword = (password: string) => {
    const errors = []
    
    if (password.length < 8) {
      errors.push("pelo menos 8 caracteres")
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("uma letra maiúscula")
    }
    if (!/[a-z]/.test(password)) {
      errors.push("uma letra minúscula")
    }
    if (!/\d/.test(password)) {
      errors.push("um número")
    }
    
    return errors
  }

  const validateForm = () => {
    if (!formData.password) {
      setError("Senha é obrigatória")
      return false
    }
    
    const passwordErrors = validatePassword(formData.password)
    if (passwordErrors.length > 0) {
      setError(`A senha deve conter: ${passwordErrors.join(", ")}`)
      return false
    }
    
    if (!formData.confirmPassword) {
      setError("Confirmação de senha é obrigatória")
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem")
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
      const { error } = await updatePassword(formData.password)

      if (error) {
        if (error.message.includes("Password should be at least")) {
          setError("A senha deve ter pelo menos 8 caracteres")
        } else if (error.message.includes("Unable to validate JWT")) {
          setError("Sessão expirada. Solicite um novo link de recuperação.")
        } else if (error.message.includes("Invalid token")) {
          setError("Token inválido. Solicite um novo link de recuperação.")
        } else {
          setError(error.message)
        }
      } else {
        setSuccess("Senha redefinida com sucesso! Redirecionando para o login...")
        
        // Fazer logout para limpar a sessão de recuperação
        await supabase.auth.signOut()
        
        // Redirecionar para o login após 3 segundos
        setTimeout(() => {
          router.push("/login?message=password_updated")
        }, 3000)
      }
    } catch (err) {
      console.error('Erro ao redefinir senha:', err)
      setError("Erro interno do servidor. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  // Mostrar loading enquanto valida o token
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border border-gray-200 bg-white">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Validando link de recuperação...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Mostrar erro se o token não for válido
  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img 
                src="/logo-vertical-preto.png" 
                alt="TrackDoc Logo" 
                className="h-20 w-auto object-contain"
              />
            </div>
          </div>

          <Card className="shadow-lg border border-gray-200 bg-white">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold text-center text-red-600">Acesso Negado</CardTitle>
              <CardDescription className="text-center text-trackdoc-gray">
                Link de recuperação inválido ou expirado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Link href="/forgot-password">
                  <Button className="w-full">
                    Solicitar Novo Link
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para o Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
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

        {/* Card de Redefinição */}
        <Card className="shadow-lg border border-gray-200 bg-white">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-center text-trackdoc-black">Redefinir Senha</CardTitle>
            <CardDescription className="text-center text-trackdoc-gray">
              Crie uma nova senha segura para sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Requisitos de Senha */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">Requisitos da senha:</p>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li className={`flex items-center ${formData.password.length >= 8 ? 'text-green-600' : ''}`}>
                    <span className="mr-2">{formData.password.length >= 8 ? '✓' : '•'}</span>
                    Pelo menos 8 caracteres
                  </li>
                  <li className={`flex items-center ${/[A-Z]/.test(formData.password) ? 'text-green-600' : ''}`}>
                    <span className="mr-2">{/[A-Z]/.test(formData.password) ? '✓' : '•'}</span>
                    Uma letra maiúscula
                  </li>
                  <li className={`flex items-center ${/[a-z]/.test(formData.password) ? 'text-green-600' : ''}`}>
                    <span className="mr-2">{/[a-z]/.test(formData.password) ? '✓' : '•'}</span>
                    Uma letra minúscula
                  </li>
                  <li className={`flex items-center ${/\d/.test(formData.password) ? 'text-green-600' : ''}`}>
                    <span className="mr-2">{/\d/.test(formData.password) ? '✓' : '•'}</span>
                    Um número
                  </li>
                </ul>
              </div>

              {/* Campo Nova Senha */}
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua nova senha"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="h-11 pr-10"
                    disabled={isLoading}
                    autoFocus
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

              {/* Campo Confirmar Senha */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirme sua nova senha"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className="h-11 pr-10"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
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

              {/* Botão de Redefinir */}
              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redefinindo...
                  </>
                ) : (
                  "Redefinir Senha"
                )}
              </Button>
            </form>

            {/* Links de Navegação */}
            <div className="mt-6 space-y-2">
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para o Login
                </Button>
              </Link>
              
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Problemas com o link? 
                  <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700 ml-1">
                    Solicite um novo
                  </Link>
                </p>
              </div>
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
