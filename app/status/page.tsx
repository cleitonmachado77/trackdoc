"use client"

import { useAuth } from '@/lib/hooks/use-unified-auth'
import { useSupabase } from '@/lib/hooks/use-supabase'
import { useUserProfile } from '@/hooks/use-database-data'
import { useNotificationCounterSimple } from '@/hooks/use-notification-counter-simple'
import { useEffect, useState } from 'react'

export default function StatusPage() {
  const { user, session, loading: authLoading, connectionStatus } = useAuth()
  const { supabase, loading: supabaseLoading, isConnected, usingProxy } = useSupabase()
  const { profile, loading: profileLoading, error: profileError } = useUserProfile(user?.id)
  const { unreadCount, loading: notificationLoading } = useNotificationCounterSimple()
  const [apiTests, setApiTests] = useState<any[]>([])

  useEffect(() => {
    const runAPITests = async () => {
      if (!user) return

      const tests = []

      // Teste API de workflows
      try {
        const workflowsResponse = await fetch('/api/approvals?scope=assigned')
        tests.push({
          name: 'API Approvals',
          status: workflowsResponse.ok ? 'OK' : 'ERRO',
          details: {
            status: workflowsResponse.status,
            statusText: workflowsResponse.statusText
          }
        })
      } catch (error) {
        tests.push({
          name: 'API Approvals',
          status: 'ERRO',
          details: { error: error instanceof Error ? error.message : 'Erro desconhecido' }
        })
      }

      // Teste API de profile
      try {
        const profileResponse = await fetch('/api/profile')
        tests.push({
          name: 'API Profile',
          status: profileResponse.ok ? 'OK' : 'ERRO',
          details: {
            status: profileResponse.status,
            statusText: profileResponse.statusText
          }
        })
      } catch (error) {
        tests.push({
          name: 'API Profile',
          status: 'ERRO',
          details: { error: error instanceof Error ? error.message : 'Erro desconhecido' }
        })
      }

      setApiTests(tests)
    }

    if (user) {
      runAPITests()
    }
  }, [user])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando sistema...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4">Status do Sistema - TrackDoc</h1>
          
          {/* Status da Autenticação */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className={`p-4 rounded ${user ? 'bg-green-50' : 'bg-red-50'}`}>
              <h3 className={`font-semibold ${user ? 'text-green-800' : 'text-red-800'}`}>
                Autenticação
              </h3>
              <p className={user ? 'text-green-600' : 'text-red-600'}>
                {user ? '✅ Logado' : '❌ Não logado'}
              </p>
              {user && (
                <p className="text-sm text-gray-600 mt-1">{user.email}</p>
              )}
            </div>
            
            <div className={`p-4 rounded ${connectionStatus.connected ? 'bg-green-50' : 'bg-red-50'}`}>
              <h3 className={`font-semibold ${connectionStatus.connected ? 'text-green-800' : 'text-red-800'}`}>
                Conexão Supabase
              </h3>
              <p className={connectionStatus.connected ? 'text-green-600' : 'text-red-600'}>
                {connectionStatus.connected ? '✅ Conectado' : '❌ Desconectado'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {connectionStatus.usingProxy ? '🔄 Via Proxy' : '🌐 Direto'}
              </p>
            </div>
            
            <div className={`p-4 rounded ${profile ? 'bg-green-50' : 'bg-orange-50'}`}>
              <h3 className={`font-semibold ${profile ? 'text-green-800' : 'text-orange-800'}`}>
                Perfil
              </h3>
              <p className={profile ? 'text-green-600' : 'text-orange-600'}>
                {profileLoading ? '⏳ Carregando...' : profile ? '✅ Carregado' : '⚠️ Erro'}
              </p>
              {profileError && (
                <p className="text-sm text-red-600 mt-1">{profileError}</p>
              )}
            </div>
            
            <div className="bg-blue-50 p-4 rounded">
              <h3 className="font-semibold text-blue-800">Notificações</h3>
              <p className="text-blue-600">
                {notificationLoading ? '⏳ Carregando...' : `📊 ${unreadCount} pendentes`}
              </p>
            </div>
          </div>
        </div>

        {/* Detalhes da Conexão */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Detalhes da Conexão</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <span className={connectionStatus.connected ? 'text-green-600' : 'text-red-600'}>
                  {connectionStatus.connected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Método:</span>
                <span>{connectionStatus.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Usando Proxy:</span>
                <span>{connectionStatus.usingProxy ? 'Sim' : 'Não'}</span>
              </div>
              {connectionStatus.error && (
                <div className="mt-3 p-3 bg-red-50 rounded">
                  <p className="text-sm text-red-700">
                    <strong>Erro:</strong> {connectionStatus.error}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Informações do Usuário */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Informações do Usuário</h2>
            {user ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">ID:</span>
                  <span className="text-sm font-mono">{user.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Email:</span>
                  <span>{user.email}</span>
                </div>
                {profile && (
                  <>
                    <div className="flex justify-between">
                      <span className="font-medium">Nome:</span>
                      <span>{profile.full_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Função:</span>
                      <span>{profile.role}</span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Usuário não logado</p>
            )}
          </div>
        </div>

        {/* Testes de API */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Testes de API</h2>
          
          {apiTests.length === 0 ? (
            <p className="text-gray-500">Execute os testes fazendo login</p>
          ) : (
            <div className="space-y-4">
              {apiTests.map((test, index) => (
                <div key={index} className="border rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{test.name}</h3>
                    <span className={`px-2 py-1 rounded text-sm ${
                      test.status === 'OK' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {test.status}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <pre className="bg-gray-50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(test.details, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="text-center mt-6 space-x-4">
          <a 
            href="/test-connection" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Teste de Conexão
          </a>
          
          {!user && (
            <a 
              href="/login" 
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Fazer Login
            </a>
          )}
          
          {user && (
            <a 
              href="/" 
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Ir para Dashboard
            </a>
          )}
        </div>
      </div>
    </div>
  )
}


// Desabilitar prerendering para páginas com autenticação
export const dynamic = 'force-dynamic'
