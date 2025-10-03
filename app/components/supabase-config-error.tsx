"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ExternalLink, FileText } from "lucide-react"

export function SupabaseConfigError() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo e Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl mb-4">
            <AlertCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuração Necessária</h1>
          <p className="text-gray-600">TrackDoc precisa ser configurado</p>
        </div>

        {/* Card de Erro */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-red-600">Supabase Não Configurado</CardTitle>
            <CardDescription className="text-center">
              As variáveis de ambiente do Supabase não estão configuradas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                O arquivo <code className="bg-gray-100 px-1 rounded">.env.local</code> não foi encontrado ou não está configurado corretamente.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Como resolver:</h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      Crie um projeto no <strong>Supabase</strong>
                    </p>
                    <Button
                      variant="link"
                      className="px-0 h-auto text-blue-600 hover:text-blue-700"
                      onClick={() => window.open('https://supabase.com', '_blank')}
                    >
                      Acessar Supabase <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      Vá para <strong>Settings → API</strong> no Dashboard
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      Copie a <strong>URL</strong> e a <strong>anon key</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                    4
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      Crie um arquivo <code className="bg-gray-100 px-1 rounded">.env.local</code> na raiz do projeto
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                    5
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      Adicione as variáveis conforme o template
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Exemplo do arquivo .env.local:</h4>
              <pre className="text-xs text-gray-700 bg-white p-3 rounded border overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development`}
              </pre>
            </div>

            <div className="text-center">
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Recarregar após configurar
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
