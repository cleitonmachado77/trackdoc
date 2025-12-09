# 🔐 Sistema de Administração - TrackDoc

Sistema de gerenciamento manual de usuários e planos para administradores do sistema.

## 📋 Visão Geral

O sistema de administração permite que super administradores:
- Criem contas de usuários manualmente
- Atribuam planos aos usuários
- Gerenciem status de contas
- Visualizem estatísticas de uso do sistema

## 🚀 Acesso ao Painel

O painel de administração está disponível em:
```
/super-admin
```

**Importante**: Esta página não possui links de acesso em nenhum local do sistema. O acesso é feito diretamente pela URL.

### Requisitos de Acesso
- Usuário deve ter `role = 'super_admin'` na tabela `profiles`
- Usuário deve estar autenticado

## 👥 Gerenciamento de Usuários

### Criar Novo Usuário

1. Acesse o painel de administração
2. Vá para a aba "Usuários"
3. Clique em "Novo Usuário"
4. Preencha os campos:
   - **Email** (obrigatório)
   - **Nome Completo** (obrigatório)
   - **Senha** (obrigatório, mínimo 6 caracteres)
   - **Telefone** (opcional)
   - **Empresa** (opcional)
   - **Plano** (obrigatório)
   - **Função** (user, admin, manager)

### Alterar Plano de Usuário

1. Na lista de usuários, localize o usuário
2. Clique no seletor de plano
3. Escolha o novo plano
4. A alteração é aplicada imediatamente

### Alterar Status de Usuário

Status disponíveis:
- **Ativo**: Acesso normal ao sistema
- **Inativo**: Conta desativada
- **Suspenso**: Conta temporariamente bloqueada

## 📊 Planos Disponíveis

### Plano Básico - R$ 149/mês
- Até 15 usuários
- 10 GB de armazenamento
- Dashboard gerencial
- Upload de documentos
- Solicitação de aprovações
- Suporte por e-mail
- R$ 2,90 por usuário adicional
- R$ 0,49 por GB adicional

### Plano Profissional - R$ 349/mês
- Até 50 usuários
- 50 GB de armazenamento
- Tudo do Básico +
- Biblioteca Pública
- Assinatura eletrônica simples

### Plano Enterprise - R$ 599/mês
- Até 70 usuários
- 120 GB de armazenamento
- Tudo do Profissional +
- Assinatura eletrônica múltipla
- Chat nativo
- Auditoria completa
- Backup automático diário
- Suporte técnico dedicado

## 🗄️ Estrutura do Banco de Dados

### Tabela `profiles`
```sql
- id: UUID (FK para auth.users)
- full_name: TEXT
- email: TEXT (único)
- phone: TEXT
- company: TEXT
- role: TEXT ('user', 'admin', 'manager', 'viewer', 'super_admin')
- status: TEXT ('active', 'inactive', 'suspended', 'pending_confirmation')
- entity_id: UUID (FK para entities)
- created_at: TIMESTAMP
```

### Tabela `plans`
```sql
- id: UUID
- name: TEXT
- type: VARCHAR ('basico', 'profissional', 'enterprise')
- price_monthly: NUMERIC
- max_users: INTEGER
- max_storage_gb: INTEGER
- max_documents: INTEGER
- features: JSONB
- is_active: BOOLEAN
```

### Tabela `subscriptions`
```sql
- id: UUID
- user_id: UUID (FK para profiles)
- plan_id: UUID (FK para plans)
- status: TEXT ('active', 'trial', 'canceled', 'expired')
- start_date: TIMESTAMP
- end_date: TIMESTAMP
- current_users: INTEGER
- current_storage_gb: NUMERIC
```

## 🔧 API de Administração

### Criar Usuário
```
POST /api/admin/create-user
```

Body:
```json
{
  "email": "usuario@email.com",
  "full_name": "Nome do Usuário",
  "password": "senha123",
  "phone": "(11) 99999-9999",
  "company": "Empresa",
  "plan_id": "uuid-do-plano",
  "role": "user"
}
```

## 📝 Fluxo de Contratação

1. Cliente entra em contato (email/WhatsApp)
2. Administrador acessa `/super-admin`
3. Cria a conta do usuário com o plano escolhido
4. Cliente recebe credenciais por email
5. Faturamento é feito separadamente (boleto/PIX/transferência)

## 🔒 Segurança

- Apenas usuários com `role = 'super_admin'` podem acessar
- Senhas são hasheadas pelo Supabase Auth
- Todas as operações são logadas
- Row Level Security (RLS) ativo no banco de dados

## 📞 Suporte

Para dúvidas sobre o sistema de administração:
- Email: contato@trackdoc.com.br
