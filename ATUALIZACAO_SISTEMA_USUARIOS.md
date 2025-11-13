# Atualização: Sistema de Ativação/Inativação de Usuários

## Mudanças Implementadas

Substituído o sistema de exclusão direta de usuários por um sistema de ativação/inativação com período de carência para exclusão permanente.

## Arquivo Modificado

- `app/components/admin/entity-user-management.tsx`

## Funcionalidades Adicionadas

### 1. Sistema de Ativação/Inativação

**Botão "Inativar"** (para usuários ativos):
- Altera o status do usuário para `inactive`
- Registra a data de inativação (`inactivated_at`)
- Bloqueia completamente o acesso do usuário à plataforma
- Impede qualquer ação dentro do sistema

**Botão "Ativar"** (para usuários inativos):
- Restaura o status do usuário para `active`
- Remove a data de inativação
- Restaura todas as permissões
- Permite login e acesso normal

### 2. Período de Carência para Exclusão

**Regra dos 7 Dias:**
- Usuário inativo só pode ser excluído após 7 dias
- Contador regressivo exibido no menu de ações
- Botão de exclusão aparece apenas quando elegível

**Indicador Visual:**
- Mostra quantos dias faltam para exclusão
- Exemplo: "Exclusão disponível em 5 dia(s)"

### 3. Exclusão Permanente

**Botão "Excluir Permanentemente":**
- Aparece apenas para usuários inativos há mais de 7 dias
- Remove definitivamente o usuário do banco de dados
- Ação irreversível com confirmação explícita

### 4. Modais de Confirmação

**Modal de Mudança de Status:**
- Título dinâmico (Inativar/Ativar)
- Descrição clara das consequências
- Cores diferenciadas:
  - Laranja para inativação
  - Verde para ativação
- Lista de efeitos da ação

**Modal de Exclusão Permanente:**
- Alerta vermelho destacado
- Lista clara das consequências
- Confirmação explícita necessária
- Texto enfatizando irreversibilidade

## Funções Implementadas

### `toggleUserStatus()`
- Alterna entre ativo/inativo
- Atualiza `status` e `inactivated_at`
- Validações de segurança

### `deleteUserPermanently()`
- Exclui definitivamente do banco
- Valida período de 7 dias
- Impede auto-exclusão

### `canDeleteUser(user)`
- Verifica se usuário está inativo
- Calcula dias desde inativação
- Retorna true se >= 7 dias

### `getDaysUntilDeletion(user)`
- Calcula dias restantes
- Retorna 0 se já elegível
- Usado para exibir contador

## Interface do Usuário

### Dropdown Menu (Ações)
```
┌─────────────────────────────┐
│ ✏️  Editar                  │
│ ⚠️  Inativar / ✅ Ativar    │
│ 🗑️  Excluir Permanentemente │ (se elegível)
│ ⏳  Exclusão em X dia(s)    │ (se não elegível)
└─────────────────────────────┘
```

### Cores dos Botões
- **Inativar**: Laranja (#ea580c)
- **Ativar**: Verde (#16a34a)
- **Excluir**: Vermelho (destructive)

## Fluxo de Uso

### Inativar Usuário
1. Admin clica em "Inativar" no menu
2. Modal de confirmação aparece
3. Admin confirma a inativação
4. Status muda para `inactive`
5. Data de inativação é registrada
6. Usuário perde acesso imediatamente

### Ativar Usuário
1. Admin clica em "Ativar" no menu
2. Modal de confirmação aparece
3. Admin confirma a ativação
4. Status muda para `active`
5. Data de inativação é removida
6. Usuário recupera acesso

### Excluir Permanentemente
1. Usuário deve estar inativo há 7+ dias
2. Botão "Excluir Permanentemente" aparece
3. Admin clica no botão
4. Modal de confirmação crítica aparece
5. Admin confirma exclusão
6. Usuário é removido do banco
7. Ação irreversível

## Validações de Segurança

1. **Auto-proteção**: Usuário não pode alterar próprio status
2. **Período mínimo**: 7 dias obrigatórios antes de exclusão
3. **Confirmação dupla**: Modais de confirmação para todas ações
4. **Feedback claro**: Mensagens explicativas em cada etapa
5. **Reversibilidade**: Inativação pode ser revertida

## Campos do Banco de Dados

### Tabela `profiles`
- `status`: 'active' | 'inactive' | 'suspended'
- `inactivated_at`: timestamp (nullable)
- `updated_at`: timestamp (atualizado em cada mudança)

## Benefícios

1. **Segurança**: Evita exclusões acidentais
2. **Recuperação**: Usuários podem ser reativados
3. **Conformidade**: Período de carência para decisões
4. **Auditoria**: Histórico de inativação preservado
5. **Flexibilidade**: Gestão mais granular de usuários

## Observações Importantes

- **Usuários inativos não podem fazer login** - Bloqueio automático no momento do login
- Todas as ações na plataforma são bloqueadas para inativos
- O contador de 7 dias começa na data de inativação (campo `updated_at`)
- A exclusão permanente remove todos os dados
- Não há recuperação após exclusão permanente
- Badge de "Inativo" exibido em **laranja** com ícone de exclamação ⚠️

## Bloqueio de Login

Quando um usuário inativo tenta fazer login:
1. Credenciais são validadas normalmente
2. Sistema verifica o status do perfil
3. Se status = 'inactive' ou 'suspended':
   - Logout automático é executado
   - Mensagem de erro é exibida
   - Acesso é negado
4. Mensagem exibida: "Sua conta está inativa. Entre em contato com o administrador."

## Teste Recomendado

1. Inativar um usuário de teste
2. Verificar que não pode fazer login
3. Verificar contador de dias no menu
4. Tentar excluir antes de 7 dias (deve falhar)
5. Ativar o usuário novamente
6. Verificar que pode fazer login
7. Inativar novamente e aguardar 7 dias
8. Verificar que botão de exclusão aparece
9. Excluir permanentemente
10. Confirmar que usuário foi removido
