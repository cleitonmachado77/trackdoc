# Implementação de Força de Alteração de Senha no Primeiro Login

## Resumo da Funcionalidade

Esta implementação adiciona a funcionalidade de forçar usuários criados por administradores a alterarem sua senha no primeiro login, garantindo maior segurança no sistema.

## Como Funciona

1. **Criação de Usuário**: Quando um admin cria um usuário (super-admin ou admin de entidade), o campo `force_password_change` é definido como `true`
2. **Primeiro Login**: Ao fazer login, o sistema verifica se o usuário precisa alterar a senha
3. **Tela de Alteração**: Se necessário, uma tela obrigatória de alteração de senha é exibida
4. **Validação**: A nova senha deve atender critérios de segurança rigorosos
5. **Liberação**: Após alterar a senha, o usuário pode usar o sistema normalmente

## Arquivos Criados/Modificados

### 1. Migração do Banco de Dados
- **`migrations/add_force_password_change.sql`** - Adiciona campos:
  - `force_password_change` (boolean) - Força alteração no próximo login
  - `first_login_completed` (boolean) - Rastreia se completou primeiro login
  - Índices para performance
  - Comentários de documentação

### 2. Componentes de Interface
- **`components/auth/ForcePasswordChange.tsx`** - Tela de alteração obrigatória
  - Interface moderna e intuitiva
  - Validação em tempo real da senha
  - Indicadores visuais de critérios de segurança
  - Confirmação de senha
  - Tratamento de erros

- **`components/auth/PasswordChangeGuard.tsx`** - Wrapper de proteção
  - Intercepta usuários que precisam alterar senha
  - Mostra tela de alteração quando necessário
  - Permite acesso normal após alteração

### 3. Hooks Personalizados
- **`hooks/use-force-password-change.ts`** - Lógica de verificação
  - Verifica se usuário precisa alterar senha
  - Gerencia estado de carregamento
  - Atualiza status após alteração

### 4. APIs de Backend
- **`app/api/check-password-change-required/route.ts`** - Verifica necessidade
- **`app/api/complete-password-change/route.ts`** - Marca como completo

### 5. Atualizações nos Formulários
- **`app/super-admin/page.tsx`** - Define `force_password_change = true`
- **`app/api/create-entity-user/route.ts`** - Define flags para novos usuários

### 6. Sistema de Autenticação
- **`app/components/simple-auth-context.tsx`** - Atualiza `last_login`
- **`app/layout.tsx`** - Adiciona `PasswordChangeGuard`

### 7. Scripts e Documentação
- **`scripts/run-migration-force-password-change.js`** - Script de migração
- **`IMPLEMENTACAO_FORCA_ALTERACAO_SENHA.md`** - Esta documentação

## Critérios de Segurança da Senha

A nova senha deve atender TODOS os critérios:

1. **Mínimo 8 caracteres**
2. **Uma letra maiúscula** (A-Z)
3. **Uma letra minúscula** (a-z)
4. **Um número** (0-9)
5. **Um caractere especial** (!@#$%^&*(),.?":{}|<>)

## Fluxo de Funcionamento

### 1. Criação de Usuário por Admin
```typescript
// Super-admin ou admin de entidade cria usuário
const newProfile = {
  // ... outros campos
  force_password_change: true,    // ← Força alteração
  first_login_completed: false    // ← Primeiro login pendente
}
```

### 2. Primeiro Login do Usuário
```typescript
// Sistema verifica automaticamente
const needsChange = profile.force_password_change === true || 
                   profile.first_login_completed === false
```

### 3. Tela de Alteração Obrigatória
- Interface amigável com validação em tempo real
- Não permite pular ou cancelar
- Critérios de segurança visíveis
- Confirmação de senha obrigatória

### 4. Após Alteração Bem-sucedida
```typescript
// Sistema atualiza automaticamente
const updatedProfile = {
  force_password_change: false,   // ← Remove obrigatoriedade
  first_login_completed: true     // ← Marca como completo
}
```

## Como Executar a Migração

### Opção 1: Script Automatizado
```bash
node scripts/run-migration-force-password-change.js
```

### Opção 2: Manual no Supabase
1. Acesse o painel do Supabase
2. Vá para SQL Editor
3. Execute o conteúdo de `migrations/add_force_password_change.sql`

## Verificação da Implementação

### 1. Verificar Campos no Banco
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('force_password_change', 'first_login_completed');
```

### 2. Testar Fluxo Completo
1. **Criar usuário como admin**:
   - Acesse `/super-admin` ou gerenciador de entidade
   - Crie um novo usuário
   - Verifique se `force_password_change = true` no banco

2. **Fazer login como novo usuário**:
   - Use as credenciais criadas
   - Deve aparecer tela de alteração obrigatória
   - Não deve permitir acesso ao sistema

3. **Alterar senha**:
   - Preencha nova senha seguindo critérios
   - Confirme a senha
   - Clique em "Alterar Senha"

4. **Verificar liberação**:
   - Deve redirecionar para o sistema
   - Verificar se `force_password_change = false` no banco
   - Próximos logins devem ser normais

### 3. Verificar Usuários Existentes
```sql
-- Usuários existentes devem ter first_login_completed = true
SELECT id, email, first_login_completed, force_password_change 
FROM profiles 
WHERE created_at < NOW() - INTERVAL '1 day'
LIMIT 10;
```

## Casos de Uso

### 1. Usuário Criado por Super-Admin
- Admin cria usuário no painel super-admin
- Usuário recebe credenciais por email
- No primeiro login, deve alterar senha
- Após alteração, acesso liberado

### 2. Usuário Criado por Admin de Entidade
- Admin de entidade cria usuário vinculado
- Usuário recebe email de confirmação
- Após confirmar email e fazer primeiro login
- Deve alterar senha antes de acessar sistema

### 3. Usuário Existente (Retrocompatibilidade)
- Usuários criados antes desta funcionalidade
- Marcados automaticamente como `first_login_completed = true`
- Não são afetados pela nova regra
- Continuam com acesso normal

## Segurança Implementada

### 1. Validação Rigorosa
- Critérios de senha complexos
- Validação em tempo real
- Confirmação obrigatória
- Não permite senhas fracas

### 2. Proteção de Rotas
- `PasswordChangeGuard` intercepta todas as rotas
- Usuário não consegue acessar sistema sem alterar
- Funciona mesmo com acesso direto via URL

### 3. Auditoria
- `last_login` atualizado automaticamente
- Logs de alteração de senha
- Rastreamento de primeiro login

### 4. Tratamento de Erros
- Mensagens claras para o usuário
- Fallbacks em caso de erro
- Não quebra o fluxo de login normal

## Considerações Técnicas

### 1. Performance
- Verificação otimizada com índices
- Carregamento assíncrono
- Cache de estado quando possível

### 2. UX/UI
- Interface intuitiva e moderna
- Feedback visual em tempo real
- Mensagens claras e objetivas
- Design responsivo

### 3. Retrocompatibilidade
- Usuários existentes não são afetados
- Migração segura e automática
- Fallbacks para casos edge

### 4. Manutenibilidade
- Código modular e reutilizável
- Documentação completa
- Testes de verificação incluídos

## Troubleshooting

### Erro: "Column does not exist"
- **Causa**: Migração não executada
- **Solução**: Execute a migração no Supabase

### Usuário não consegue alterar senha
- **Causa**: Problemas de permissão ou validação
- **Solução**: Verifique logs do console e API

### Tela de alteração não aparece
- **Causa**: `PasswordChangeGuard` não carregado
- **Solução**: Verifique se está no layout principal

### Usuários existentes sendo forçados
- **Causa**: Migração não atualizou usuários antigos
- **Solução**: Execute script de atualização manual

## Próximos Passos Sugeridos

1. **Notificações**: Email quando senha é alterada
2. **Histórico**: Log de alterações de senha
3. **Políticas**: Configurar critérios de senha por entidade
4. **Expiração**: Forçar alteração periódica de senhas
5. **2FA**: Integrar autenticação de dois fatores

---

## ✅ Implementação Completa

A funcionalidade de força de alteração de senha no primeiro login foi implementada com sucesso, garantindo maior segurança para usuários criados por administradores.