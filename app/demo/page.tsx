"use client"

import { useAuth } from '@/lib/hooks/use-unified-auth'
import { useEffect, useState } from 'react'

export default function DemoPage() {
  const { user, connectionStatus } = useAuth()
  const [processes, setprocesses] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Testar API de processes
        const processesResponse = await fetch('/api/processes?scope=assigned')
        const processesData = await processesResponse.json()
        setprocesses(processesData)

        // Testar API de profile
        const profileResponse = await fetch('/api/profile')
        const profileData = await profileResponse.json()
        setProfile(profileData)
      } catch (error) {
        console.error('Erro ao buscar dados:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchData()
    }
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Faça login para acessar a demo</h1>
          <a href="/login" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Ir para Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4">Demo TrackDoc</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded">
              <h3 className="font-semibold text-blue-800">Sistema</h3>
              <p className="text-blue-600">TrackDoc Online</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded">
              <h3 className="font-semibold text-green-800">Usuário Logado</h3>
              <p className="text-green-600">{user.email}</p>
              <p className="text-green-600 text-sm">{user.user_metadata?.full_name || user.email}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* processes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">processes Atribuídos</h2>
            {loading ? (
              <p className="text-gray-500">Carregando...</p>
            ) : (
              <div className="space-y-3">
                {processes.map((workflow: any) => (
                  <div key={workflow.id} className="border p-3 rounded">
                    <h3 className="font-medium">{workflow.name}</h3>
                    <p className="text-sm text-gray-600">{workflow.description}</p>
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-2">
                      {workflow.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Perfil do Usuário</h2>
            {loading ? (
              <p className="text-gray-500">Carregando...</p>
            ) : profile ? (
              <div className="space-y-2">
                <p><strong>Email:</strong> {(profile as any).email}</p>
                <p><strong>Nome:</strong> {(profile as any).full_name}</p>
                <p><strong>Departamento:</strong> {(profile as any).department}</p>
                <p><strong>Função:</strong> {(profile as any).role}</p>
              </div>
            ) : (
              <p className="text-gray-500">Perfil não encontrado</p>
            )}
          </div>
        </div>

        {/* Credenciais de teste */}
        {connectionStatus.usingProxy && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">
              🔄 Sistema de Proxy Ativo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Administrador:</p>
                <p>Email: admin@trackdoc.com</p>
                <p>Senha: admin123</p>
              </div>
              <div>
                <p className="font-medium">Usuário:</p>
                <p>Email: user@trackdoc.com</p>
                <p>Senha: user123</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


// Desabilitar prerendering para páginas com autenticação
export const dynamic = 'force-dynamic'
