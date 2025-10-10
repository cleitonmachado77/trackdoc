"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Trash2, RefreshCw } from 'lucide-react'
import { useAuth } from '@/lib/hooks/use-auth-final'

export function AuthDebug() {
    const { clearAuthData, user, session, loading } = useAuth()
    const [isClearing, setIsClearing] = useState(false)

    const handleClearAuth = async () => {
        setIsClearing(true)
        try {
            await clearAuthData()
            // Recarregar a página após limpar
            window.location.reload()
        } catch (error) {
            console.error('Erro ao limpar dados de autenticação:', error)
        } finally {
            setIsClearing(false)
        }
    }

    const clearBrowserStorage = () => {
        if (typeof window !== 'undefined') {
            let cleared = 0

            // Limpar localStorage
            Object.keys(localStorage).forEach(key => {
                if (key.includes('supabase') || key.includes('sb-')) {
                    localStorage.removeItem(key)
                    cleared++
                }
            })

            // Limpar sessionStorage
            Object.keys(sessionStorage).forEach(key => {
                if (key.includes('supabase') || key.includes('sb-')) {
                    sessionStorage.removeItem(key)
                    cleared++
                }
            })

            alert(`${cleared} itens removidos do storage. Recarregando página...`)
            window.location.reload()
        }
    }

    return (
        <Card className="w-full max-w-md mx-auto mt-8">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Debug de Autenticação
                </CardTitle>
                <CardDescription>
                    Use estas ferramentas se estiver com problemas de autenticação
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                    <p><strong>Status:</strong> {loading ? 'Carregando...' : (user ? 'Autenticado' : 'Não autenticado')}</p>
                    <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
                    <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
                    <p><strong>Session:</strong> {session ? 'Ativa' : 'Inativa'}</p>
                </div>

                <div className="space-y-2">
                    <Button
                        onClick={handleClearAuth}
                        disabled={isClearing}
                        variant="destructive"
                        className="w-full"
                    >
                        {isClearing ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Limpar Dados de Auth (Supabase)
                    </Button>

                    <Button
                        onClick={clearBrowserStorage}
                        variant="outline"
                        className="w-full"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Limpar Storage do Navegador
                    </Button>
                </div>

                <div className="text-xs text-gray-500">
                    <p>Use "Limpar Dados de Auth" se houver erros de refresh token.</p>
                    <p>Use "Limpar Storage" se os problemas persistirem.</p>
                </div>
            </CardContent>
        </Card>
    )
}