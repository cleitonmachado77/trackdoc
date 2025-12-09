# ⚡ Início Rápido - Painel de Administração

## 🚀 3 Passos para Começar

### 1️⃣ Executar Migração do Banco (5 min)

Acesse o Supabase SQL Editor e execute:

```sql
-- Remover colunas do Stripe
ALTER TABLE plans 
DROP COLUMN IF EXISTS stripe_price_id,
DROP COLUMN IF EXISTS stripe_product_id;

ALTER TABLE subscriptions 
DROP COLUMN IF EXISTS stripe_customer_id,
DROP COLUMN IF EXISTS stripe_subscription_id;

-- Atualizar planos
UPDATE plans SET
  name = 'Básico',
  price_monthly = 149.00,
  max_users = 15,
  max_storage_gb = 10
WHERE type = 'basico';

UPDATE plans SET
  name = 'Profissional',
  price_monthly = 349.00,
  max_users = 50,
  max_storage_gb = 50
WHERE type = 'profissional';

UPDATE plans SET
  name = 'Enterprise',
  price_monthly = 599.00,
  max_users = 70,
  max_storage_gb = 120
WHERE type = 'enterprise';
```

### 2️⃣ Criar Super Admin (1 min)

```sql
-- Substitua pelo seu email
UPDATE profiles 
SET role = 'super_admin'
WHERE email = 'seu-email@dominio.com';

-- Verificar
SELECT email, role FROM profiles WHERE role = 'super_admin';
```

### 3️⃣ Acessar Painel (1 min)

1. Faça login no sistema
2. Acesse: `https://seu-dominio.com.br/super-admin`
3. Pronto! 🎉

## 📋 Criar Primeiro Usuário

1. Clique em **"Novo Usuário"**
2. Preencha:
   - Email: `cliente@empresa.com`
   - Nome: `João Silva`
   - Senha: `senha123` (mínimo 6 caracteres)
   - Plano: Selecione um dos 3 planos
3. Clique em **"Criar Usuário"**
4. Usuário criado! ✅

## 🎯 Funcionalidades Principais

### Criar Usuários
- Aba "Usuários" → "Novo Usuário"
- Selecione o plano (mostra funcionalidades)
- Preencha dados básicos
- Pronto!

### Alterar Plano
- Localize usuário na lista
- Clique no seletor de plano
- Escolha novo plano
- Alteração imediata!

### Monitorar Uso
- Coluna "Uso" mostra:
  - Documentos criados
  - Armazenamento usado
  - % do limite

### Alterar Status
- Clique no status do usuário
- Escolha: Ativo, Inativo ou Suspenso
- Alteração imediata!

## 🔍 Filtros Úteis

- **Busca**: Nome, email ou empresa
- **Status**: Todos, Ativos, Inativos, Suspensos
- **Plano**: Todos, Básico, Profissional, Enterprise

## 📊 Planos Disponíveis

| Plano | Preço | Usuários | Armazenamento |
|-------|-------|----------|---------------|
| Básico | R$ 149/mês | 15 | 10 GB |
| Profissional | R$ 349/mês | 50 | 50 GB |
| Enterprise | R$ 599/mês | 70 | 120 GB |

## 🎨 Funcionalidades por Plano

### ✅ Básico
- Dashboard gerencial
- Upload de documentos
- Solicitação de aprovações
- Suporte por email

### ✅ Profissional
- Tudo do Básico +
- Biblioteca Pública
- Assinatura eletrônica simples

### ✅ Enterprise
- Tudo do Profissional +
- Assinatura eletrônica múltipla
- Chat nativo
- Auditoria completa
- Backup automático
- Suporte dedicado

## 🔐 Segurança

- ✅ Apenas super_admin acessa
- ✅ Senhas hasheadas automaticamente
- ✅ Sem link público para o painel
- ✅ Acesso direto pela URL

## 📞 Fluxo de Contratação

```
Cliente entra em contato
        ↓
Admin cria conta no painel
        ↓
Cliente recebe credenciais
        ↓
Faturamento separado (boleto/PIX)
```

## 🆘 Problemas Comuns

### Não consigo acessar o painel
- ✅ Verifique se está logado
- ✅ Confirme que é super_admin
- ✅ Acesse pela URL: `/super-admin`

### Erro ao criar usuário
- ✅ Email já cadastrado?
- ✅ Senha tem 6+ caracteres?
- ✅ Plano selecionado?

### Estatísticas não aparecem
- ✅ Clique em "Atualizar"
- ✅ Aguarde alguns segundos

## 📚 Documentação Completa

- **Acesso ao Painel**: `ACESSO_PAINEL_ADMIN.md`
- **Sistema de Administração**: `docs/SISTEMA_ADMINISTRACAO.md`
- **Controle de Acesso**: `docs/CONTROLE_ACESSO_PLANOS.md`
- **Resumo de Alterações**: `RESUMO_ALTERACOES.md`

## 💡 Dicas

1. Use os **filtros** para encontrar usuários rapidamente
2. Monitore a coluna **"Uso"** para identificar limites
3. Badge **vermelho** = usuário usando >80% do plano
4. Clique em **"Atualizar"** para dados em tempo real
5. Painel é **responsivo** - funciona em mobile

## 🎯 Próximos Passos

1. ✅ Executar migração
2. ✅ Criar super admin
3. ✅ Acessar painel
4. ✅ Criar primeiro usuário
5. 🎉 Sistema pronto para uso!

---

**Link do Painel:** `/super-admin`

**Suporte:** contato@trackdoc.com.br
