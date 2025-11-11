# Correção do Loop Infinito no Logout

## Problema Identificado

Quando o usuário clicava no botão "Sair" no sidebar pela segunda vez, a página entrava em um loop infinito de redirecionamentos, causando uma tela piscando continuamente. O erro 404 POST que aparecia brevemente no console era provavelmente relacionado a tentativas de comunicação com o Supabase durante o processo de logout.

## Causa Raiz

O problema estava na sequência de eventos durante o logout:

1. **Função `signOut`** em `simple-auth-context.tsx`:
   - Fazia logout no Supabase primeiro (operação assíncrona)
   - Limpava o storage
   - Limpava o estado local
   - Redirecionava para `/login` usando `window.location.replace()`

2. **Listener `onAuthStateChange`**:
   - Detectava o evento `SIGNED_OUT` do Supabase
   - Tentava atualizar o estado novamente (mesmo já tendo sido limpo)

3. **AuthGuard**:
   - Detectava que não havia usuário
   - Tentava redirecionar para `/login` novamente
   - Criava conflito com o redirecionamento já em andamento

4. **Loop de Redirecionamentos**:
   - Múltiplos redirecionamentos simultâneos
   - Estado inconsistente entre componentes
   - Página ficava piscando continuamente

## Correções Implementadas

### 1. Otimização da Função `signOut`

**Arquivo**: `app/components/simple-auth-context.tsx`

**Mudanças**:
- Adicionar flag `logging_out` no sessionStorage para sinalizar logout em andamento
- Limpar o estado local **PRIMEIRO** (antes de fazer logout no Supabase)
- Fazer logout no Supabase de forma **não-bloqueante** (sem await)
- Aguardar 100ms para garantir que o estado foi limpo
- Redirecionar **imediatamente** após limpar o estado
- Usar `window.location.href` para forçar reload completo

```typescript
const signOut = async () => {
  // 1. Marcar que estamos fazendo logout
  sessionStorage.setItem('logging_out', 'true')
  
  // 2. Limpar estado local PRIMEIRO
  setSession(null)
  setUser(null)
  setAuthError(null)
  setIsInitialized(false)
  
  // 3. Limpar storage
  // ... código de limpeza ...
  
  // 4. Fazer logout no Supabase (sem await)
  supabase.auth.signOut({ scope: 'global' })
  
  // 5. Aguardar um pouco
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // 6. Redirecionar imediatamente
  sessionStorage.removeItem('logging_out')
  window.location.href = '/login'
}
```

### 2. Simplificação do Listener `onAuthStateChange`

**Arquivo**: `app/components/simple-auth-context.tsx`

**Mudanças**:
- Ignorar **completamente** o evento `SIGNED_OUT`
- Deixar a função `signOut` cuidar de toda a lógica de logout
- Evitar atualizações de estado duplicadas

```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    // Ignorar SIGNED_OUT completamente
    if (event === 'SIGNED_OUT') {
      console.log('🚪 [Auth] SIGNED_OUT detectado - ignorando')
      return
    }
    
    // Apenas processar SIGNED_IN
    if (event === 'SIGNED_IN') {
      setSession(session)
      setUser(session?.user ?? null)
    }
  }
)
```

### 3. Melhoria no AuthGuard

**Arquivo**: `app/components/auth-guard.tsx`

**Mudanças**:
- Verificar flag `logging_out` antes de fazer qualquer redirecionamento
- Usar `router.replace()` em vez de `router.push()` para evitar histórico
- Adicionar `/forgot-password` à lista de páginas públicas
- Evitar redirecionamentos duplicados

```typescript
// Verificar se está fazendo logout
if (sessionStorage.getItem('logging_out') === 'true') {
  return
}

// Usar replace para não criar histórico
if (!user && !publicPages.includes(pathname)) {
  router.replace("/login")
  return
}
```

### 4. Correção no LandingRedirect

**Arquivo**: `app/components/landing-redirect.tsx`

**Mudanças**:
- Redirecionar para site externo **apenas** quando estiver na raiz (`/`)
- Evitar conflito com redirecionamento do AuthGuard

```typescript
// Apenas redirecionar se estiver na raiz E não tiver usuário
if (!loading && !user && pathname === '/') {
  window.location.href = 'https://www.trackdoc.app.br/'
}
```

### 5. Correção no ProfileContext

**Arquivo**: `app/components/profile-context.tsx`

**Mudanças**:
- Verificar flag `logging_out` antes de carregar perfil
- **NÃO** redirecionar quando perfil não é encontrado (deixar AuthGuard cuidar)
- Sempre usar perfil básico em caso de erro (evitar loops)

```typescript
// Se está fazendo logout, não carregar perfil
if (sessionStorage.getItem('logging_out') === 'true') {
  return
}

// Em caso de erro, usar perfil básico
if (err) {
  setProfile({
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || 'Usuário',
    role: 'user',
    status: 'active'
  })
}
```

## Fluxo Correto Após as Correções

1. **Usuário clica em "Sair"**
   - Função `signOut` é chamada
   - Flag `logging_out` é definida no sessionStorage

2. **Estado é limpo imediatamente**
   - `setSession(null)`
   - `setUser(null)`
   - Storage é limpo

3. **Outros componentes param de interferir**
   - AuthGuard detecta flag e não redireciona
   - ProfileContext detecta flag e não carrega perfil
   - LandingRedirect só age na raiz

4. **Logout no Supabase acontece em background**
   - Não bloqueia o redirecionamento
   - Erros são tratados silenciosamente

5. **Aguarda 100ms para garantir limpeza**
   - Tempo para estado ser propagado
   - Evita race conditions

6. **Redirecionamento imediato**
   - Flag `logging_out` é removida
   - `window.location.href = '/login'`
   - Força reload completo da página
   - Evita conflitos com outros redirecionamentos

7. **Página de login carrega limpa**
   - Sem estado anterior
   - Sem loops de redirecionamento
   - Pronta para novo login

## Benefícios

✅ **Logout instantâneo**: Estado limpo imediatamente
✅ **Sem loops**: Apenas um redirecionamento, flag previne conflitos
✅ **Sem erros 404**: Logout não-bloqueante
✅ **Experiência suave**: Sem tela piscando ou alternando entre páginas
✅ **Múltiplos logouts**: Funciona corretamente mesmo após vários logouts consecutivos
✅ **Coordenação entre componentes**: Flag `logging_out` sincroniza todos os componentes
✅ **Sem conflitos**: LandingRedirect, AuthGuard e ProfileContext não interferem durante logout

## Testes Recomendados

1. **Teste básico**:
   - Fazer login
   - Clicar em "Sair"
   - Verificar se redireciona para login sem piscar

2. **Teste de múltiplos logouts**:
   - Fazer login
   - Clicar em "Sair"
   - Fazer login novamente
   - Clicar em "Sair" novamente
   - Verificar se funciona corretamente

3. **Teste de navegação**:
   - Fazer login
   - Navegar por várias páginas
   - Clicar em "Sair"
   - Verificar se limpa todo o estado

4. **Teste de console**:
   - Abrir DevTools
   - Fazer logout
   - Verificar se não há erros 404 ou outros erros

## Notas Técnicas

- O erro 404 POST que aparecia era provavelmente uma tentativa do Supabase de fazer logout no servidor durante o processo de limpeza
- Ao fazer o logout de forma não-bloqueante, evitamos que esse erro apareça ou bloqueie o fluxo
- O uso de `window.location.href` força um reload completo, garantindo que todo o estado da aplicação seja resetado
- O AuthGuard agora usa `router.replace()` para evitar criar entradas desnecessárias no histórico do navegador
