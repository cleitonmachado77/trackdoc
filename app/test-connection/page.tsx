"use client"

import { useAuth } from '@/lib/hooks/use-unified-auth'
import { useEffect, useState } from 'react'

export default function TestConnectionPage() {
  const { connectionStatus, loading } = useAuth()
  const [testResults, setTestResults] = useState<any[]>([])

  useEffect(() => {
    const runTests = async () => {
      const results = []

      // Teste 1: Verificar variáveis de ambiente
      results.push({
        test: 'Variáveis de Ambiente',
        status: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'ERRO',
        details: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configurado' : 'Não configurado',
          key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configurado' : 'Não configurado'
        }
      })

      // Teste 2: Conexão direta
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
          }
        })
        
        results.push({
          test: 'Conexão Direta Supabase',
          status: response.ok ? 'OK' : 'ERRO',
          details: {
            status: response.status,
            statusText: response.statusText
          }
        })
      } catch (error) {
        results.push({
          test: 'Conexão Direta Supabase',
          status: 'ERRO',
          details: {
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          }
        })
      }

      // Teste 3: Proxy local
      try {
        const response = await fetch('/api/supabase-proxy/rest/v1/')
        
        results.push({
          test: 'Proxy Local',
          status: response.ok ? 'OK' : 'ERRO',
          details: {
            status: response.status,
            statusText: response.statusText
          }
        })
      } catch (error) {
        results.push({
          test: 'Proxy Local',
          status: 'ERRO',
          details: {
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          }
        })
      }

      setTestResults(results)
    }

    if (!loading) {
      runTests()
    }
  }, [loading])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Testando conexão...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4">Teste de Conexão - TrackDoc</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className={`p-4 rounded ${connectionStatus.connected ? 'bg-green-50' : 'bg-red-50'}`}>
              <h3 className={`font-semibold ${connectionStatus.connected ? 'text-green-800' : 'text-red-800'}`}>
                Status da Conexão
              </h3>
              <p className={connectionStatus.connected ? 'text-green-600' : 'text-red-600'}>
                {connectionStatus.connected ? '✅ Conectado' : '❌ Desconectado'}
              </p>
            </div>
            
            <div className={`p-4 rounded ${connectionStatus.usingProxy ? 'bg-orange-50' : 'bg-blue-50'}`}>
              <h3 className={`font-semibold ${connectionStatus.usingProxy ? 'text-orange-800' : 'text-blue-800'}`}>
                Método de Conexão
              </h3>
              <p className={connectionStatus.usingProxy ? 'text-orange-600' : 'text-blue-600'}>
                {connectionStatus.usingProxy ? '🔄 Via Proxy' : '🌐 Direto'}
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold text-gray-800">Método Usado</h3>
              <p className="text-gray-600">{connectionStatus.method}</p>
            </div>
          </div>

          {connectionStatus.error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
              <h3 className="font-semibold text-red-800 mb-2">Erro de Conexão:</h3>
              <p className="text-red-600 text-sm">{connectionStatus.error}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Resultados dos Testes</h2>
          
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div key={index} className="border rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{result.test}</h3>
                  <span className={`px-2 py-1 rounded text-sm ${
                    result.status === 'OK' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {result.status}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600">
                  <pre className="bg-gray-50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            💡 Como Interpretar os Resultados
          </h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p><strong>✅ Conexão Direta OK:</strong> Sua rede permite acesso direto ao Supabase</p>
            <p><strong>❌ Conexão Direta ERRO + ✅ Proxy OK:</strong> Proxy está funcionando para contornar bloqueios</p>
            <p><strong>❌ Ambos com ERRO:</strong> Problema de configuração ou rede</p>
          </div>
        </div>

        <div className="text-center mt-6">
          <a 
            href="/login" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ir para Login
          </a>
        </div>
      </div>
    </div>
  )
}

// Desabilitar prerendering para páginas com autenticação
export const dynamic = 'force-dynamic'
