"use client"

import { useEffect, useState } from 'react'

interface DebugInfo {
  status: string
  environment: any
  envVariables: any
  supabaseConnection: any
  message: string
}

export default function TestAuthPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDebugInfo() {
      try {
        const response = await fetch('/api/debug/auth')
        const data = await response.json()
        setDebugInfo(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    fetchDebugInfo()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando informações de debug...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold mb-2">Erro</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Debug de Autenticação - TrackDoc</h1>
        
        {debugInfo && (
          <div className="space-y-6">
            {/* Status Geral */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Status Geral</h2>
              <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                debugInfo.status === 'success' ? 'bg-green-100 text-green-800' :
                debugInfo.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {debugInfo.status.toUpperCase()}
              </div>
              <p className="mt-2 text-gray-600">{debugInfo.message}</p>
            </div>

            {/* Informações do Ambiente */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Ambiente</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Produção:</span>
                  <span className={`ml-2 ${debugInfo.environment.isProduction ? 'text-green-600' : 'text-blue-600'}`}>
                    {debugInfo.environment.isProduction ? 'Sim' : 'Não'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Vercel:</span>
                  <span className={`ml-2 ${debugInfo.environment.isVercel ? 'text-green-600' : 'text-gray-600'}`}>
                    {debugInfo.environment.isVercel ? 'Sim' : 'Não'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">NODE_ENV:</span>
                  <span className="ml-2 font-mono text-sm">{debugInfo.environment.NODE_ENV || 'undefined'}</span>
                </div>
                <div>
                  <span className="font-medium">Host:</span>
                  <span className="ml-2 font-mono text-sm">{debugInfo.environment.host}</span>
                </div>
              </div>
            </div>

            {/* Variáveis de Ambiente */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Variáveis de Ambiente</h2>
              <div className="space-y-2">
                {Object.entries(debugInfo.envVariables).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="font-mono text-sm">{key}:</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {value ? 'Configurada' : 'Não configurada'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Conexão Supabase */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Conexão Supabase</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Cliente criado:</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    debugInfo.supabaseConnection.clientCreated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {debugInfo.supabaseConnection.clientCreated ? 'Sim' : 'Não'}
                  </span>
                </div>
                
                {debugInfo.supabaseConnection.sessionCheck !== undefined && (
                  <div className="flex items-center justify-between">
                    <span>Verificação de sessão:</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      debugInfo.supabaseConnection.sessionCheck ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {debugInfo.supabaseConnection.sessionCheck ? 'OK' : 'Falhou'}
                    </span>
                  </div>
                )}
                
                {debugInfo.supabaseConnection.error && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <span className="text-red-800 font-medium">Erro:</span>
                    <p className="text-red-600 text-sm mt-1">{debugInfo.supabaseConnection.error}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Ações */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Ações</h2>
              <div className="space-y-3">
                <button
                  onClick={() => window.location.href = '/login'}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                  Ir para Login
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
                >
                  Recarregar Página
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                >
                  Ir para Home
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}