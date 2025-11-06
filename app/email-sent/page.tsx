"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function EmailSentPage() {
  const router = useRouter()

  const handleGoToLogin = () => {
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Mail className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle>Email de Confirmação Enviado!</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <Mail className="h-4 w-4" />
            <AlertDescription className="text-blue-700">
              Enviamos um email de confirmação para você. Verifique sua caixa de entrada e clique no link para ativar sua conta.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Button 
              onClick={handleGoToLogin} 
              variant="outline"
              className="w-full"
            >
              Ir para Login
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Próximos passos:</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-1 space-y-1">
              <li>• Verifique sua caixa de entrada (e spam)</li>
              <li>• Clique no link de confirmação no email</li>
              <li>• Sua conta será ativada automaticamente</li>
              <li>• Faça login normalmente</li>
            </ul>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>Não recebeu o email? Verifique sua pasta de spam ou tente fazer login.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}