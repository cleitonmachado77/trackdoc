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
        // Verificar se há tokens na URL (vindos do callback) ou se foi confirmado
        const token_hash = searchParams.get('token_hash')
        const type = searchParams.get('type')
        const confirmed = searchParams.get('confirmed')
        const error = searchParams.get('error')
        
        // Se houver erro na URL, exibir mensagem
        if (error) {
          setStatus('error')
          setMessage('Erro ao confirmar email. Tente novamente ou entre em contato com o suporte.')
          return
        }

        // Verificar sessão do usuário (pode vir do callback ou já estar logado)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ [ConfirmEmail] Erro ao verificar sessão:', sessionError)
          setStatus('error')
          setMessage('Erro ao verificar confirmação de email. Tente fazer login novamente.')
          return
        }

        // Se há sessão, processar confirmação
        if (session?.user) {
          setUserEmail(session.user.email || '')
          
          // Verificar se o email já foi confirmado
          if (session.user.email_confirmed_at) {
            console.log('✅ [ConfirmEmail] Email confirmado, ativando usuário automaticamente...')
            
            // Verificar se o usuário já está ativo para evitar processamento duplicado
            const { data: currentProfile } = await supabase
              .from('profiles')
              .select('status, entity_id')
              .eq('id', session.user.id)
              .single()

            // Se já está ativo, apenas mostrar mensagem
            if (currentProfile?.status === 'active') {
              setStatus('already_confirmed')
              setMessage('Seu email já foi confirmado e sua conta já está ativa. Você pode fazer login no sistema.')
              return
            }

            // 🚀 Ativar usuário automaticamente após confirmação de email
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                status: 'active', // Ativar automaticamente
                registration_completed: true,
                permissions: ['read', 'write'],
                email_confirmed_at: new Date().toISOString(),
                activated_at: new Date().toISOString()
              })
              .eq('id', session.user.id)

            if (updateError) {
              console.error('❌ [ConfirmEmail] Erro ao ativar usuário:', updateError)
              setStatus('error')
              setMessage('Email confirmado, mas houve erro ao ativar a conta. Entre em contato com o administrador.')
              return
            }

            // Buscar dados do perfil para atualizar contador da entidade
            const { data: profileData } = await supabase
              .from('profiles')
              .select('entity_id')
              .eq('id', session.user.id)
              .single()

            if (profileData?.entity_id) {
              // Atualizar contador de usuários na entidade
              const { data: entityData } = await supabase
                .from('entities')
                .select('current_users')
                .eq('id', profileData.entity_id)
                .single()

              if (entityData) {
                await supabase
                  .from('entities')
                  .update({ 
                    current_users: (entityData.current_users || 0) + 1,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', profileData.entity_id)
              }

              // Marcar convite como aceito se existir
              await supabase
                .from('entity_invitations')
                .update({
                  status: 'accepted',
                  accepted_at: new Date().toISOString()
                })
                .eq('email', session.user.email)
                .eq('entity_id', profileData.entity_id)
            }

            console.log('✅ [ConfirmEmail] Usuário ativado automaticamente!')
            
            setStatus('success')
            setMessage('Email confirmado e conta ativada com sucesso! Você já pode fazer login no sistema.')
          } else {
            // Email ainda não confirmado
            setStatus('error')
            setMessage('Email ainda não foi confirmado. Verifique sua caixa de entrada e clique no link de confirmação.')
          }
        } else {
          // Não há sessão - usuário precisa clicar no link do email
          setStatus('error')
          setMessage('Sessão não encontrada. Por favor, clique no link de confirmação enviado por email.')
        }
      } catch (error) {
        console.error('❌ [ConfirmEmail] Erro ao processar confirmação:', error)
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
            <div className="mt-4 p-3 bg-green-50 rounded-md">
              <p className="text-sm text-green-800">
                <strong>Conta ativada com sucesso!</strong>
              </p>
              <ul className="text-sm text-green-700 mt-1 space-y-1">
                <li>• Seu email foi confirmado automaticamente</li>
                <li>• Sua conta foi ativada e está pronta para uso</li>
                <li>• Você já pode fazer login no sistema</li>
                <li>• Acesse todas as funcionalidades disponíveis</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}