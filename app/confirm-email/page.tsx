'use client'

import { CompleteEntitySetup } from './complete-entity-setup'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Mail, ArrowLeft } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

export default function ConfirmEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  // Verificar se as variáveis de ambiente estão configuradas
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Configuração Necessária</h1>
          <p className="text-gray-600">As variáveis de ambiente do Supabase não estão configuradas.</p>
        </div>
      </div>
    )
  }
  
  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const token = searchParams.get('token')
      const type = searchParams.get('type')
      const confirmed = searchParams.get('confirmed')
      const errorParam = searchParams.get('error')

      console.log('ConfirmEmailPage: Parâmetros recebidos', {
        token: !!token,
        type,
        confirmed,
        errorParam
      })

      // Se já foi confirmado via callback
      if (confirmed === 'true') {
        console.log('ConfirmEmailPage: Confirmado via callback')
        setIsConfirmed(true)
        setTimeout(() => {
          router.push('/')
        }, 3000)
        return
      }

      // Se houve erro na confirmação
      if (errorParam === 'confirmation_failed') {
        console.log('ConfirmEmailPage: Erro na confirmação')
        setError('Erro ao confirmar email. Tente novamente.')
        setIsChecking(false)
        return
      }

      // Confirmação via token (método alternativo)
      if (token && type === 'signup') {
        try {
          console.log('ConfirmEmailPage: Tentando confirmar via token')
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup'
          })

          if (error) {
            console.error('Erro ao confirmar email:', error)
            setError('Erro ao confirmar email. Tente novamente.')
            setIsChecking(false)
          } else {
            console.log('ConfirmEmailPage: Email confirmado via token')
            setIsConfirmed(true)
            setTimeout(() => {
              router.push('/')
            }, 3000)
          }
        } catch (err) {
          console.error('Erro inesperado:', err)
          setError('Erro inesperado. Tente novamente.')
          setIsChecking(false)
        }
      } else {
        // Verificar se o usuário já está autenticado (confirmação automática)
        console.log('ConfirmEmailPage: Verificando se usuário está autenticado')
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          console.log('ConfirmEmailPage: Usuário já autenticado')
          setIsConfirmed(true)
          // Não redirecionar automaticamente - deixar o CompleteEntitySetup aparecer se necessário
          setIsChecking(false)
        } else {
          console.log('ConfirmEmailPage: Usuário não autenticado, aguardando confirmação')
          setIsChecking(false)
        }
      }
    }

    handleEmailConfirmation()
  }, [searchParams, router, supabase])

  const handleGoToLogin = () => {
    router.push('/login')
  }

  const handleGoBack = () => {
    router.push('/register')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            {isConfirmed ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <Mail className="w-8 h-8 text-blue-600" />
            )}
          </div>
          
          <CardTitle className="text-2xl font-bold text-gray-900">
            {isConfirmed ? 'Email Confirmado!' : isChecking ? 'Verificando...' : 'Aguardando Confirmação'}
          </CardTitle>
          
          <CardDescription className="text-gray-600">
            {isConfirmed 
              ? 'Seu email foi confirmado com sucesso. Redirecionando para o dashboard...'
              : isChecking
              ? 'Verificando status da confirmação...'
              : 'Enviamos um link de confirmação para seu email. Clique no link para ativar sua conta.'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {isConfirmed && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">
                ✅ Email confirmado com sucesso! Você será redirecionado automaticamente.
              </p>
            </div>
          )}

                     {!isConfirmed && !error && !isChecking && (
             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
               <p className="text-blue-800 text-sm">
                 📧 Verifique sua caixa de entrada e clique no link de confirmação.
                 <br />
                 <span className="text-xs text-blue-600 mt-1 block">
                   Não recebeu o email? Verifique sua pasta de spam.
                 </span>
               </p>
             </div>
           )}

           {isChecking && (
             <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
               <p className="text-yellow-800 text-sm">
                 🔍 Verificando status da confirmação...
               </p>
             </div>
           )}

          <div className="flex flex-col space-y-2">
            {isConfirmed ? (
              <Button 
                onClick={handleGoToLogin}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Ir para Login
              </Button>
            ) : (
              <>
                <Button 
                  onClick={handleGoToLogin}
                  variant="outline"
                  className="w-full"
                >
                  Já tenho conta
                </Button>
                <Button 
                  onClick={handleGoBack}
                  variant="ghost"
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Registro
                </Button>
              </>
            )}
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              {isConfirmed 
                ? 'Email confirmado com sucesso!'
                : 'Após confirmar o email, você poderá fazer login normalmente.'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Componente para finalizar configuração da entidade */}
      {isConfirmed && <CompleteEntitySetup />}
    </div>
  )
}
