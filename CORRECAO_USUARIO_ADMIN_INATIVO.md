# 🔧 Correção: Usuário Admin Inativo na Seleção de Gerente

## 📋 Problema Identificado

O usuário admin único da conta não aparecia na lista de seleção de gerentes ao criar departamentos porque estava com status `inactive`. Isso impedia a criação de departamentos pois o gerente é obrigatório.

## 🔍 Causa Raiz

Os usuários são criados com `status: 'inactive'` por padrão e só ficam ativos após confirmarem o email. O hook `use-users` filtrava apenas usuários com status `active`, excluindo admins inativos.

## ✅ Solução Implementada

### 1. Modificação do Hook `use-users`

**Arquivo:** `hooks/use-users.ts`

- ✅ **Inclusão de usuários inativos**: Agora busca usuários com status `active` e `inactive`
- ✅ **Ordenação inteligente**: Usuários ativos aparecem primeiro, depois inativos
- ✅ **Interface atualizada**: Adicionado campo `status` na interface `User`

### 2. Melhorias no Formulário de Departamentos

**Arquivo:** `app/components/admin/department-management.tsx`

- ✅ **Indicação visual**: Usuários inativos aparecem com badge "Inativo"
- ✅ **Mensagem informativa**: Aviso quando usuário inativo é selecionado como gerente
- ✅ **Botão de ativação**: Para usuários admin, botão para ativar automaticamente

### 3. Utilitário de Ativação

**Arquivo:** `lib/activate-admin-user.ts`

- ✅ **Função de ativação**: `activateAdminUser()` para ativar usuários admin
- ✅ **Busca de inativos**: `getInactiveAdminUsers()` para listar admins inativos
- ✅ **Validações**: Verifica se é admin antes de ativar

## 🎯 Comportamento Atual

### Na Seleção de Gerente:

1. **Usuários ativos**: ✅ Aparecem normalmente no topo da lista
2. **Usuários inativos**: ✅ Aparecem com badge "Inativo" após os ativos
3. **Admin inativo selecionado**: ℹ️ Mostra aviso + botão "Ativar usuário admin"

### Mensagens Informativas:

- **Usuário inativo selecionado**: "O usuário selecionado está inativo. Ele poderá gerenciar o departamento após ativar sua conta."
- **Botão de ativação**: Disponível apenas para usuários com role `admin`

## 🔄 Fluxo de Correção

```
1. Admin tenta criar departamento
2. Seleciona usuário inativo como gerente
3. Sistema mostra aviso + botão de ativação
4. Admin clica "Ativar usuário admin"
5. Sistema chama API /api/fix-user-status
6. Usuário é ativado automaticamente
7. Página recarrega com usuário ativo
```

## 🚀 Como Usar

### Para Criar Departamento com Admin Inativo:

1. Acesse **Admin > Departamentos**
2. Clique **"Novo Departamento"**
3. Preencha o nome do departamento
4. Selecione o usuário admin (mesmo que inativo)
5. Se aparecer o aviso, clique **"Ativar usuário admin"**
6. Aguarde o recarregamento da página
7. Complete a criação do departamento

### Para Ativar Usuários Manualmente:

```typescript
import { activateAdminUser } from '@/lib/activate-admin-user'

const result = await activateAdminUser(userId)
if (result.success) {
  console.log(result.message)
} else {
  console.error(result.error)
}
```

## 📝 APIs Relacionadas

- **`/api/fix-user-status`**: Corrige status de usuários inativos que confirmaram email
- **`/api/activate-entity-user`**: Ativa usuário específico por ID

## 🔧 Arquivos Modificados

- `hooks/use-users.ts` - Inclusão de usuários inativos
- `app/components/admin/department-management.tsx` - Interface melhorada
- `lib/activate-admin-user.ts` - Utilitários de ativação (novo)

## ✨ Benefícios

- ✅ **Criação de departamentos desbloqueada**: Admin pode criar departamentos mesmo estando inativo
- ✅ **Ativação automática**: Botão para ativar admin com um clique
- ✅ **Feedback visual**: Usuário sabe quando alguém está inativo
- ✅ **Experiência melhorada**: Processo mais fluido para configuração inicial

## ⚠️ Considerações

- Usuários inativos podem ser selecionados como gerentes, mas precisam ativar a conta para funcionar plenamente
- O botão de ativação só aparece para usuários com role `admin`
- A ativação requer que o email tenha sido confirmado no sistema de autenticação