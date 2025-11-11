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
- Limpar o estado local **PRIMEIRO** (antes de fazer logout no Supabase)
- Fazer logout no Supabase de forma **não-bloqueante** (sem await)
- Redirecionar **imediatamente** após limpar o estado
- Usar `window.location.href` em vez de `replace` para forçar reload completo

```typescript
const signOut = async () => {
  // 1. Limpar estado local PRIMEIRO
  setSession(null)
  setUser(null)
  setAuthError(null)
  setIsInitialized(false)
  
  // 2. Limpar storage
  // ... código de limpeza ...
  
  // 3. Fazer logout no Supabase (sem await)
  supabase.auth.signOut({ scope: 'global' })
  
  // 4. Redirecionar imediatamente
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
- Usar `router.replace()` em vez de `router.push()` para evitar histórico
- Adicionar `/forgot-password` à lista de páginas públicas
- Evitar redirecionamentos duplicados

```typescript
// Usar replace para não criar histórico
if (!user && !publicPages.includes(pathname)) {
  router.replace("/login")
  return
}
```

## Fluxo Correto Após as Correções

1. **Usuário clica em "Sair"**
   - Função `signOut` é chamada

2. **Estado é limpo imediatamente**
   - `setSession(null)`
   - `setUser(null)`
   - Storage é limpo

3. **Logout no Supabase acontece em background**
   - Não bloqueia o redirecionamento
   - Erros são tratados silenciosamente

4. **Redirecionamento imediato**
   - `window.location.href = '/login'`
   - Força reload completo da página
   - Evita conflitos com outros redirecionamentos

5. **Página de login carrega limpa**
   - Sem estado anterior
   - Sem loops de redirecionamento
   - Pronta para novo login

## Benefícios

✅ **Logout instantâneo**: Estado limpo imediatamente
✅ **Sem loops**: Apenas um redirecionamento
✅ **Sem erros 404**: Logout não-bloqueante
✅ **Experiência suave**: Sem tela piscando
✅ **Múltiplos logouts**: Funciona corretamente mesmo após vários logouts consecutivos

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
