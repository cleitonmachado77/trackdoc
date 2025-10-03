"use client"

import { useState } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2, Mail, CheckCircle } from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function EmailConfirmationSimulator() {
  const { user } = useAuth()
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const simulateConfirmation = async () => {
    if (!userId.trim()) {
      setError('Por favor, insira um ID de usuário')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const { data, error } = await supabase.rpc('simulate_email_confirmation', {
        p_user_id: userId
      })

      if (error) throw error

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao simular confirmação')
    } finally {
      setLoading(false)
    }
  }

  const confirmCurrentUser = async () => {
    if (!user?.id) {
      setError('Nenhum usuário logado')
      return
    }

    setUserId(user.id)
    await simulateConfirmation()
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Simulador de Confirmação de Email
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="userId">ID do Usuário</Label>
          <Input
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="UUID do usuário"
          />
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={simulateConfirmation} 
            disabled={loading || !userId.trim()}
            className="flex-1"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Simular Confirmação
          </Button>
        </div>

        {user?.id && (
          <Button 
            onClick={confirmCurrentUser}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            Confirmar Usuário Atual
          </Button>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {result && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Confirmação simulada com sucesso!</p>
            <div className="text-xs text-green-700 mt-1">
              <p>User ID: {result.user_id}</p>
              <p>Email confirmado em: {new Date(result.email_confirmed_at).toLocaleString()}</p>
              <p>Trial termina em: {new Date(result.trial_end).toLocaleString()}</p>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p>⚠️ Este componente é apenas para desenvolvimento</p>
          <p>Use para testar a confirmação de email sem enviar emails reais</p>
        </div>
      </CardContent>
    </Card>
  )
} 