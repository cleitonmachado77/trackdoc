# 🔒 Funcionalidade de Controle de Visibilidade de Documentos

Esta funcionalidade permite controlar quem pode ver e acessar documentos específicos no sistema TrackDoc, oferecendo três níveis de visibilidade: **Público**, **Privado** e **Restrito**.

## 📋 Funcionalidades Implementadas

### 1. **Controle de Visibilidade no Upload**
- Interface intuitiva para definir visibilidade durante o upload
- Seleção de departamentos autorizados para documentos restritos
- Configuração de tipos de permissão (visualizar, baixar, editar, assinar)

### 2. **Sistema de Permissões Granular**
- Permissões por departamento ou usuário específico
- Tipos de permissão: `read`, `download`, `edit`, `sign`
- Controle de expiração de permissões (opcional)

### 3. **Filtragem Automática de Documentos**
- Documentos são automaticamente filtrados baseado nas permissões do usuário
- Usuários só veem documentos que têm autorização para acessar

### 4. **Interface de Gerenciamento**
- Badge visual indicando o tipo de visibilidade do documento
- Modal para gerenciar permissões de documentos existentes
- Histórico de permissões concedidas e revogadas

## 🗄️ Estrutura do Banco de Dados

### Tabelas Relacionadas

#### `profiles` (Existente)
- Contém `department_id` como departamento primário do usuário
- Campos relevantes: `id`, `department_id`, `entity_id`, `role`

#### `departments` (Existente)
- Departamentos da organização
- Campos relevantes: `id`, `name`, `description`, `entity_id`

#### `user_departments` (Existente)
- Relacionamento many-to-many entre usuários e departamentos
- Permite usuários pertencerem a múltiplos departamentos
- Campos relevantes: `user_id`, `department_id`, `role_in_department`

#### `documents` (Existente)
- Documentos do sistema
- Campo `is_public` já existente para controle básico de visibilidade
- Campos relevantes: `id`, `title`, `author_id`, `is_public`, `entity_id`

### Nova Tabela `document_permissions`
```sql
CREATE TABLE document_permissions (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  department_id UUID REFERENCES departments(id),
  user_id UUID REFERENCES profiles(id),
  permission_type TEXT CHECK (permission_type IN ('read', 'edit', 'upload', 'sign', 'download', 'approve', 'reject')),
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  -- Constraint: deve ter department_id OU user_id, não ambos
  CONSTRAINT check_permission_target CHECK (
    (department_id IS NOT NULL AND user_id IS NULL) OR 
    (department_id IS NULL AND user_id IS NOT NULL)
  )
);
```

### Função `check_document_permission`
A função considera tanto o departamento primário (da tabela `profiles`) quanto os departamentos adicionais (da tabela `user_departments`) ao verificar permissões.

## 🚀 Como Usar

### 1. **Executar Migração do Banco**
```bash
# Executar a migração para criar a tabela de permissões
node scripts/run-migration.js 20250201_create_document_permissions_table.sql

# Testar se a migração foi executada corretamente
node scripts/test-document-permissions.js
```

### 2. **Upload com Controle de Visibilidade**
1. Acesse a página de Documentos
2. Clique em "Upload de Documentos"
3. Selecione os arquivos
4. Configure a visibilidade:
   - **Público**: Todos da organização podem ver
   - **Privado**: Apenas você pode ver
   - **Restrito**: Apenas departamentos selecionados podem ver
5. Para documentos restritos, selecione os departamentos autorizados
6. Escolha as permissões (visualizar, baixar, editar, assinar)

### 3. **Gerenciar Permissões de Documentos Existentes**
1. Na lista de documentos, clique no menu "⋮" do documento
2. Selecione "Gerenciar Permissões"
3. Visualize permissões existentes
4. Conceda novas permissões por departamento ou usuário
5. Revogue permissões quando necessário

## 🎨 Componentes Criados

### `DocumentVisibilityManager`
- Componente para configurar visibilidade durante upload
- Props: `value`, `onChange`, `disabled`

### `DocumentVisibilityBadge`
- Badge visual mostrando o tipo de visibilidade
- Tooltip com detalhes das permissões
- Props: `documentId`, `isPublic`, `authorId`, `currentUserId`

### `DocumentPermissionsModal`
- Modal completo para gerenciar permissões
- Lista permissões existentes
- Interface para conceder/revogar permissões
- Props: `document`, `open`, `onOpenChange`

## 🔧 Hooks Utilizados

### `useDocumentPermissions`
- `fetchDocumentPermissions(documentId)`: Busca permissões de um documento
- `grantPermission(data)`: Concede nova permissão
- `revokePermission(permissionId)`: Revoga permissão
- `checkPermission(documentId, type)`: Verifica se usuário tem permissão

### `useUserDepartments` (Novo)
- `departments`: Lista de departamentos do usuário (primário + adicionais)
- `getDepartmentIds()`: IDs de todos os departamentos do usuário
- `getPrimaryDepartment()`: Departamento primário do usuário
- `isInDepartment(id)`: Verifica se usuário pertence ao departamento

### `useDocuments` (Modificado)
- Agora filtra automaticamente documentos baseado em permissões
- Função `filterDocumentsByPermissions()` implementada
- Considera tanto departamento primário quanto departamentos adicionais

## 🛡️ Regras de Segurança

### 1. **Visibilidade de Documentos**
- **Público**: Todos os usuários da mesma entidade podem ver
- **Privado**: Apenas o autor pode ver
- **Restrito**: Apenas usuários/departamentos com permissão podem ver

### 2. **Gerenciamento de Permissões**
- Apenas o autor do documento pode gerenciar permissões
- Administradores (`admin`, `entity_admin`) também podem gerenciar
- Permissões podem ter data de expiração

### 3. **Filtragem Automática**
- Sistema verifica automaticamente se usuário tem permissão `read`
- Documentos sem permissão não aparecem na lista
- Verificação por usuário direto e por departamento

## 📊 Tipos de Permissão

| Tipo | Descrição | Ícone |
|------|-----------|-------|
| `read` | Visualizar conteúdo do documento | 👁️ |
| `download` | Fazer download do documento | ⬇️ |
| `edit` | Modificar o documento | ✏️ |
| `sign` | Assinar digitalmente | ✍️ |

## 🔍 Exemplos de Uso

### Documento Público
```typescript
// Todos da organização podem ver
const settings = {
  visibility_type: 'public',
  allowed_departments: [],
  allowed_users: [],
  permission_types: ['read', 'download']
}
```

### Documento Restrito ao RH
```typescript
// Apenas departamento de RH pode ver e baixar
const settings = {
  visibility_type: 'restricted',
  allowed_departments: ['rh-dept-id'],
  allowed_users: [],
  permission_types: ['read', 'download']
}
```

### Documento Privado
```typescript
// Apenas o autor pode ver
const settings = {
  visibility_type: 'private',
  allowed_departments: [],
  allowed_users: [],
  permission_types: ['read']
}
```

## 🐛 Troubleshooting

### Problema: Documentos não aparecem na lista
**Solução**: Verificar se o usuário tem permissão `read` para o documento

### Problema: Erro ao conceder permissão
**Solução**: Verificar se o usuário é autor do documento ou administrador

### Problema: Migração falha
**Solução**: Verificar se as tabelas `documents`, `departments` e `profiles` existem

## 🔄 Próximas Melhorias

1. **Permissões por Grupo de Usuários**
2. **Permissões Temporárias com Auto-Expiração**
3. **Auditoria de Acesso a Documentos**
4. **Notificações de Mudanças de Permissão**
5. **Bulk Operations para Permissões**

---

## 📝 Notas Técnicas

- A funcionalidade é totalmente compatível com o sistema existente
- Documentos antigos sem permissões específicas mantêm comportamento atual
- Performance otimizada com índices no banco de dados
- Interface responsiva e acessível
- Suporte completo a temas claro/escuro