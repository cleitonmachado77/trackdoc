# 🔧 Correção dos Contadores do Painel Super-Admin

## 📋 Problema Identificado

O painel super-admin não estava mostrando corretamente:
- ❌ Contagem de documentos por usuário
- ❌ Volume de armazenamento usado
- ❌ Verificação de limites dos planos
- ❌ Bloqueio de upload quando limites são atingidos

## ✅ Solução Implementada

### 1. Funções SQL Criadas

#### `calculate_user_storage_usage(user_id)`
- Calcula uso real de armazenamento e documentos por usuário
- Baseado na tabela `documents` com status != 'deleted'

#### `check_user_plan_limits(user_id)`
- Verifica limites do plano vs uso atual
- Retorna percentuais de uso e status dos limites
- Funciona com subscriptions individuais e de entidade

#### `can_upload_file(user_id, file_size_bytes)`
- Verifica se um upload é permitido
- Considera limites de armazenamento e documentos
- Retorna motivo da rejeição se aplicável

#### `update_subscription_counters(user_id)`
- Atualiza contadores baseado nos dados reais
- Chamada automaticamente por triggers

### 2. Trigger Automático
- Atualiza contadores quando documentos são inseridos/atualizados/deletados
- Mantém dados sempre sincronizados

### 3. Painel Super-Admin Atualizado
- ✅ Nova aba "Limites" para monitoramento
- ✅ Contadores corretos na tabela de usuários
- ✅ Badges de alerta para usuários próximos dos limites
- ✅ Separação entre limites críticos (100%) e avisos (80%+)

### 4. Middleware de Upload
- ✅ Validação antes de uploads
- ✅ Mensagens de erro específicas
- ✅ Avisos quando próximo dos limites

## 🚀 Como Executar a Correção

### Passo 1: Executar Migração
```bash
# Executar o script de correção
npx tsx scripts/fix-super-admin-counters.ts
```

### Passo 2: Verificar Resultado
1. Acesse `/super-admin`
2. Verifique a nova aba "Limites"
3. Confirme que os contadores estão corretos na aba "Usuários"

## 📊 Funcionalidades da Nova Aba "Limites"

### Seção 1: Limites Atingidos (100%)
- Usuários que atingiram limites críticos
- Cards vermelhos com detalhes dos limites
- Ação necessária: upgrade de plano ou limpeza

### Seção 2: Próximos do Limite (80-99%)
- Usuários em zona de alerta
- Cards laranja com percentuais
- Ação recomendada: monitoramento

### Seção 3: Resumo Geral
- Contadores totais por categoria
- Visão executiva do status geral

## 🔍 Informações Mostradas por Usuário

### Na Tabela de Usuários:
```
Docs: 45/100 (45%)
Storage: 8.5/10 GB (85%)
Users: 12/15 (80%)  [apenas para admins de entidade]
```

### Badges de Status:
- 🟢 **Verde**: < 80% do limite
- 🟡 **Amarelo**: 80-99% do limite  
- 🔴 **Vermelho**: 100% do limite (bloqueado)

## 🛡️ Regras de Bloqueio Implementadas

### Upload de Documentos:
1. **Limite de Documentos**: Bloqueia se atingir `max_documents`
2. **Limite de Armazenamento**: Bloqueia se exceder `max_storage_gb`
3. **Sem Plano**: Bloqueia se usuário não tem plano ativo

### Mensagens de Erro:
- "Limite de documentos atingido. Você já possui X documentos de um máximo de Y."
- "Limite de armazenamento seria excedido. Você está usando X GB de Y GB disponíveis."
- "Você não possui um plano ativo. Entre em contato com o administrador."

## 🧪 Como Testar

### Teste 1: Verificar Contadores
1. Acesse `/super-admin`
2. Vá para aba "Usuários"
3. Confirme que os números de documentos e armazenamento estão corretos

### Teste 2: Verificar Limites
1. Acesse aba "Limites"
2. Verifique se usuários próximos dos limites aparecem
3. Confirme os percentuais mostrados

### Teste 3: Testar Bloqueio (Opcional)
1. Crie um usuário com plano básico (10GB, 1000 docs)
2. Faça upload de arquivos até próximo do limite
3. Tente fazer upload que exceda o limite
4. Confirme que o upload é bloqueado com mensagem apropriada

## 📁 Arquivos Criados/Modificados

### Migração:
- `migrations/fix_super_admin_usage_counters.sql`

### Middleware:
- `lib/middleware/upload-limits.ts`

### Hooks:
- `hooks/use-upload-limits.ts`

### Scripts:
- `scripts/fix-super-admin-counters.ts`

### Páginas Modificadas:
- `app/super-admin/page.tsx` (nova aba Limites + contadores corretos)

## 🔧 Manutenção

### Recalcular Contadores Manualmente:
```sql
-- Para um usuário específico
SELECT update_subscription_counters('user-uuid');

-- Para todos os usuários (via script)
UPDATE subscriptions 
SET current_storage_gb = (
  SELECT COALESCE(SUM(file_size) / (1024.0^3), 0)
  FROM documents 
  WHERE created_by = subscriptions.user_id 
    AND status != 'deleted'
)
WHERE status = 'active';
```

### Verificar Funções:
```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%storage%' OR routine_name LIKE '%limit%';
```

## 🎯 Benefícios da Implementação

1. **Visibilidade**: Admins podem ver exatamente o uso de cada usuário
2. **Controle**: Limites são respeitados automaticamente
3. **Prevenção**: Avisos antes de atingir limites críticos
4. **Automação**: Contadores sempre atualizados via triggers
5. **Experiência**: Mensagens claras para usuários sobre limites

## 📞 Suporte

Se houver problemas:
1. Verifique os logs do console no navegador
2. Execute o script de teste: `npx tsx scripts/fix-super-admin-counters.ts`
3. Verifique se as funções SQL foram criadas corretamente
4. Entre em contato com o suporte técnico se necessário