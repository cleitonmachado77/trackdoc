"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Mail, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo e Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">TrackDoc</h1>
          <p className="text-gray-600">Verificação de Email</p>
        </div>

        {/* Card de Verificação */}
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center space-y-1 pb-6">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Verifique seu email</CardTitle>
            <CardDescription>
              Enviamos um link de confirmação para seu email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                Para começar a usar o TrackDoc, você precisa confirmar seu endereço de email.
                Verifique sua caixa de entrada e clique no link de confirmação.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">🎉 Próximos passos:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Verifique sua caixa de entrada</li>
                  <li>• Clique no link de confirmação</li>
                  <li>• Faça login na plataforma</li>
                  <li>• Comece seu período de teste gratuito</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">📧 Não recebeu o email?</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Verifique a pasta de spam</li>
                  <li>• Confirme se o email está correto</li>
                  <li>• Aguarde alguns minutos</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/login">
                  Ir para o Login
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link href="/register">
                  Criar nova conta
                </Link>
              </Button>
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