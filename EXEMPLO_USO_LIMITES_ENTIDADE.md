# Exemplo de Uso - Limites de Entidade

## 🎯 Implementação Concluída

A página **Administração > Entidades > Gerenciar Usuários** agora exibe:

### ✅ Informações do Plano
- **Card destacado** com informações do plano atual
- **Contador visual** de usuários utilizados vs. limite máximo
- **Barra de progresso** colorida baseada no uso
- **Alertas automáticos** quando próximo do limite

### ✅ Funcionalidades Implementadas

#### 1. **Card de Informações do Plano**
```
┌─────────────────────────────────────────────────┐
│ 👥 Limite de Usuários                          │
│ Plano Profissional - 15 de 50 usuários        │
│                                            35   │
│                                    usuários     │
│                                    restantes    │
│                                                 │
│ Uso atual                                  30%  │
│ ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░     │
└─────────────────────────────────────────────────┘
```

#### 2. **Alertas Dinâmicos**

**Quando próximo do limite (80%+):**
```
⚠️ Próximo do limite
Você está usando 85% do seu limite de usuários.
```

**Quando limite atingido:**
```
🚫 Limite de usuários atingido
Para criar mais usuários, faça upgrade do seu plano ou remova usuários inativos.
```

#### 3. **Botão Inteligente**
- **Normal**: "Cadastrar Usuário" (quando há vagas)
- **Desabilitado**: "Limite Atingido" (quando não há vagas)
- **Contador**: Mostra "15/50 usuários" ao lado do botão

### ✅ Cores e Estados

#### Barra de Progresso:
- **Verde** (0-79%): Uso normal
- **Amarelo** (80-89%): Próximo do limite
- **Vermelho** (90-100%): Limite crítico/atingido

#### Alertas:
- **Azul**: Informações do plano
- **Amarelo**: Aviso de proximidade do limite
- **Vermelho**: Limite atingido

## 🔄 Atualização Automática

### Quando acontece:
- ✅ **Após criar usuário**: Contadores atualizados
- ✅ **Após inativar usuário**: Contadores atualizados
- ✅ **Após excluir usuário**: Contadores atualizados
- ✅ **Ao carregar página**: Busca informações atuais

### Como funciona:
```typescript
// Hook usado no componente
const { planInfo, loading, error, refreshPlanInfo } = useEntityPlan(entityInfo?.id)

// Após operações que afetam contadores
await fetchEntityUsers()
await refreshPlanInfo() // Atualiza informações do plano
```

## 📱 Interface Responsiva

### Desktop:
```
┌─────────────────────────────────────────────────────────────┐
│ 🏢 Usuários da Entidade                    15/50  [Cadastrar] │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 👥 Limite de Usuários                              35  │ │
│ │ Plano Profissional - 15 de 50 usuários    usuários   │ │
│ │                                           restantes   │ │
│ │ ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 30%      │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Mobile:
```
┌─────────────────────────┐
│ 🏢 Usuários da Entidade │
│ 15/50 usuários          │
│ [Cadastrar Usuário]     │
│                         │
│ ┌─────────────────────┐ │
│ │ 👥 Limite           │ │
│ │ 15/50 usuários      │ │
│ │ 35 restantes        │ │
│ │ ████░░░░░░░░ 30%    │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

## 🧪 Como Testar

### 1. **Executar Migração**
```sql
-- Execute no Supabase SQL Editor:
-- migrations/fix_entity_admin_subscriptions_simple.sql
```

### 2. **Acessar a Página**
```
Administração > Entidades > Gerenciar Usuários
```

### 3. **Verificar Exibição**
- ✅ Card azul com informações do plano
- ✅ Contador "X/Y usuários" no header
- ✅ Barra de progresso colorida
- ✅ Botão habilitado/desabilitado conforme limite

### 4. **Testar Criação**
- ✅ Criar usuário quando há vagas disponíveis
- ✅ Verificar se contador atualiza automaticamente
- ✅ Tentar criar quando limite atingido (deve mostrar erro)

### 5. **Testar Estados**
```typescript
// Simular diferentes estados de uso:
// 30% = Verde (normal)
// 85% = Amarelo (próximo do limite)
// 100% = Vermelho (limite atingido)
```

## 🎨 Personalização

### Alterar Cores:
```typescript
// No componente entity-user-management.tsx
const progressColor = (planInfo.currentUsers / planInfo.maxUsers) >= 0.9 
  ? 'bg-red-500'    // Vermelho para 90%+
  : (planInfo.currentUsers / planInfo.maxUsers) >= 0.8 
    ? 'bg-yellow-500' // Amarelo para 80%+
    : 'bg-blue-500'   // Azul para menos de 80%
```

### Alterar Limites de Alerta:
```typescript
// Alerta em 80% (pode alterar para 70%, 90%, etc.)
{planInfo.canCreateUser && (planInfo.currentUsers / planInfo.maxUsers) >= 0.8 && (
  // Componente de alerta
)}
```

## ✅ Resultado Final

A página agora mostra **claramente**:

1. **Quantos usuários** a entidade pode ter no total
2. **Quantos usuários** já foram criados
3. **Quantos usuários** ainda podem ser criados
4. **Alertas visuais** quando próximo do limite
5. **Bloqueio automático** quando limite atingido
6. **Atualização em tempo real** dos contadores

**A implementação está completa e funcional!** 🎉

### Próximos Passos (Opcionais):
- [ ] Adicionar tooltip com detalhes do plano
- [ ] Mostrar histórico de uso de usuários
- [ ] Link direto para upgrade de plano
- [ ] Notificações por email quando próximo do limite