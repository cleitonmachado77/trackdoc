"use client"

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/lib/hooks/use-auth-final'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertCircle, Building2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PendingEntityData {
  userId: string
  entityName: string
  entityLegalName: string
  entityCnpj: string
  entityPhone: string
  selectedPlanId: string
  userEmail: string
}

export function CompleteEntitySetup() {
  const { user } = useAuth()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [pendingData, setPendingData] = useState<PendingEntityData | null>(null)

  // Verificar se as variáveis de ambiente estão configuradas
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }
  
  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

  useEffect(() => {
    // Verificar se há dados pendentes de entidade
    const pendingEntityData = localStorage.getItem('pendingEntityData')
    if (pendingEntityData) {
      try {
        const data = JSON.parse(pendingEntityData) as PendingEntityData
        setPendingData(data)
      } catch (error) {
        console.error('Erro ao parsear dados pendentes:', error)
      }
    } else if (user) {
      // Se não há dados no localStorage, mas o usuário é entity_admin, criar dados padrão
      checkIfNeedsEntitySetup()
    }
  }, [user])

  const checkIfNeedsEntitySetup = async () => {
    if (!user) return

    try {
      // Verificar se o usuário precisa de configuração de entidade
      const { data: profile } = await supabase
        .from('profiles')
        .select('registration_type, entity_id, entity_role, email, full_name')
        .eq('id', user.id)
        .single()

      if (profile?.registration_type === 'entity_admin' && !profile.entity_id) {
        // Criar dados padrão para o setup
        const defaultData: PendingEntityData = {
          userId: user.id,
          entityName: `Empresa de ${profile.full_name}`,
          entityLegalName: `${profile.full_name} ME`,
          entityCnpj: '',
          entityPhone: '',
          selectedPlanId: '', // Será preenchido automaticamente
          userEmail: profile.email
        }
        setPendingData(defaultData)
      }
    } catch (error) {
      console.error('Erro ao verificar necessidade de setup:', error)
    }
  }

  const createEntity = async () => {
    if (!user || !pendingData) return

    setIsProcessing(true)
    setError("")

    try {
      // 1. Buscar plano padrão se não especificado
      let planId = pendingData.selectedPlanId
      if (!planId) {
        const { data: plans } = await supabase
          .from('plans')
          .select('id')
          .eq('is_active', true)
          .order('price_monthly', { ascending: true })
          .limit(1)

        if (plans && plans.length > 0) {
          planId = plans[0].id
        } else {
          throw new Error('Nenhum plano ativo encontrado')
        }
      }

      // 2. Criar entidade
      const { data: entityData, error: entityError } = await supabase
        .from('entities')
        .insert([{
          name: pendingData.entityName || `Empresa de ${user.email}`,
          legal_name: pendingData.entityLegalName || `${user.email} ME`,
          cnpj: pendingData.entityCnpj || null,
          email: pendingData.userEmail,
          phone: pendingData.entityPhone || null,
          subscription_plan_id: planId,
          max_users: 10,
          admin_user_id: user.id,
          status: 'active',
          type: 'company'
        }])
        .select()
        .single()

      if (entityError) {
        throw new Error(`Erro ao criar entidade: ${entityError.message}`)
      }

      // 3. Atualizar perfil com entity_id e marcar como completo
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({
          entity_id: entityData.id,
          entity_role: 'admin',
          role: 'admin',
          registration_completed: true
        })
        .eq('id', user.id)

      if (updateProfileError) {
        throw new Error(`Erro ao vincular perfil à entidade: ${updateProfileError.message}`)
      }

      // 4. Criar assinatura da entidade
      const { error: subscriptionError } = await supabase
        .from('entity_subscriptions')
        .insert([{
          entity_id: entityData.id,
          plan_id: planId,
          status: 'active',
          is_trial: true,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }])

      if (subscriptionError) {
        console.warn('Erro ao criar assinatura (não crítico):', subscriptionError.message)
      }

      // 5. Limpar dados pendentes
      localStorage.removeItem('pendingEntityData')

      setSuccess("Entidade criada com sucesso! Redirecionando para o dashboard...")
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push('/')
      }, 2000)

    } catch (err: any) {
      console.error('Erro ao criar entidade:', err)
      setError(err.message || "Erro interno do servidor. Tente novamente.")
    } finally {
      setIsProcessing(false)
    }
  }

  const skipEntitySetup = () => {
    localStorage.removeItem('pendingEntityData')
    router.push('/')
  }

  // Debug: sempre mostrar se o usuário é entity_admin
  if (!pendingData && user) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-500" />
            Debug: Verificando Configuração
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Usuário ID: {user.id}<br/>
            Dados pendentes: {pendingData ? 'Sim' : 'Não'}<br/>
            LocalStorage: {localStorage.getItem('pendingEntityData') ? 'Tem dados' : 'Vazio'}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!pendingData) {
    return null
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-500" />
          Finalizar Configuração da Entidade
        </CardTitle>
        <CardDescription>
          Seu email foi confirmado! Agora vamos criar sua entidade.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm space-y-2 bg-gray-50 p-4 rounded-lg">
          <p><strong>Entidade:</strong> {pendingData.entityName}</p>
          <p><strong>Razão Social:</strong> {pendingData.entityLegalName}</p>
          <p><strong>CNPJ:</strong> {pendingData.entityCnpj}</p>
          <p><strong>Email:</strong> {pendingData.userEmail}</p>
        </div>

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

        <div className="space-y-2">
          <Button
            onClick={createEntity}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando entidade...
              </>
            ) : (
              <>
                <Building2 className="h-4 w-4 mr-2" />
                Criar Entidade
              </>
            )}
          </Button>

          <Button
            onClick={skipEntitySetup}
            disabled={isProcessing}
            variant="outline"
            className="w-full"
          >
            Pular por agora
          </Button>
        </div>

        <div className="text-xs text-gray-500">
          <p>Você pode criar a entidade agora ou pular e fazer isso depois no dashboard.</p>
        </div>
      </CardContent>
    </Card>
  )
}