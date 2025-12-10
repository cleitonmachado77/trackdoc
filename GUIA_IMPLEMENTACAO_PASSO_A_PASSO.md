# Guia de Implementação - Passo a Passo

## 🎯 Objetivo
Implementar a lógica onde usuários criados por admin de entidade são limitados pelo plano do admin.

## 📋 Pré-requisitos
- Acesso ao banco de dados Supabase
- Permissões para executar migrações SQL
- Node.js configurado para executar scripts

## 🚀 Passo 1: Executar Migração Simples

### Execute a migração básica:
```sql
-- Arquivo: migrations/fix_entity_admin_subscriptions_simple.sql
```

Esta migração:
- ✅ Vincula subscriptions dos admins às entidades
- ✅ Cria função `check_entity_user_limit()`
- ✅ Configura permissões necessárias

### Como executar:
1. Copie o conteúdo de `migrations/fix_entity_admin_subscriptions_simple.sql`
2. Execute no SQL Editor do Supabase
3. Verifique se não há erros

## 🧪 Passo 2: Testar a Implementação

### Execute o script de teste:
```bash
npx tsx scripts/test-entity-limits-simple.ts
```

### O que o teste verifica:
- ✅ Busca entidades existentes
- ✅ Testa função SQL `check_entity_user_limit()`
- ✅ Verifica admins de entidade
- ✅ Lista subscriptions ativas
- ✅ Mostra entity_subscriptions

### Resultado esperado:
```
🧪 Testando lógica de limites de entidade...

1️⃣ Buscando entidades...
✅ Encontradas 3 entidades:
   1. Empresa A - Usuários: 5/15
   2. Empresa B - Usuários: 2/50
   3. Empresa C - Usuários: 0/5

2️⃣ Testando função check_entity_user_limit...

🔍 Testando entidade: Empresa A
   📊 Resultado:
      Pode criar usuário: ✅ Sim
      Usuários atuais: 5
      Máximo permitido: 15
      Usuários restantes: 10
      Tipo do plano: basico
      Admin ID: uuid-do-admin
      Subscription ID: uuid-da-subscription
```

## 🔧 Passo 3: Verificar API de Criação

### A API já está configurada:
- ✅ Arquivo: `app/api/create-entity-user/route.ts`
- ✅ Verifica limites antes de criar usuário
- ✅ Atualiza contadores após criação
- ✅ Retorna erro se limite atingido

### Teste manual da API:
```bash
curl -X POST http://localhost:3000/api/create-entity-user \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Teste Usuario",
    "email": "teste@exemplo.com",
    "password": "123456",
    "entity_id": "uuid-da-entidade",
    "entity_role": "user"
  }'
```

### Resposta esperada (sucesso):
```json
{
  "success": true,
  "user": {
    "id": "uuid-do-usuario",
    "full_name": "Teste Usuario",
    "email": "teste@exemplo.com",
    "entity_role": "user",
    "status": "pending_confirmation"
  },
  "message": "Usuário Teste Usuario criado com sucesso!",
  "planInfo": {
    "maxUsers": 15,
    "currentUsers": 6,
    "remainingUsers": 9
  }
}
```

### Resposta esperada (limite atingido):
```json
{
  "error": "Limite de usuários atingido. Plano atual permite 15 usuários e já possui 15 usuários ativos.",
  "details": {
    "maxUsers": 15,
    "currentUsers": 15,
    "remainingUsers": 0
  }
}
```

## 🎨 Passo 4: Usar Componentes Frontend

### Hook para verificar limites:
```typescript
import { useCanCreateEntityUser } from '@/hooks/use-entity-plan'

function CreateUserButton({ entityId }: { entityId: string }) {
  const { canCreate, remainingUsers, currentUsers, maxUsers, loading } = useCanCreateEntityUser(entityId)
  
  if (loading) return <div>Carregando...</div>
  
  return (
    <div>
      <button disabled={!canCreate}>
        {canCreate 
          ? `Criar Usuário (${remainingUsers} vagas restantes)` 
          : `Limite atingido (${currentUsers}/${maxUsers})`
        }
      </button>
      
      {!canCreate && (
        <p className="text-red-600 text-sm mt-2">
          Para criar mais usuários, faça upgrade do seu plano
        </p>
      )}
    </div>
  )
}
```

### Componente de status:
```typescript
import { EntityUserLimits } from '@/components/entity-user-limits'

function EntityDashboard({ entityId }: { entityId: string }) {
  return (
    <div>
      <h1>Dashboard da Entidade</h1>
      
      <EntityUserLimits 
        entityId={entityId}
        showCreateButton={true}
        onCreateUser={() => {
          // Abrir modal de criação de usuário
        }}
      />
    </div>
  )
}
```

## 🔍 Passo 5: Verificar Funcionamento

### Cenários de teste:

#### 1. **Entidade com limite disponível:**
- ✅ Admin tem plano ativo
- ✅ `current_users < max_users`
- ✅ API permite criação
- ✅ Contador é incrementado

#### 2. **Entidade no limite:**
- ✅ Admin tem plano ativo
- ✅ `current_users = max_users`
- ✅ API retorna erro
- ✅ Interface mostra limite atingido

#### 3. **Entidade sem plano:**
- ✅ Admin não tem subscription ativa
- ✅ API retorna erro
- ✅ Interface mostra erro

### Comandos para verificar:

```sql
-- Verificar subscriptions vinculadas
SELECT 
  e.name as entity_name,
  p.full_name as admin_name,
  s.current_users,
  pl.max_users,
  pl.type as plan_type
FROM entities e
JOIN profiles p ON p.entity_id = e.id AND p.entity_role = 'admin'
JOIN subscriptions s ON s.user_id = p.id AND s.status = 'active'
JOIN plans pl ON pl.id = s.plan_id;

-- Testar função para entidade específica
SELECT * FROM check_entity_user_limit('uuid-da-entidade');
```

## ✅ Passo 6: Validação Final

### Checklist de validação:

- [ ] **Migração executada** sem erros
- [ ] **Função SQL** retorna resultados corretos
- [ ] **API de criação** verifica limites
- [ ] **Contadores** são atualizados
- [ ] **Interface** mostra status correto
- [ ] **Testes** passam sem erros

### Logs para monitorar:

```bash
# Logs da API
tail -f logs/api.log | grep "create-entity-user"

# Verificar contadores no banco
SELECT entity_id, COUNT(*) as real_users 
FROM profiles 
WHERE entity_id IS NOT NULL 
  AND status IN ('active', 'pending_confirmation')
  AND deleted_at IS NULL
GROUP BY entity_id;
```

## 🎉 Resultado Final

Após seguir todos os passos:

1. **✅ Regra implementada:** Usuários de entidade limitados pelo plano do admin
2. **✅ Verificação automática:** API verifica limites antes de criar
3. **✅ Contadores atualizados:** Sistema mantém contagem correta
4. **✅ Interface responsiva:** Mostra status e limites em tempo real
5. **✅ Tratamento de erros:** Mensagens claras quando limite atingido

**A implementação está completa e funcional!** 🚀

## 🆘 Solução de Problemas

### Erro: "Função não encontrada"
```sql
-- Verificar se função foi criada
SELECT proname FROM pg_proc WHERE proname = 'check_entity_user_limit';

-- Recriar se necessário
-- Execute novamente: migrations/fix_entity_admin_subscriptions_simple.sql
```

### Erro: "Subscription não encontrada"
```sql
-- Verificar subscriptions dos admins
SELECT p.full_name, p.entity_id, s.id as subscription_id
FROM profiles p
LEFT JOIN subscriptions s ON s.user_id = p.id AND s.status = 'active'
WHERE p.entity_role = 'admin' AND p.entity_id IS NOT NULL;
```

### Erro: "Contadores incorretos"
```sql
-- Recalcular contadores manualmente
UPDATE subscriptions 
SET current_users = (
  SELECT COUNT(*) 
  FROM profiles 
  WHERE entity_id = subscriptions.entity_id 
    AND status IN ('active', 'pending_confirmation')
    AND deleted_at IS NULL
)
WHERE entity_id IS NOT NULL;
```