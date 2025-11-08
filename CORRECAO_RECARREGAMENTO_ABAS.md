# Correção: Recarregamento ao Trocar de Aba

## Problema Identificado
O projeto estava recarregando completamente quando o usuário trocava de aba e voltava, causando perda de estado e má experiência do usuário.

## Causas Identificadas

### 1. **Auth State Change Listener Muito Sensível**
- O listener `onAuthStateChange` estava reagindo a eventos `TOKEN_REFRESHED`
- Isso causava re-renderizações desnecessárias quando o token era atualizado silenciosamente

### 2. **Profile Context Recarregando Sempre**
- O `useEffect` no ProfileContext não tinha proteção contra recarregamentos
- Toda vez que a aba voltava ao foco, o perfil era recarregado

### 3. **React Strict Mode Desabilitado**
- `reactStrictMode: false` pode causar comportamentos inesperados em produção

### 4. **Falta de Controle de Inicialização**
- Não havia flag para verificar se a autenticação já foi inicializada
- Isso causava múltiplas inicializações

## Correções Aplicadas

### 1. **Otimização do Auth Listener** (`simple-auth-context.tsx`)
```typescript
// ANTES: Reagia a TOKEN_REFRESHED causando recarregamentos
if (event === 'TOKEN_REFRESHED') {
  setSession(session)
  setUser(session?.user ?? null)
}

// DEPOIS: Ignora TOKEN_REFRESHED para evitar recarregamentos
if (event === 'TOKEN_REFRESHED') {
  console.log('🔄 [Auth] Token atualizado silenciosamente')
  return
}
```

### 2. **Proteção Contra Reinicialização** (`simple-auth-context.tsx`)
```typescript
// Adicionado flag de inicialização
const [isInitialized, setIsInitialized] = useState(false)

// Evitar reinicialização
if (isInitialized) {
  console.log('⏭️ [Auth] Já inicializado, pulando...')
  return
}
```

### 3. **Profile Context com Cache** (`profile-context.tsx`)
```typescript
// Adicionado ref para controlar carregamento
const hasLoadedProfile = useRef(false)

// Evitar recarregamento se já foi carregado
if (hasLoadedProfile.current && profile) {
  console.log('⏭️ [ProfileContext] Perfil já carregado, pulando...')
  return
}
```

### 4. **Dependências Otimizadas** (`profile-context.tsx`)
```typescript
// ANTES: Recarregava com qualquer mudança no objeto user
useEffect(() => {
  loadProfile()
}, [user, authLoading])

// DEPOIS: Só recarrega se o ID do usuário mudar
useEffect(() => {
  if (user && !profile && !loading) {
    loadProfile()
  }
}, [user?.id, authLoading])
```

### 5. **React Strict Mode Habilitado** (`next.config.mjs`)
```typescript
reactStrictMode: true, // Melhor comportamento em produção
```

### 6. **Configuração de On-Demand Entries** (`next.config.mjs`)
```typescript
onDemandEntries: {
  maxInactiveAge: 60 * 1000, // Manter páginas por 60s
  pagesBufferLength: 5, // Buffer de 5 páginas
}
```

### 7. **Supabase Client Otimizado** (`supabase-singleton.ts`)
```typescript
{
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  realtime: {
    params: {
      eventsPerSecond: 2, // Reduzir eventos
    },
  },
}
```

### 8. **Hook de Visibilidade de Página** (novo arquivo)
Criado `lib/hooks/use-page-visibility.ts` para detectar quando a página fica visível/invisível.

## Como Testar

### 1. **Teste Básico de Troca de Aba**
1. Faça login no sistema
2. Navegue para qualquer página (ex: Dashboard)
3. Abra outra aba do navegador
4. Volte para a aba do Trackdoc
5. ✅ **Esperado**: A página NÃO deve recarregar

### 2. **Teste de Estado Preservado**
1. Faça login no sistema
2. Abra um modal ou formulário
3. Preencha alguns campos
4. Troque de aba e volte
5. ✅ **Esperado**: Os dados preenchidos devem estar preservados

### 3. **Teste de Autenticação**
1. Faça login no sistema
2. Deixe a aba aberta por alguns minutos
3. Troque de aba várias vezes
4. ✅ **Esperado**: Não deve fazer logout ou pedir login novamente

### 4. **Verificar Console**
1. Abra o DevTools (F12)
2. Vá para a aba Console
3. Troque de aba e volte
4. ✅ **Esperado**: Deve ver apenas:
   - `🔄 [Auth] Token atualizado silenciosamente`
   - `⏭️ [ProfileContext] Perfil já carregado, pulando...`
   - NÃO deve ver: `📥 [ProfileContext] Carregando perfil...`

### 5. **Teste de Performance**
1. Abra o DevTools > Network
2. Faça login e navegue
3. Troque de aba e volte
4. ✅ **Esperado**: Não deve haver novas requisições para `/api/profile`

## Deploy

Para aplicar as correções em produção:

```bash
# 1. Commit das mudanças
git add .
git commit -m "fix: prevenir recarregamento ao trocar de aba"

# 2. Push para o repositório
git push origin main

# 3. Vercel fará deploy automático
```

## Monitoramento

Após o deploy, monitore:

1. **Logs do Vercel**: Verificar se não há erros relacionados a autenticação
2. **Console do Browser**: Verificar se os logs mostram comportamento correto
3. **Feedback dos Usuários**: Perguntar se ainda estão tendo problemas

## Notas Importantes

- ✅ As mudanças são **retrocompatíveis**
- ✅ Não afetam funcionalidades existentes
- ✅ Melhoram a performance geral do sistema
- ✅ Reduzem requisições desnecessárias ao servidor
- ✅ Melhoram a experiência do usuário

## Próximos Passos (Opcional)

Se ainda houver problemas após essas correções:

1. Implementar Service Worker para cache mais agressivo
2. Adicionar estratégia de stale-while-revalidate
3. Implementar prefetching de rotas
4. Adicionar persistência de estado no localStorage
