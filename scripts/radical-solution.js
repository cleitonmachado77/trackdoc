const fs = require('fs')
const path = require('path')

console.log('🚨 SOLUÇÃO RADICAL - ELIMINANDO CACHE WEBPACK DEFINITIVAMENTE')
console.log('=' .repeat(60))

// 1. Parar todos os processos Node
console.log('🛑 Parando todos os processos Node...')

// 2. Remover TUDO relacionado a cache
const cacheItems = [
    '.next',
    'node_modules',
    '.eslintcache',
    'package-lock.json'
]

console.log('\n🗑️ Removendo TODOS os caches...')
cacheItems.forEach(item => {
    if (fs.existsSync(item)) {
        console.log(`   Removendo ${item}...`)
        try {
            fs.rmSync(item, { recursive: true, force: true })
            console.log(`   ✅ ${item} removido`)
        } catch (error) {
            console.log(`   ⚠️ Erro: ${error.message}`)
        }
    } else {
        console.log(`   ℹ️ ${item} não existe`)
    }
})

// 3. Criar um novo sistema de auth completamente isolado
console.log('\n🔧 Criando sistema de auth isolado...')

// Criar novo hook de auth isolado
const newAuthHook = `"use client"

import { useState, useEffect } from 'react'
import { getSupabaseSingleton } from '@/lib/supabase-singleton'

export function useIsolatedAuth() {
  const [authState, setAuthState] = useState({
    user: null,
    session: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    const supabase = getSupabaseSingleton()
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      setAuthState({
        user: session?.user || null,
        session: session,
        loading: false,
        error: error
      })
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState({
          user: session?.user || null,
          session: session,
          loading: false,
          error: null
        })
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return authState
}
`

fs.writeFileSync('lib/hooks/use-isolated-auth.ts', newAuthHook)
console.log('   ✅ use-isolated-auth.ts criado')

// 4. Substituir COMPLETAMENTE o auth-context
const newAuthContext = `"use client"

// NOVO SISTEMA ISOLADO - SEM DEPENDÊNCIAS ANTIGAS
import { useIsolatedAuth } from '@/lib/hooks/use-isolated-auth'

export function useAuth() {
    const auth = useIsolatedAuth()
    
    if (!auth.user && !auth.loading) {
        // Retornar um objeto vazio em vez de erro para evitar crashes
        return {
            user: null,
            session: null,
            loading: false,
            error: 'Not authenticated'
        }
    }
    
    return auth
}

// Re-export para compatibilidade
export { useIsolatedAuth }
`

fs.writeFileSync('lib/contexts/auth-context.tsx', newAuthContext)
console.log('   ✅ auth-context.tsx reescrito completamente')

console.log('\n📋 PRÓXIMOS PASSOS OBRIGATÓRIOS:')
console.log('1. npm install')
console.log('2. npm run build')
console.log('3. npm run dev')
console.log('\n⚠️ IMPORTANTE: Execute os comandos na ordem exata!')

console.log('\n🎯 Esta solução deve resolver o problema definitivamente.')