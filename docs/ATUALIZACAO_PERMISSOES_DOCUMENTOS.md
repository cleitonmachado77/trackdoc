# Atualização do Sistema de Permissões de Documentos

## Resumo das Mudanças

O sistema de permissões de documentos foi simplificado para incluir apenas duas opções:
- **Visualizar** (read): Permite ver o conteúdo do documento
- **Excluir** (delete): Permite excluir o documento

## Permissões Removidas

As seguintes permissões foram removidas do sistema:
- ~~Editar~~ (edit)
- ~~Baixar~~ (download)
- ~~Assinar~~ (sign)
- ~~Aprovar~~ (approve)
- ~~Rejeitar~~ (reject)
- ~~Upload~~ (upload)

## Arquivos Modificados

### 1. Componentes

#### `app/components/document-permissions-modal.tsx`
- Atualizado array `permissionTypes` para incluir apenas 'read' e 'delete'
- Removidos ícones e descrições das permissões antigas

#### `app/components/document-visibility-manager.tsx`
- Atualizado tipo `DocumentVisibilitySettings.permission_types` para `('read' | 'delete')[]`
- Atualizado array `permissionOptions` para incluir apenas 'Visualizar' e 'Excluir'
- Todas as funções de manipulação de permissões atualizadas

### 2. Hooks

#### `hooks/use-document-permissions.ts`
- Atualizado tipo `DocumentPermission.permission_type` para `'read' | 'delete'`
- Todas as funções continuam funcionando normalmente com os novos tipos

### 3. Migrations

#### `supabase/migrations/20251110_update_permission_types.sql` (NOVA)
- Remove constraint antiga de tipos de permissão
- Adiciona nova constraint permitindo apenas 'read' e 'delete'
- Converte permissões existentes:
  - `edit`, `upload`, `sign`, `download` → `read`
  - `approve`, `reject` → `delete`

## Como Aplicar as Mudanças

### 1. Aplicar Migration no Banco de Dados

```bash
# Via Supabase CLI
supabase db push
```

Ou execute manualmente no SQL Editor do Supabase:
```sql
-- Arquivo: supabase/migrations/20251110_update_permission_types.sql
```

### 2. Verificar Conversão de Permissões

Após aplicar a migration, verifique se as permissões foram convertidas corretamente:

```sql
-- Ver distribuição de tipos de permissão
SELECT 
  permission_type,
  COUNT(*) as total
FROM document_permissions
GROUP BY permission_type
ORDER BY total DESC;

-- Deve retornar apenas 'read' e 'delete'
```

### 3. Testar Funcionalidade

1. Acesse a página de documentos
2. Clique em "Gerenciar Permissões" em qualquer documento
3. Verifique que apenas as opções "Visualizar" e "Excluir" estão disponíveis
4. Conceda uma permissão a um usuário ou departamento
5. Verifique que a permissão foi salva corretamente

## Funcionalidades Mantidas

✅ **Conceder permissões por departamento**
- Selecione um departamento
- Escolha o tipo de permissão (Visualizar ou Excluir)
- Clique em "Conceder"

✅ **Conceder permissões por usuário**
- Selecione um usuário específico
- Escolha o tipo de permissão (Visualizar ou Excluir)
- Clique em "Conceder"

✅ **Revogar permissões**
- Visualize a lista de permissões existentes
- Clique no ícone de lixeira para revogar

✅ **Visualizar permissões existentes**
- Tabela com todas as permissões do documento
- Mostra destinatário, tipo, data e quem concedeu

✅ **Controle de acesso**
- Apenas o autor do documento ou administradores podem gerenciar permissões
- Usuários sem permissão veem mensagem informativa

## Impacto nas Funcionalidades

### Documentos Públicos
- Todos os usuários da organização podem visualizar
- Permissões específicas podem ser concedidas para excluir

### Documentos Privados
- Apenas o autor pode visualizar e gerenciar
- Permissões específicas podem ser concedidas

### Documentos Restritos
- Apenas departamentos selecionados podem visualizar
- Permissões adicionais podem ser concedidas

## Compatibilidade com Dados Existentes

A migration converte automaticamente permissões antigas:

| Permissão Antiga | Permissão Nova |
|-----------------|----------------|
| edit            | read           |
| upload          | read           |
| sign            | read           |
| download        | read           |
| approve         | delete         |
| reject          | delete         |

## Rollback

Se precisar reverter as mudanças:

```sql
-- 1. Remover constraint nova
ALTER TABLE document_permissions 
DROP CONSTRAINT IF EXISTS document_permissions_permission_type_check;

-- 2. Restaurar constraint antiga
ALTER TABLE document_permissions 
ADD CONSTRAINT document_permissions_permission_type_check 
CHECK (permission_type IN ('read', 'edit', 'upload', 'sign', 'download', 'approve', 'reject'));
```

Depois, reverta os commits no código da aplicação.

## Suporte

Para dúvidas ou problemas:
- Verifique os logs do Supabase
- Consulte a documentação em `docs/`
- Execute queries de diagnóstico no SQL Editor
