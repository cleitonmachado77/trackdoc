"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth-final'
import { useRouter } from 'next/navigation'

interface ProfileGuardProps {
  children: React.ReactNode
}

export function ProfileGuard({ children }: ProfileGuardProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [hasProfile, setHasProfile] = useState(false)

  useEffect(() => {
    async function checkProfile() {
      if (!user) {
        setIsChecking(false)
        return
      }

      try {
        console.log('🔍 [ProfileGuard] Verificando perfil para usuário:', user.id)
        
        const response = await fetch('/api/profile')
        const result = await response.json()

        if (response.status === 401 && result.code === 'PROFILE_NOT_FOUND') {
          console.log('❌ [ProfileGuard] Perfil não encontrado - fazendo logout')
          
          // Fazer logout através do contexto
          await signOut()
          
          // Limpar storage
          localStorage.clear()
          sessionStorage.clear()
          
          // Redirecionar para login
          router.replace('/login')
          return
        }

        if (response.ok && result.success) {
          console.log('✅ [ProfileGuard] Perfil encontrado - liberando acesso')
          setHasProfile(true)
        } else {
          console.log('❌ [ProfileGuard] Erro ao verificar perfil:', result.error)
          await signOut()
          router.replace('/login')
          return
        }
      } catch (error) {
        console.error('❌ [ProfileGuard] Erro ao verificar perfil:', error)
        await signOut()
        router.replace('/login')
        return
      } finally {
        setIsChecking(false)
      }
    }

    checkProfile()
  }, [user, signOut, router])

  // Se ainda está verificando, mostrar loading
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verificando perfil...</p>
        </div>
      </div>
    )
  }

  // Se não tem usuário ou não tem perfil, não renderizar nada (será redirecionado)
  if (!user || !hasProfile) {
    return null
  }

  // Se tem perfil, renderizar children
  return <>{children}</>
}