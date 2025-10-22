"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, Mail, ArrowRight } from 'lucide-react'

export default function ConfirmEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_confirmed'>('loading')
  const [message, setMessage] = useState('')
  const [userEmail, setUserEmail] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Verificar se há tokens na URL (vindos do callback)
        const token_hash = searchParams.get('token_hash')
        const type = searchParams.get('type')
        
        if (token_hash && type === 'signup') {
          // Verificar sessão do usuário
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          
          if (sessionError) {
            console.error('Erro ao verificar sessão:', sessionError)
            setStatus('error')
            setMessage('Erro ao verificar confirmação de email')
            return
          }

          if (session?.user) {
            setUserEmail(session.user.email || '')
            
            // Verificar se o email já foi confirmado
            if (session.user.email_confirmed_at) {
              // Atualizar perfil para ativo se ainda estiver pending_email
              const { error: updateError } = await supabase
                .from('profiles')
                .update({
                  status: 'pending_email', // Manter como pending_email para admin aprovar
                  email_confirmed_at: new Date().toISOString()
                })
                .eq('id', session.user.id)
                .eq('status', 'pending_email')

              if (updateError) {
                console.error('Erro ao atualizar perfil:', updateError)
              }

              setStatus('success')
              setMessage('Email confirmado com sucesso! Aguarde a aprovação do administrador para acessar o sistema.')
            } else {
              setStatus('error')
              setMessage('Email ainda não foi confirmado. Verifique sua caixa de entrada.')
            }
          } else {
            setStatus('error')
            setMessage('Sessão não encontrada. Tente fazer login novamente.')
          }
        } else {
          // Verificar se o usuário já está logado e confirmado
          const { data: { user } } = await supabase.auth.getUser()
          
          if (user) {
            setUserEmail(user.email || '')
            
            if (user.email_confirmed_at) {
              setStatus('already_confirmed')
              setMessage('Seu email já foi confirmado anteriormente.')
            } else {
              setStatus('error')
              setMessage('Email ainda não foi confirmado. Verifique sua caixa de entrada e clique no link de confirmação.')
            }
          } else {
            setStatus('error')
            setMessage('Usuário não encontrado. Faça login para confirmar seu email.')
          }
        }
      } catch (error) {
        console.error('Erro ao processar confirmação:', error)
        setStatus('error')
        setMessage('Erro interno. Tente novamente mais tarde.')
      }
    }

    handleEmailConfirmation()
  }, [searchParams, supabase])

  const handleGoToLogin = () => {
    router.push('/login')
  }

  const handleResendEmail = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail
      })

      if (error) {
        setMessage('Erro ao reenviar email: ' + error.message)
      } else {
        setMessage('Email de confirmação reenviado! Verifique sua caixa de entrada.')
      }
    } catch (error) {
      setMessage('Erro ao reenviar email. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'loading' && (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            )}
            {status === 'success' && (
              <CheckCircle className="h-12 w-12 text-green-600" />
            )}
            {(status === 'error' || status === 'already_confirmed') && (
              <AlertCircle className="h-12 w-12 text-orange-600" />
            )}
          </div>
          <CardTitle>
            {status === 'loading' && 'Verificando confirmação...'}
            {status === 'success' && 'Email Confirmado!'}
            {status === 'error' && 'Confirmação Pendente'}
            {status === 'already_confirmed' && 'Email Já Confirmado'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert className={
            status === 'success' ? 'border-green-200 bg-green-50' :
            status === 'error' ? 'border-orange-200 bg-orange-50' :
            'border-blue-200 bg-blue-50'
          }>
            <Mail className="h-4 w-4" />
            <AlertDescription className={
              status === 'success' ? 'text-green-700' :
              status === 'error' ? 'text-orange-700' :
              'text-blue-700'
            }>
              {message}
            </AlertDescription>
          </Alert>

          {userEmail && (
            <div className="text-sm text-gray-600 text-center">
              <strong>Email:</strong> {userEmail}
            </div>
          )}

          <div className="space-y-2">
            {status === 'success' && (
              <Button 
                onClick={handleGoToLogin} 
                className="w-full"
              >
                Ir para Login
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {status === 'error' && userEmail && (
              <>
                <Button 
                  onClick={handleResendEmail} 
                  variant="outline"
                  className="w-full"
                >
                  Reenviar Email de Confirmação
                  <Mail className="h-4 w-4 ml-2" />
                </Button>
                <Button 
                  onClick={handleGoToLogin} 
                  variant="ghost"
                  className="w-full"
                >
                  Voltar ao Login
                </Button>
              </>
            )}

            {(status === 'already_confirmed' || (status === 'error' && !userEmail)) && (
              <Button 
                onClick={handleGoToLogin} 
                className="w-full"
              >
                Ir para Login
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>

          {status === 'success' && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Próximos passos:</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• Seu email foi confirmado com sucesso</li>
                <li>• Aguarde a aprovação do administrador</li>
                <li>• Você receberá uma notificação quando for aprovado</li>
                <li>• Após aprovação, poderá fazer login normalmente</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}