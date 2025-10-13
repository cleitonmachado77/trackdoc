# Sistema de Controle de Versão de Documentos

## Visão Geral

O sistema de controle de versão permite gerenciar diferentes versões de um documento, mantendo um histórico completo de alterações e permitindo restaurar versões anteriores quando necessário.

## Funcionalidades Implementadas

### 1. Versionamento Automático
- Quando um documento é criado, automaticamente recebe a versão V1
- Cada nova versão incrementa o número automaticamente (V2, V3, etc.)
- A versão atual é sempre exibida no card do documento

### 2. Interface de Gerenciamento
- **Badge de Versão**: Clicável nos cards dos documentos, mostra a versão atual e quantas versões existem
- **Botão "Versões"**: Disponível no menu de ações de cada documento
- **Modal de Controle**: Interface completa para gerenciar versões

### 3. Criação de Novas Versões
- Upload de novo arquivo substitui a versão atual
- Versão anterior é automaticamente salva no histórico
- Possibilidade de adicionar descrição das alterações
- Metadados do arquivo são preservados (nome, tamanho, tipo)

### 4. Histórico de Versões
- Lista completa de todas as versões anteriores
- Informações detalhadas: autor, data, descrição, tamanho do arquivo
- Ordenação por versão (mais recente primeiro)

### 5. Restauração de Versões
- Qualquer versão anterior pode ser restaurada
- Restauração cria uma nova versão com o conteúdo da versão selecionada
- Versão atual é preservada no histórico antes da restauração

### 6. Download de Versões
- Download da versão atual ou qualquer versão anterior
- URLs assinadas para segurança
- Nomes de arquivo preservados

## Estrutura do Banco de Dados

### Tabela `documents`
```sql
-- Campo adicionado para controle de versão
version INTEGER DEFAULT 1 -- Versão atual do documento
```

### Tabela `document_versions`
```sql
id UUID PRIMARY KEY
document_id UUID REFERENCES documents(id) ON DELETE CASCADE
version_number INTEGER NOT NULL
file_path TEXT NOT NULL
file_name TEXT NOT NULL
file_size INTEGER NOT NULL
file_type TEXT NOT NULL
change_description TEXT
author_id UUID REFERENCES profiles(id)
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

## Como Usar

### 1. Visualizar Versão Atual
- A versão atual é exibida em um badge azul no card do documento
- Formato: "V1", "V2", etc.
- Se houver versões anteriores, mostra o total entre parênteses: "V3 (3)"

### 2. Acessar Controle de Versões
**Opção 1**: Clicar no badge de versão no card do documento
**Opção 2**: Usar o menu de ações (⋮) → "Versões"

### 3. Criar Nova Versão
1. No modal de controle de versões, clicar em "Nova Versão"
2. Selecionar o novo arquivo
3. Opcionalmente, adicionar descrição das alterações
4. Clicar em "Criar Nova Versão"

### 4. Restaurar Versão Anterior
1. No histórico de versões, localizar a versão desejada
2. Clicar no menu de ações (⋮) → "Restaurar"
3. Confirmar a ação
4. Uma nova versão será criada com o conteúdo da versão selecionada

### 5. Baixar Versão Específica
1. No histórico de versões, localizar a versão desejada
2. Clicar no menu de ações (⋮) → "Download"
3. O arquivo será baixado com o nome original

## Regras de Negócio

### Versionamento
- Primeira versão sempre é V1
- Versões são incrementais e sequenciais
- Não é possível pular números de versão
- Versão atual sempre é a mais alta

### Exclusão
- Excluir um documento remove TODAS as suas versões
- Versões individuais não podem ser excluídas
- Arquivos no storage são removidos automaticamente

### Segurança
- Apenas usuários autenticados podem gerenciar versões
- Usuários só veem documentos de sua entidade
- URLs de download são temporárias (1 hora)

### Armazenamento
- Cada versão mantém seu próprio arquivo no storage
- Arquivos são organizados por usuário: `documents/{user_id}/{filename}`
- Nomes de arquivo são únicos para evitar conflitos

## Componentes Implementados

### 1. `useDocumentVersions` (Hook)
- Gerencia estado das versões
- Funções para criar, restaurar e baixar versões
- Integração com Supabase

### 2. `DocumentVersionManager` (Componente)
- Modal principal para gerenciamento de versões
- Interface para upload de novas versões
- Tabela com histórico completo

### 3. `DocumentVersionBadge` (Componente)
- Badge clicável nos cards dos documentos
- Mostra versão atual e total de versões
- Tooltip informativo

### 4. Integração no `DocumentList`
- Botões de ação adicionados
- Estados para controle dos modais
- Atualização automática após alterações

## Melhorias Futuras Possíveis

1. **Comparação de Versões**: Interface para comparar duas versões
2. **Aprovação de Versões**: Workflow de aprovação para novas versões
3. **Comentários**: Sistema de comentários por versão
4. **Notificações**: Alertas quando novas versões são criadas
5. **Compressão**: Otimização de armazenamento para versões antigas
6. **Auditoria**: Log detalhado de todas as ações de versionamento

## Arquivos Criados/Modificados

### Novos Arquivos
- `hooks/use-document-versions.ts`
- `app/components/document-version-manager.tsx`
- `app/components/document-version-badge.tsx`
- `database/setup-document-versions.sql`

### Arquivos Modificados
- `hooks/use-documents.ts` (adicionado campo version)
- `app/components/document-list.tsx` (integração com controle de versão)

## Instalação

1. Execute o script SQL para configurar o banco:
```sql
-- Execute o conteúdo de database/setup-document-versions.sql
```

2. Os componentes já estão integrados e funcionais

3. Teste criando um documento e depois fazendo upload de uma nova versão

## Conclusão

O sistema de controle de versão está completamente implementado e integrado à interface existente. Ele fornece uma solução robusta para gerenciar diferentes versões de documentos, mantendo a simplicidade de uso e a segurança dos dados.