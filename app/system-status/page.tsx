"use client"

import { useAuth } from '@/lib/hooks/use-auth-final'
import { useSupabase } from '@/lib/hooks/use-supabase'
import { useEffect, useState } from 'react'

export default function SystemStatusPage() {
  const { user, session, loading: authLoading, connectionStatus } = useAuth()
  const { supabase, loading: supabaseLoading, isConnected, usingProxy } = useSupabase()
  const [componentTests, setComponentTests] = useState<any[]>([])

  useEffect(() => {
    const testComponents = async () => {
      const tests = []

      // Teste 1: Contexto de Autenticação
      tests.push({
        component: 'HybridAuthProvider',
        status: user ? 'OK' : 'ERRO',
        details: {
          user: user ? 'Logado' : 'Não logado',
          session: session ? 'Ativa' : 'Inativa',
          loading: authLoading
        }
      })

      // Teste 2: Cliente Supabase
      tests.push({
        component: 'SupabaseClient',
        status: isConnected ? 'OK' : 'ERRO',
        details: {
          connected: isConnected,
          usingProxy: usingProxy,
          method: connectionStatus.method,
          loading: supabaseLoading
        }
      })

      // Teste 3: APIs
      if (user) {
        try {
          const profileResponse = await fetch('/api/profile')
          tests.push({
            component: 'API Profile',
            status: profileResponse.ok ? 'OK' : 'ERRO',
            details: {
              status: profileResponse.status,
              statusText: profileResponse.statusText
            }
          })
        } catch (error) {
          tests.push({
            component: 'API Profile',
            status: 'ERRO',
            details: { error: error instanceof Error ? error.message : 'Erro desconhecido' }
          })
        }

        try {
          const workflowsResponse = await fetch('/api/approvals?scope=assigned')
          tests.push({
            component: 'API Approvals',
            status: workflowsResponse.ok ? 'OK' : 'ERRO',
            details: {
              status: workflowsResponse.status,
              statusText: workflowsResponse.statusText
            }
          })
        } catch (error) {
          tests.push({
            component: 'API Approvals',
            status: 'ERRO',
            details: { error: error instanceof Error ? error.message : 'Erro desconhecido' }
          })
        }
      }

      setComponentTests(tests)
    }

    testComponents()
  }, [user, session, isConnected, usingProxy, connectionStatus.method, authLoading, supabaseLoading])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4">Status do Sistema - TrackDoc</h1>
          
          {/* Resumo Geral */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className={`p-4 rounded ${user ? 'bg-green-50' : 'bg-red-50'}`}>
              <h3 className={`font-semibold ${user ? 'text-green-800' : 'text-red-800'}`}>
                Autenticação
              </h3>
              <p className={user ? 'text-green-600' : 'text-red-600'}>
                {user ? '✅ Sistema Funcionando' : '❌ Problemas Detectados'}
              </p>
            </div>
            
            <div className={`p-4 rounded ${isConnected ? 'bg-green-50' : 'bg-red-50'}`}>
              <h3 className={`font-semibold ${isConnected ? 'text-green-800' : 'text-red-800'}`}>
                Conexão
              </h3>
              <p className={isConnected ? 'text-green-600' : 'text-red-600'}>
                {isConnected ? (usingProxy ? '🔄 Via Proxy' : '🌐 Direta') : '❌ Sem Conexão'}
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded">
              <h3 className="font-semibold text-blue-800">Componentes</h3>
              <p className="text-blue-600">
                📊 {componentTests.filter(t => t.status === 'OK').length}/{componentTests.length} OK
              </p>
            </div>
          </div>
        </div>

        {/* Detalhes dos Testes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Testes de Componentes</h2>
          
          {componentTests.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Executando testes...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {componentTests.map((test, index) => (
                <div key={index} className="border rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{test.component}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      test.status === 'OK' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {test.status}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <pre className="bg-gray-50 p-3 rounded overflow-x-auto">
                      {JSON.stringify(test.details, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Informações de Debug */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Informações de Debug</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Contexto de Autenticação</h3>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <div><strong>Usuário:</strong> {user ? user.email : 'Não logado'}</div>
                <div><strong>ID:</strong> {user?.id || 'N/A'}</div>
                <div><strong>Loading:</strong> {authLoading ? 'Sim' : 'Não'}</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Status da Conexão</h3>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <div><strong>Conectado:</strong> {isConnected ? 'Sim' : 'Não'}</div>
                <div><strong>Método:</strong> {connectionStatus.method}</div>
                <div><strong>Usando Proxy:</strong> {usingProxy ? 'Sim' : 'Não'}</div>
                <div><strong>Loading:</strong> {supabaseLoading ? 'Sim' : 'Não'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="text-center mt-6 space-x-4">
          <a 
            href="/test-connection" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Teste de Conexão
          </a>
          
          <a 
            href="/status" 
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Status Completo
          </a>
          
          {!user && (
            <a 
              href="/login" 
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Fazer Login
            </a>
          )}
          
          {user && (
            <a 
              href="/" 
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Ir para Dashboard
            </a>
          )}
        </div>

        {/* Resumo das Correções */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            ✅ Correções Implementadas
          </h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p>• <strong>Sistema de Proxy:</strong> Contorna bloqueios de rede corporativa</p>
            <p>• <strong>Contexto Híbrido:</strong> Detecta automaticamente o melhor método de conexão</p>
            <p>• <strong>APIs Atualizadas:</strong> Todas as APIs agora usam o sistema de proxy</p>
            <p>• <strong>Hooks Corrigidos:</strong> Todos os hooks usam o novo contexto de autenticação</p>
            <p>• <strong>Componentes Atualizados:</strong> AuthGuard, AccessGuard e outros componentes corrigidos</p>
            <p>• <strong>Indicadores Visuais:</strong> Status da conexão visível em tempo real</p>
          </div>
        </div>
      </div>
    </div>
  )
}


// Desabilitar prerendering para páginas com autenticação
export const dynamic = 'force-dynamic'
