"use client"

import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Lock, Shield, AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ForcePasswordChangeProps {
  user: {
    id: string
    email: string
    full_name?: string
  }
  onPasswordChanged: () => void
}

export default function ForcePasswordChange({ user, onPasswordChanged }: ForcePasswordChangeProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChanging, setIsChanging] = useState(false)
  const [error, setError] = useState("")

  const validatePassword = (password: string) => {
    const errors = []
    
    if (password.length < 8) {
      errors.push("Mínimo 8 caracteres")
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push("Uma letra maiúscula")
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push("Uma letra minúscula")
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push("Um número")
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Um caractere especial")
    }
    
    return errors
  }

  const handlePasswordChange = async () => {
    setError("")
    
    // Validações
    if (!newPassword || !confirmPassword) {
      setError("Preencha todos os campos")
      return
    }
    
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem")
      return
    }
    
    const passwordErrors = validatePassword(newPassword)
    if (passwordErrors.length > 0) {
      setError(`A senha deve ter: ${passwordErrors.join(", ")}`)
      return
    }
    
    setIsChanging(true)
    
    try {
      console.log('🔐 [ForcePasswordChange] Alterando senha do usuário:', user.id)
      
      // Tentar alterar via sessão do cliente primeiro
      const { data: sessionData } = await supabase.auth.getSession()
      
      if (sessionData.session) {
        // Sessão disponível - usar método padrão
        console.log('🔐 [ForcePasswordChange] Usando sessão do cliente')
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword
        })
        
        if (passwordError) {
          console.error('❌ [ForcePasswordChange] Erro ao alterar senha via cliente:', passwordError)
          throw passwordError
        }
        
        // Atualizar perfil
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            force_password_change: false,
            first_login_completed: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
        
        if (profileError) {
          console.warn('⚠️ [ForcePasswordChange] Erro ao atualizar perfil:', profileError)
        }
      } else {
        // Sem sessão - usar API com service role
        console.log('🔐 [ForcePasswordChange] Sem sessão, usando API admin')
        const response = await fetch('/api/admin/update-user-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            new_password: newPassword
          })
        })
        
        const result = await response.json()
        
        if (!response.ok) {
          throw new Error(result.error || 'Erro ao alterar senha')
        }
      }
      
      console.log('✅ [ForcePasswordChange] Senha alterada com sucesso')
      
      toast({
        title: "Senha alterada com sucesso!",
        description: "Sua senha foi alterada. Você pode continuar usando o sistema.",
      })
      
      // Chamar callback para atualizar o estado do componente pai
      onPasswordChanged()
      
    } catch (error: any) {
      console.error('❌ [ForcePasswordChange] Erro geral:', error)
      setError(error.message || "Erro ao alterar senha. Tente novamente.")
    } finally {
      setIsChanging(false)
    }
  }

  const passwordErrors = validatePassword(newPassword)
  const isPasswordValid = passwordErrors.length === 0 && newPassword.length > 0

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle className="text-xl font-semibold">Alteração de Senha Obrigatória</CardTitle>
          <CardDescription className="text-sm text-gray-600">
            Olá, <strong>{user.full_name || user.email}</strong>!<br />
            Por segurança, você deve alterar sua senha antes de continuar.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite sua nova senha"
                disabled={isChanging}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isChanging}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            {/* Indicadores de validação da senha */}
            {newPassword && (
              <div className="space-y-1 text-xs">
                <div className={`flex items-center gap-2 ${newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className="h-3 w-3" />
                  <span>Mínimo 8 caracteres</span>
                </div>
                <div className={`flex items-center gap-2 ${/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className="h-3 w-3" />
                  <span>Uma letra maiúscula</span>
                </div>
                <div className={`flex items-center gap-2 ${/[a-z]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className="h-3 w-3" />
                  <span>Uma letra minúscula</span>
                </div>
                <div className={`flex items-center gap-2 ${/[0-9]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className="h-3 w-3" />
                  <span>Um número</span>
                </div>
                <div className={`flex items-center gap-2 ${/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className="h-3 w-3" />
                  <span>Um caractere especial</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua nova senha"
                disabled={isChanging}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isChanging}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            {confirmPassword && (
              <div className={`flex items-center gap-2 text-xs ${
                newPassword === confirmPassword ? 'text-green-600' : 'text-red-500'
              }`}>
                <CheckCircle className="h-3 w-3" />
                <span>
                  {newPassword === confirmPassword ? 'Senhas coincidem' : 'Senhas não coincidem'}
                </span>
              </div>
            )}
          </div>
          
          <Button
            onClick={handlePasswordChange}
            disabled={!isPasswordValid || newPassword !== confirmPassword || isChanging}
            className="w-full"
          >
            {isChanging ? (
              <>
                <Lock className="h-4 w-4 mr-2 animate-spin" />
                Alterando Senha...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Alterar Senha
              </>
            )}
          </Button>
          
          <div className="text-xs text-gray-500 text-center">
            Esta alteração é obrigatória por questões de segurança.<br />
            Após alterar, você poderá usar o sistema normalmente.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}