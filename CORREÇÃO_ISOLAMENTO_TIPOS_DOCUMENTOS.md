# Correção do Sistema de Isolamento de Dados por Entidade

## Problema Identificado

Os dados (tipos de documentos, categorias, departamentos) criados por usuários únicos (sem entidade) estavam aparecendo em outras entidades, violando o princípio de isolamento de dados por entidade.

## Causa Raiz

As funções de busca (`getDocumentTypes()`, `getCategories()`, `getDepartments()`) em `app/admin/actions.ts` não estavam filtrando os dados por `entity_id`, retornando todos os registros ativos independentemente da entidade do usuário.

## Correções Implementadas

### 1. Correção da função `getDocumentTypes()` (app/admin/actions.ts)

**Antes:**
```typescript
const { data, error } = await supabase
  .from("document_types")
  .select("*")
  .eq("status", "active")
  .order("name")
```

**Depois:**
```typescript
// Buscar a entidade do usuário
const { data: profileData, error: profileError } = await supabase
  .from("profiles")
  .select("entity_id")
  .eq("id", user.id)
  .single()

// Filtrar por entidade
let query = supabase
  .from("document_types")
  .select("*")
  .eq("status", "active")
  .order("name")

if (profileData?.entity_id) {
  // Usuário com entidade: apenas tipos da sua entidade
  query = query.eq("entity_id", profileData.entity_id)
} else {
  // Usuário sem entidade: apenas tipos sem entidade
  query = query.is("entity_id", null)
}
```

### 2. Correção das funções de categorias (app/admin/actions.ts)

**Funções corrigidas:**
- `getCategories()` - Filtro por entidade
- `createCategory()` - Associação automática à entidade
- `updateCategory()` - Verificação de permissões
- `deleteCategory()` - Verificação de permissões

### 3. Correção da função `getDocumentsCount()` (app/admin/actions.ts)

Aplicada a mesma lógica de filtro por entidade para garantir que a contagem de documentos seja isolada por entidade.

### 4. Melhoria nas verificações de permissão

**Todas as funções de edição/exclusão:**
- Usuários com entidade só podem editar/deletar dados da sua entidade
- Usuários sem entidade só podem editar/deletar dados sem entidade

### 5. Correção do hook `useDocumentTypes()` (hooks/use-document-types.ts)

Aplicada a mesma lógica de filtro por entidade no lado cliente para consistência.

## Regras de Isolamento Implementadas

### Para Usuários com Entidade:
- ✅ Veem apenas dados (tipos, categorias, departamentos) da sua entidade
- ✅ Podem criar dados associados à sua entidade
- ✅ Podem editar/deletar apenas dados da sua entidade

### Para Usuários sem Entidade (Usuários Únicos):
- ✅ Veem apenas dados sem entidade (criados por eles)
- ✅ Podem criar dados sem entidade associada
- ✅ Podem editar/deletar apenas dados sem entidade

## Estrutura das Tabelas com Isolamento

### Tabelas com campo `entity_id`:
- `document_types` - Tipos de documentos
- `categories` - Categorias
- `departments` - Departamentos  
- `documents` - Documentos

```sql
-- Exemplo da estrutura
CREATE TABLE document_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  entity_id uuid REFERENCES entities(id) ON DELETE CASCADE,
  -- outros campos...
);
```

**Campo `entity_id`:**
- `NULL`: Registro criado por usuário único (sem entidade)
- `UUID`: Registro associado a uma entidade específica

## Verificações Recomendadas

1. **Executar o script SQL** (`sql/fix_document_types_entity_isolation.sql`) para verificar e corrigir dados existentes

2. **Testar o isolamento:**
   - Login com usuário de entidade A → deve ver apenas dados da entidade A
   - Login com usuário de entidade B → deve ver apenas dados da entidade B
   - Login com usuário único → deve ver apenas dados sem entidade

3. **Verificar permissões:**
   - Usuários não devem conseguir editar dados de outras entidades
   - Criação de novos dados deve respeitar a entidade do usuário
   - Relacionamentos devem ser consistentes (documento só pode usar categoria da mesma entidade)

## Arquivos Modificados

- ✅ `app/admin/actions.ts` - Funções de backend (tipos, categorias, departamentos)
- ✅ `hooks/use-document-types.ts` - Hook do frontend
- ✅ `hooks/use-categories.ts` - Hook já estava correto
- ✅ `hooks/use-departments.ts` - Hook já estava correto
- ✅ `sql/fix_document_types_entity_isolation.sql` - Script de verificação/correção expandido

## Impacto

- ✅ **Segurança:** Dados isolados por entidade
- ✅ **Privacidade:** Usuários únicos não veem tipos de entidades
- ✅ **Consistência:** Mesma lógica no backend e frontend
- ✅ **Performance:** Consultas otimizadas com filtros adequados

## Próximos Passos

1. Testar em ambiente de desenvolvimento
2. Executar script SQL para verificar dados existentes
3. Aplicar correções em produção
4. Monitorar logs para garantir funcionamento correto