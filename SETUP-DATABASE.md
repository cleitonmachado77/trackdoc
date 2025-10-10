# Configuração do Banco de Dados

Este documento explica como resolver os erros de tabelas não encontradas no projeto.

## Problemas Identificados

Os seguintes erros estão ocorrendo porque as tabelas não existem no banco Supabase:

1. ❌ `notification_feed` não encontrada
2. ❌ `approval_requests` não encontrada  
3. ❌ API `/api/approvals/` retorna 404

## Soluções

### Opção 1: Script Automático (Recomendado)

Execute o script de configuração automática:

```bash
npm run setup-database
```

Este script irá:
- Criar todas as tabelas necessárias
- Configurar índices e relacionamentos
- Criar políticas de segurança (RLS)
- Verificar se tudo foi criado corretamente

### Opção 2: Manual via Supabase Dashboard

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para seu projeto
3. Clique em "SQL Editor" no menu lateral
4. Copie e cole o conteúdo do arquivo `database/setup-tables.sql`
5. Execute o script

### Opção 3: Criar Tabelas Básicas

Se as opções acima não funcionarem, crie as tabelas manualmente:

#### 1. Tabela `profiles`
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name VARCHAR(255),
  avatar_url TEXT,
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. Tabela `documents`
```sql
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_path VARCHAR(500),
  created_by UUID REFERENCES profiles(id),
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. Tabela `approval_requests`
```sql
CREATE TABLE approval_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  approver_id UUID REFERENCES profiles(id),
  status VARCHAR(50) DEFAULT 'pending',
  step_order INTEGER DEFAULT 1,
  comments TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. Tabela `notifications`
```sql
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(50) DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 5. View `notification_feed`
```sql
CREATE VIEW notification_feed AS
SELECT * FROM notifications;
```

## Verificação

Após executar qualquer uma das opções acima:

1. **Reinicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

2. **Faça login novamente** se necessário

3. **Verifique se os erros desapareceram** no console do navegador

## Estrutura das Tabelas Criadas

- **`profiles`**: Perfis dos usuários
- **`documents`**: Documentos do sistema
- **`approval_requests`**: Solicitações de aprovação
- **`notifications`**: Notificações do sistema
- **`notification_feed`**: View para compatibilidade
- **`document_types`**: Tipos de documento

## APIs Criadas

- **`GET /api/approvals`**: Lista aprovações
- **`POST /api/approvals`**: Cria nova aprovação
- **`PUT /api/approvals`**: Atualiza aprovação

## Políticas de Segurança (RLS)

O script configura automaticamente as políticas de Row Level Security para:
- Usuários só veem seus próprios documentos
- Aprovadores só veem aprovações atribuídas a eles
- Usuários só veem suas próprias notificações

## Troubleshooting

### Se o script falhar:
1. Verifique se as variáveis de ambiente estão corretas
2. Confirme se você tem permissões de administrador no Supabase
3. Execute as queries manualmente no SQL Editor

### Se ainda houver erros:
1. Limpe o cache do navegador
2. Reinicie o servidor de desenvolvimento
3. Verifique se todas as tabelas foram criadas no Supabase Dashboard

### Logs úteis:
- Console do navegador (F12)
- Terminal onde o servidor está rodando
- Logs do Supabase Dashboard

## Contato

Se os problemas persistirem, verifique:
- Configuração das variáveis de ambiente
- Permissões no projeto Supabase
- Logs de erro detalhados