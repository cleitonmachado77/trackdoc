# 🔍 Análise de Cache e Performance - Trackdoc

## 🚨 Problemas Identificados

### 1. **ProfileContext Bloqueando Renderização**
**Localização:** `app/components/profile-context.tsx`

**Problema Crítico:**
```typescript
// Linha 77-91: Bloqueia TODA a aplicação enquanto carrega perfil
if (authLoading || (loading && user)) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">
          {authLoading ? 'Verificando autenticação...' : 'Carregando perfil...'}
        </p>
      </div>
    </div>
  )
}
```

**Impacto:** 
- Usuário fica preso na tela "Carregando perfil..." ou "Verificando autenticação..."
- Se a API `/api/profile` estiver lenta, toda aplicação trava
- Não há timeout ou fallback

---

### 2. **Dupla Verificação de Autenticação**
**Localização:** `app/components/simple-auth-context.tsx`

**Problema:**
```typescript
// Linha 48-76: Verificação síncrona que pode demorar
const initializeAuth = async () => {
  if (isInitialized) {
    console.log('⏭️ [Auth] Já inicializado, pulando...')
    return
  }
  
  const { data: { session }, error } = await supabase.auth.getSession()
  // ... mais código
}
```

**Impacto:**
- `getSession()` pode demorar em conexões lentas
- Bloqueia o carregamento inicial da aplicação
- Não há cache local da sessão

---

### 3. **API de Profile Sem Cache**
**Localização:** `app/api/profile/route.ts`

**Problema:**
```typescript
export const dynamic = 'force-dynamic' // ❌ Força requisição sempre
```

**Impacto:**
- Toda vez que a página carrega, faz requisição ao banco
- Não usa cache do Next.js
- Aumenta latência e carga no Supabase

---

### 4. **Falta de Cache HTTP**
**Localização:** `next.config.mjs`

**Problema:**
```typescript
// Linha 60-68: Cache apenas para arquivos estáticos
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store, must-revalidate', // ❌ Nunca faz cache de APIs
        },
      ],
    },
  ]
}
```

**Impacto:**
- APIs nunca são cacheadas
- Cada requisição vai ao servidor

---

### 5. **Listener de Auth Desnecessário**
**Localização:** `app/components/simple-auth-context.tsx`

**Problema:**
```typescript
// Linha 88-106: Listener que pode causar re-renders
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    console.log('🔄 [Auth] Estado mudou:', event)
    
    if (event === 'TOKEN_REFRESHED') {
      console.log('🔄 [Auth] Token atualizado silenciosamente')
      return
    }
    
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
      setSession(session)
      setUser(session?.user ?? null)
    }
  }
)
```

**Impacto:**
- Pode causar re-renders desnecessários
- Aumenta consumo de memória

---

## ✅ Soluções Recomendadas

### **Solução 1: Remover Bloqueio do ProfileContext**

**Prioridade:** 🔴 CRÍTICA

Permitir que a aplicação carregue mesmo sem o perfil completo:

```typescript
// NÃO bloquear a renderização
return (
  <ProfileContext.Provider value={{ profile, loading, error, refreshProfile }}>
    {children}
  </ProfileContext.Provider>
)
```

Componentes individuais devem verificar `loading` e mostrar skeleton/loading local.

---

### **Solução 2: Implementar Cache Local de Sessão**

**Prioridade:** 🔴 CRÍTICA

```typescript
// Usar localStorage para cache de sessão
const getCachedSession = () => {
  if (typeof window === 'undefined') return null
  const cached = localStorage.getItem('trackdoc_session_cache')
  if (!cached) return null
  
  const { session, timestamp } = JSON.parse(cached)
  // Cache válido por 5 minutos
  if (Date.now() - timestamp < 5 * 60 * 1000) {
    return session
  }
  return null
}
```

---

### **Solução 3: Adicionar Cache à API de Profile**

**Prioridade:** 🟡 ALTA

```typescript
// Usar revalidate ao invés de force-dynamic
export const revalidate = 60 // Cache por 60 segundos

// OU usar cache do Next.js 15
export async function GET(request: NextRequest) {
  const response = await fetch('...', {
    next: { revalidate: 60 }
  })
}
```

---

### **Solução 4: Implementar Timeout e Fallback**

**Prioridade:** 🟡 ALTA

```typescript
const loadProfileWithTimeout = async () => {
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), 5000)
  )
  
  try {
    await Promise.race([loadProfile(), timeout])
  } catch (error) {
    // Continuar com perfil parcial
    console.warn('Perfil não carregado, usando fallback')
  }
}
```

---

### **Solução 5: Otimizar Headers de Cache**

**Prioridade:** 🟢 MÉDIA

```typescript
// Cache seletivo para APIs
{
  source: '/api/profile',
  headers: [
    {
      key: 'Cache-Control',
      value: 'private, max-age=60, stale-while-revalidate=120',
    },
  ],
}
```

---

### **Solução 6: Lazy Loading de Componentes Pesados**

**Prioridade:** 🟢 MÉDIA

```typescript
// Carregar componentes pesados apenas quando necessário
const UniversalDocumentViewer = dynamic(
  () => import('./universal-document-viewer'),
  { 
    loading: () => <Skeleton />,
    ssr: false 
  }
)
```

---

## 🎯 Plano de Ação Imediato

### Fase 1: Correções Críticas (30 min)
1. ✅ Remover bloqueio do ProfileContext
2. ✅ Adicionar timeout de 5s para carregamento de perfil
3. ✅ Implementar fallback para perfil não carregado

### Fase 2: Otimizações de Cache (1h)
4. ✅ Adicionar cache local de sessão
5. ✅ Implementar revalidate na API de profile
6. ✅ Otimizar headers de cache

### Fase 3: Melhorias de Performance (1h)
7. ✅ Lazy loading de componentes pesados
8. ✅ Otimizar bundle splitting
9. ✅ Adicionar service worker para cache offline

---

## 📊 Métricas Esperadas

### Antes:
- ⏱️ Tempo de carregamento: 5-15s
- 🔄 Requisições ao carregar: 10-15
- 💾 Tamanho do bundle: ~2MB

### Depois:
- ⏱️ Tempo de carregamento: 1-3s
- 🔄 Requisições ao carregar: 3-5
- 💾 Tamanho do bundle: ~1.2MB

---

## 🔧 Comandos para Testar

```bash
# Limpar cache do Next.js
rm -rf .next

# Rebuild com análise de bundle
npm run build

# Testar em produção local
npm run start

# Analisar bundle
npm run build -- --profile
```

---

## 📝 Notas Adicionais

### Configuração do Vercel
- Região atual: `iad1` (US East)
- Considerar adicionar edge functions para APIs críticas
- Habilitar ISR (Incremental Static Regeneration) onde possível

### Supabase
- Verificar se há índices nas tabelas `profiles` e `auth.users`
- Considerar usar Supabase Edge Functions para lógica pesada
- Implementar connection pooling

### Monitoramento
- Adicionar Vercel Analytics
- Implementar logging de performance
- Configurar alertas para APIs lentas
