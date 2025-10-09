# Configuração do Sistema de Entidades - TrackDoc

## Problema Identificado
As tabelas necessárias para o sistema de entidades não existem no banco de dados Supabase. Isso impede que usuários sejam criados via convites de entidade.

## Solução: Criar Tabelas Manualmente

### 1. Acesse o Supabase Dashboard
1. Vá para [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione o projeto TrackDoc
4. Vá para **SQL Editor** no menu lateral

### 2. Execute os Comandos SQL

Cole e execute cada bloco SQL abaixo no SQL Editor:

#### Bloco 1: Tabela de Entidades
```sql
-- Criar tabela de entidades
CREATE TABLE IF NOT EXISTS entities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'company',
  status TEXT NOT NULL DEFAULT 'active',
  description TEXT,
  website TEXT,
  phone TEXT,
  address JSONB,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Bloco 2: Tabela de Usuários de Entidades
```sql
-- Criar tabela de usuários de entidades
CREATE TABLE IF NOT EXISTS entity_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'active',
  permissions JSONB DEFAULT '{}',
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(entity_id, user_id)
);
```

#### Bloco 3: Tabela de Convites
```sql
-- Criar tabela de convites para entidades
CREATE TABLE IF NOT EXISTS entity_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  invited_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Bloco 4: Índices
```sql
-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_entities_status ON entities(status);
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);
CREATE INDEX IF NOT EXISTS idx_entity_users_entity_id ON entity_users(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_users_user_id ON entity_users(user_id);
CREATE INDEX IF NOT EXISTS idx_entity_users_status ON entity_users(status);
CREATE INDEX IF NOT EXISTS idx_entity_invitations_entity_id ON entity_invitations(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_invitations_email ON entity_invitations(email);
CREATE INDEX IF NOT EXISTS idx_entity_invitations_token ON entity_invitations(token);
CREATE INDEX IF NOT EXISTS idx_entity_invitations_status ON entity_invitations(status);
```

#### Bloco 5: Triggers
```sql
-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON entities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entity_users_updated_at BEFORE UPDATE ON entity_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entity_invitations_updated_at BEFORE UPDATE ON entity_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Bloco 6: Políticas RLS
```sql
-- Habilitar RLS nas tabelas
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_invitations ENABLE ROW LEVEL SECURITY;

-- Políticas para entities
CREATE POLICY "Users can view entities they belong to" ON entities
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM entity_users 
      WHERE entity_id = entities.id AND status = 'active'
    )
  );

CREATE POLICY "Entity admins can update their entities" ON entities
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM entity_users 
      WHERE entity_id = entities.id AND role IN ('admin', 'manager') AND status = 'active'
    )
  );

CREATE POLICY "Authenticated users can create entities" ON entities
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

#### Bloco 7: Políticas para entity_users
```sql
-- Políticas para entity_users
CREATE POLICY "Users can view entity_users of their entities" ON entity_users
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT user_id FROM entity_users eu2 
      WHERE eu2.entity_id = entity_users.entity_id AND eu2.status = 'active'
    )
  );

CREATE POLICY "Entity admins can manage entity_users" ON entity_users
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM entity_users eu2 
      WHERE eu2.entity_id = entity_users.entity_id 
      AND eu2.role IN ('admin', 'manager') 
      AND eu2.status = 'active'
    )
  );

CREATE POLICY "Users can insert themselves into entities via invitation" ON entity_users
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM entity_invitations 
      WHERE entity_id = entity_users.entity_id 
      AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND status = 'pending'
      AND expires_at > NOW()
    )
  );
```

#### Bloco 8: Políticas para entity_invitations
```sql
-- Políticas para entity_invitations
CREATE POLICY "Entity admins can manage invitations" ON entity_invitations
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM entity_users 
      WHERE entity_id = entity_invitations.entity_id 
      AND role IN ('admin', 'manager') 
      AND status = 'active'
    )
  );

CREATE POLICY "Anyone can view invitations by token" ON entity_invitations
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update invitation status by token" ON entity_invitations
  FOR UPDATE USING (true);
```

#### Bloco 9: Funções Auxiliares
```sql
-- Função para criar entidade e associar o criador como admin
CREATE OR REPLACE FUNCTION create_entity_with_admin(
  entity_name TEXT,
  entity_type TEXT DEFAULT 'company',
  entity_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_entity_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  INSERT INTO entities (name, type, description)
  VALUES (entity_name, entity_type, entity_description)
  RETURNING id INTO new_entity_id;

  INSERT INTO entity_users (entity_id, user_id, role, status)
  VALUES (new_entity_id, current_user_id, 'admin', 'active');

  RETURN new_entity_id;
END;
$$;
```

#### Bloco 10: Dados Iniciais
```sql
-- Inserir uma entidade padrão para testes
INSERT INTO entities (name, type, description) 
VALUES ('TrackDoc Demo', 'company', 'Entidade de demonstração do TrackDoc')
ON CONFLICT DO NOTHING;
```

### 3. Verificar Instalação

Após executar todos os blocos SQL, execute este script para verificar se tudo foi criado corretamente:
``
`bash
cd scripts
node verify-entities-setup.js
```

## Como Testar o Sistema

### 1. Criar uma Entidade de Teste
Após configurar as tabelas, você pode criar uma entidade de teste:

```sql
-- No SQL Editor do Supabase
SELECT create_entity_with_admin('Minha Empresa', 'company', 'Empresa de teste');
```

### 2. Criar um Convite
```sql
-- Substitua os valores pelos IDs reais
INSERT INTO entity_invitations (
  entity_id, 
  email, 
  role, 
  token, 
  expires_at
) VALUES (
  'UUID_DA_ENTIDADE',
  'usuario@exemplo.com',
  'user',
  'token_unico_' || extract(epoch from now()),
  NOW() + INTERVAL '7 days'
);
```

### 3. Testar Aceitação de Convite
Acesse: `http://localhost:3000/accept-invitation/[TOKEN]`

## Próximos Passos

1. **Execute os comandos SQL** no Supabase Dashboard
2. **Execute o script de verificação** para confirmar que tudo está funcionando
3. **Teste o fluxo completo** criando um convite e aceitando-o
4. **Configure um sistema de envio de emails** para os convites (opcional)

## Estrutura das Tabelas Criadas

### `entities`
- Armazena informações das empresas/organizações
- Campos: id, name, type, status, description, etc.

### `entity_users`
- Relaciona usuários com entidades
- Campos: entity_id, user_id, role, status, etc.

### `entity_invitations`
- Gerencia convites para entidades
- Campos: entity_id, email, role, token, status, expires_at, etc.

## Troubleshooting

### Erro: "relation does not exist"
- Certifique-se de que executou todos os blocos SQL
- Verifique se não há erros no SQL Editor

### Erro: "permission denied"
- Verifique se está usando a Service Role Key
- Confirme se as políticas RLS foram criadas corretamente

### Convites não funcionam
- Verifique se o token está correto
- Confirme se o convite não expirou
- Verifique se o status é 'pending'