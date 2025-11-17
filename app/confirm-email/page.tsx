"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, ArrowRight, Loader2 } from 'lucide-react'

export default function ConfirmEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Verificar se veio do callback com confirmação
        const confirmed = searchParams.get('confirmed')
        const activated = searchParams.get('activated')
        const errorFromUrl = searchParams.get('error')
        
        if (errorFromUrl) {
          setStatus('error')
          setMessage('Erro ao confirmar email. Tente fazer login ou entre em contato com o suporte.')
          return
        }
        
        if (confirmed === 'true') {
          if (activated === 'true') {
            setStatus('success')
            setMessage('Email confirmado com sucesso! Você já pode fazer login.')
            
            // Redirecionar para login após 3 segundos
            setTimeout(() => {
              router.push('/login?confirmed=true')
            }, 3000)
          } else {
            // Tentar ativar o usuário
            const { data: { session } } = await supabase.auth.getSession()
            
            if (session?.user) {
              try {
                const response = await fetch('/api/activate-entity-user', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ user_id: session.user.id })
                })
                
                if (response.ok) {
                  setStatus('success')
                  setMessage('Email confirmado com sucesso! Você já pode fazer login.')
                  
                  // Fazer logout e redirecionar para login
                  await supabase.auth.signOut()
                  setTimeout(() => {
                    router.push('/login?confirmed=true')
                  }, 3000)
                } else {
                  setStatus('error')
                  setMessage('Erro ao ativar conta. Tente fazer login.')
                }
              } catch (err) {
                setStatus('error')
                setMessage('Erro ao ativar conta. Tente fazer login.')
              }
            } else {
              setStatus('success')
              setMessage('Email confirmado! Você já pode fazer login.')
              setTimeout(() => {
                router.push('/login?confirmed=true')
              }, 3000)
            }
          }
        } else {
          setStatus('error')
          setMessage('Link de confirmação inválido ou expirado.')
        }
        
      } catch (error) {
        console.error('Erro na confirmação:', error)
        setStatus('error')
        setMessage('Erro ao processar confirmação. Tente fazer login.')
      }
    }

    handleEmailConfirmation()
  }, [searchParams, supabase, router])

  const handleGoToLogin = () => {
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'loading' && (
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-12 w-12 text-green-600" />
            )}
            {status === 'error' && (
              <AlertCircle className="h-12 w-12 text-red-600" />
            )}
          </div>
          <CardTitle>
            {status === 'loading' && 'Verificando confirmação...'}
            {status === 'success' && 'Email Confirmado!'}
            {status === 'error' && 'Erro na Confirmação'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert className={
            status === 'success' ? 'border-green-200 bg-green-50' :
            status === 'error' ? 'border-red-200 bg-red-50' :
            'border-blue-200 bg-blue-50'
          }>
            <AlertDescription className={
              status === 'success' ? 'text-green-700' :
              status === 'error' ? 'text-red-700' :
              'text-blue-700'
            }>
              {message}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Button 
              onClick={handleGoToLogin} 
              className="w-full"
            >
              {status === 'success' ? 'Ir para Login' : 'Voltar ao Login'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {status === 'success' && (
            <div className="mt-4 p-3 bg-green-50 rounded-md">
              <p className="text-sm text-green-800 text-center">
                Você será redirecionado automaticamente em alguns segundos.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
