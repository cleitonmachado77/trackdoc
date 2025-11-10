# Biblioteca Pública - Documentação

## Visão Geral

A funcionalidade de Biblioteca Pública permite que entidades compartilhem documentos publicamente através de links externos, sem necessidade de autenticação. Usuários externos podem acessar e visualizar documentos aprovados da organização.

## Funcionalidades

### 1. Gerenciamento de Biblioteca (Interno)
- **Localização**: Menu lateral > Biblioteca
- **Acesso**: Usuários autenticados da plataforma
- **Funcionalidades**:
  - Adicionar documentos existentes à biblioteca pública
  - Criar novos registros de documentos para a biblioteca
  - Ativar/desativar documentos na biblioteca
  - Organizar documentos por categorias
  - Copiar link público compartilhável
  - Remover documentos da biblioteca

### 2. Visualização Pública
- **Localização**: `/biblioteca-publica/[slug]`
- **Acesso**: Qualquer pessoa com o link (sem autenticação)
- **Funcionalidades**:
  - Visualizar documentos públicos da entidade
  - Documentos organizados por categoria
  - Download de documentos
  - Visualização de documentos no navegador
  - Interface responsiva e moderna

## Estrutura do Banco de Dados

### Tabela: `public_library`

```sql
CREATE TABLE public.public_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  document_id UUID NULL REFERENCES documents(id) ON DELETE CASCADE,
  
  -- Campos para documentos
  title TEXT NOT NULL,
  description TEXT NULL,
  file_path TEXT NULL,
  file_name TEXT NULL,
  file_size INTEGER NULL,
  file_type TEXT NULL,
  
  -- Configurações
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NULL DEFAULT 0,
  category TEXT NULL,
  tags TEXT[] NULL,
  
  -- Link público
  public_slug TEXT NOT NULL UNIQUE,
  
  -- Metadados
  metadata JSONB NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL
);
```

### Índices
- `idx_public_library_entity_id`: Busca por entidade
- `idx_public_library_document_id`: Busca por documento
- `idx_public_library_public_slug`: Busca por slug público
- `idx_public_library_is_active`: Filtro de documentos ativos
- `idx_public_library_entity_active`: Busca combinada entidade + ativo
- `idx_public_library_display_order`: Ordenação de exibição

### Triggers
- `update_public_library_updated_at_trigger`: Atualiza automaticamente o campo `updated_at`
- `generate_public_library_slug_trigger`: Gera automaticamente um slug único para cada registro

## Fluxo de Uso

### Para Administradores

1. **Adicionar Documento à Biblioteca**
   - Acesse "Biblioteca" no menu lateral
   - Clique em "Adicionar Documento"
   - Escolha entre:
     - **Documento Existente**: Selecione um documento já aprovado na plataforma
     - **Novo Documento**: Adicione informações de um novo documento
   - Preencha título, descrição e categoria
   - Defina se o documento estará ativo
   - Clique em "Adicionar"

2. **Gerenciar Documentos**
   - Visualize todos os documentos na tabela
   - Use o botão de olho para ativar/desativar documentos
   - Copie o link público clicando em "Copiar Link"
   - Remova documentos com o botão de lixeira

3. **Compartilhar Link Público**
   - Copie o link gerado automaticamente
   - Compartilhe com usuários externos
   - O link tem o formato: `https://seudominio.com/biblioteca-publica/[slug]`

### Para Usuários Externos

1. **Acessar Biblioteca Pública**
   - Acesse o link compartilhado
   - Visualize o nome e logo da entidade
   - Navegue pelos documentos organizados por categoria

2. **Visualizar/Baixar Documentos**
   - Clique em "Visualizar" para abrir o documento no navegador
   - Clique em "Baixar" para fazer download do arquivo
   - Veja informações como título, descrição e tipo de arquivo

## Arquivos Criados

### Backend (SQL)
- `sql/create_public_library.sql`: Script de criação da tabela e triggers

### Frontend (React/Next.js)
- `app/biblioteca/page.tsx`: Página de gerenciamento interno
- `app/biblioteca-publica/[slug]/page.tsx`: Página pública de visualização

### Componentes Modificados
- `app/components/sidebar.tsx`: Adicionado item "Biblioteca" no menu
- `app/page.tsx`: Adicionado roteamento para a página de biblioteca

## Segurança

### Controle de Acesso
- **Página de Gerenciamento**: Requer autenticação
- **Página Pública**: Sem autenticação necessária
- **Documentos**: Apenas documentos marcados como `is_active = true` são exibidos publicamente

### Validações
- Apenas documentos aprovados podem ser adicionados à biblioteca
- Slug único gerado automaticamente para cada entidade
- Validação de permissões no nível do banco de dados (RLS - Row Level Security)

## Próximos Passos (Sugestões)

1. **Políticas RLS (Row Level Security)**
   - Adicionar políticas de segurança no Supabase
   - Garantir que usuários só vejam documentos de sua entidade

2. **Analytics**
   - Rastrear visualizações de documentos
   - Estatísticas de downloads
   - Documentos mais acessados

3. **Customização**
   - Permitir personalização de cores e logo na página pública
   - Templates customizáveis por entidade

4. **SEO**
   - Meta tags para compartilhamento em redes sociais
   - Sitemap para indexação

5. **Notificações**
   - Notificar administradores sobre acessos
   - Alertas de documentos populares

## Instalação

1. **Executar Script SQL**
   ```bash
   # No Supabase SQL Editor, execute:
   sql/create_public_library.sql
   ```

2. **Verificar Instalação**
   - Acesse a plataforma
   - Verifique se o item "Biblioteca" aparece no menu lateral
   - Teste adicionar um documento à biblioteca
   - Acesse o link público gerado

## Suporte

Para dúvidas ou problemas:
- Verifique os logs do navegador (F12 > Console)
- Verifique os logs do Supabase
- Consulte a documentação do Next.js e Supabase
