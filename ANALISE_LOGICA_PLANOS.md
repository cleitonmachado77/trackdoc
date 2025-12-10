# Análise da Lógica Atual de Planos e Usuários

## Problemas Identificados

### 1. **Falta de Verificação de Limites na Criação de Usuários**
- O arquivo `app/api/create-entity-user/route.ts` não verifica se o admin da entidade pode criar mais usuários
- Não há validação contra os limites do plano do admin da entidade
- A criação de usuários acontece sem considerar o `max_users` do plano

### 2. **Estrutura de Assinatura Inconsistente**
- A tabela `subscriptions` tem campo `entity_id`, mas a lógica não está sendo usada corretamente
- Usuários individuais têm suas próprias assinaturas, mas usuários de entidade deveriam herdar do admin
- Não há conexão clara entre a assinatura do admin da entidade e os usuários criados por ele

### 3. **Contadores de Usuários Desatualizados**
- Existem funções `increment_user_count` e `decrement_user_count` mas não são chamadas na criação de usuários
- O campo `current_users` na tabela `subscriptions` não é atualizado automaticamente
- Não há sincronização entre criação de usuários e atualização dos contadores

### 4. **Lógica de Herança de Plano Ausente**
- Usuários criados por admin de entidade não herdam automaticamente as regras do plano do admin
- Não há verificação se o admin tem permissão para criar mais usuários
- Falta implementação da regra: "usuários são atrelados ao plano do admin da entidade"

## Estrutura Atual vs Estrutura Necessária

### Atual:
```
Admin Individual → Subscription Individual
Usuário Entidade → Sem subscription própria (problemático)
```

### Necessária:
```
Admin Entidade → Subscription com entity_id
├── Usuário 1 da Entidade (herda limites do admin)
├── Usuário 2 da Entidade (herda limites do admin)
└── Usuário N da Entidade (limitado pelo max_users do plano)
```

## Implementação Necessária

### 1. **Verificação de Limites na Criação**
- Antes de criar usuário de entidade, verificar:
  - Se o admin da entidade tem subscription ativa
  - Se ainda há vagas disponíveis no plano (current_users < max_users)
  - Se o admin tem permissão para criar usuários

### 2. **Atualização de Contadores**
- Chamar `increment_user_count` após criação bem-sucedida
- Chamar `decrement_user_count` quando usuário for removido/desativado
- Manter `current_users` sempre atualizado

### 3. **Herança de Permissões**
- Usuários de entidade devem herdar features do plano do admin
- Verificações de funcionalidades devem considerar o plano do admin da entidade
- Limites de armazenamento também devem ser compartilhados

### 4. **Políticas de RLS Ajustadas**
- Usuários de entidade devem poder ver dados baseados no plano do admin
- Verificações de acesso devem considerar a hierarquia admin → usuários

## Próximos Passos

1. **Implementar verificação de limites** em `create-entity-user/route.ts`
2. **Criar função para buscar subscription do admin da entidade**
3. **Atualizar contadores automaticamente** na criação/remoção de usuários
4. **Implementar herança de features** do plano do admin
5. **Criar testes** para validar a lógica implementada

## Arquivos que Precisam ser Modificados

- `app/api/create-entity-user/route.ts` - Adicionar verificação de limites
- `lib/subscription-utils.ts` - Funções para buscar subscription do admin
- `hooks/useSubscription.ts` - Lógica de herança de plano
- `migrations/` - Possível nova migração para ajustar estrutura