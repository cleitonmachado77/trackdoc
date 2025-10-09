"use client"

export function SupabaseConfigError() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo e Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl mb-4">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuração Necessária</h1>
          <p className="text-gray-600">TrackDoc precisa ser configurado</p>
        </div>

        {/* Card de Erro */}
        <div className="bg-white rounded-lg shadow-xl border-0 p-6">
          <div className="space-y-1 pb-6">
            <h2 className="text-2xl font-bold text-center text-red-600">Supabase Não Configurado</h2>
            <p className="text-center text-gray-600">
              As variáveis de ambiente do Supabase não estão configuradas
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="border border-red-200 bg-red-50 p-4 rounded-lg">
              <div className="flex items-start">
                <svg className="h-4 w-4 text-red-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="text-sm text-red-700">
                  O arquivo <code className="bg-gray-100 px-1 rounded">.env.local</code> não foi encontrado ou não está configurado corretamente.
                </div>
              </div>
            </div>

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
                    <button
                      className="text-blue-600 hover:text-blue-700 text-sm underline"
                      onClick={() => window.open('https://supabase.com', '_blank')}
                    >
                      Acessar Supabase →
                    </button>
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
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here`}
              </pre>
            </div>

            <div className="text-center">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Recarregar após configurar
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 TrackDoc. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  )
}
