# Correção de Problemas na Página de Departamentos

## Data: 14/11/2025

## Problemas Identificados

### 1. Mensagem "Gerente obrigatório" aparecendo incorretamente
**Sintoma**: O card do departamento mostra uma mensagem em laranja dizendo "Gerente obrigatório" mesmo quando o departamento já possui um gerente atribuído.

**Causa Raiz**:
- O componente `DepartmentForm` estava usando uma função `handleInputChange` com currying (retornando outra função)
- Isso causava problemas na atualização do estado do formulário
- O `manager_id` não estava sendo corretamente sincronizado entre o estado do formulário e o valor do Select

**Solução Aplicada**:
1. Refatorei `handleInputChange` para receber ambos os parâmetros diretamente: `(field, value)`
2. Removi o currying desnecessário que estava causando problemas de sincronização
3. Atualizei todas as chamadas de `handleInputChange` para passar os parâmetros diretamente
4. Removi a prop `key` do Select que estava forçando re-renders desnecessários

### 2. Botão "Departamento ativo" (Switch) não funcionando
**Sintoma**: O Switch de "Departamento ativo" não responde aos cliques do usuário.

**Causa Raiz**:
- O Switch tinha uma prop `key` dinâmica que forçava re-render a cada mudança de status
- A função `handleInputChange` com currying estava causando problemas na atualização
- O código tentava remover o foco do elemento, o que interferia com a interação

**Solução Aplicada**:
1. Removi a prop `key` do Switch
2. Simplifiquei o `onCheckedChange` para chamar diretamente `handleInputChange('status', checked)`
3. Removi o código que tentava remover o foco do elemento
4. Adicionei um `id` ao Switch e conectei com o Label usando `htmlFor` para melhor acessibilidade

## Mudanças no Código

### Arquivo: `app/components/admin/department-management.tsx`

#### Antes:
```typescript
const handleInputChange = useCallback((field: keyof DepartmentFormData) => 
  (value: string | boolean) => {
    const newValue = field === 'status' ? (value ? 'active' : 'inactive') : value
    
    setFormData(prev => ({
      ...prev,
      [field]: newValue
    }))
  }, []
)

// Uso:
onChange={(e) => handleInputChange('name')(e.target.value)}
onValueChange={handleInputChange('manager_id')}
onCheckedChange={(checked) => {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
  handleInputChange('status')(checked)
}}
```

#### Depois:
```typescript
const handleInputChange = useCallback((field: keyof DepartmentFormData, value: string | boolean) => {
  const newValue = field === 'status' ? (value ? 'active' : 'inactive') : value
  
  setFormData(prev => ({
    ...prev,
    [field]: newValue
  }))
}, [])

// Uso:
onChange={(e) => handleInputChange('name', e.target.value)}
onValueChange={(value) => handleInputChange('manager_id', value)}
onCheckedChange={(checked) => handleInputChange('status', checked)}
```

### Select do Gerente:
```typescript
// Antes:
<Select 
  key={`manager-${department?.id || 'new'}`}
  value={formData.manager_id || undefined} 
  onValueChange={handleInputChange('manager_id')}
  disabled={usersLoading}
>

// Depois:
<Select 
  value={formData.manager_id || undefined} 
  onValueChange={(value) => handleInputChange('manager_id', value)}
  disabled={usersLoading}
>
```

### Switch do Status:
```typescript
// Antes:
<Switch
  key={`status-${formData.status}`}
  checked={formData.status === "active"}
  onCheckedChange={(checked) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    handleInputChange('status')(checked)
  }}
  disabled={isSubmitting}
/>
<Label className="text-sm">Departamento ativo</Label>

// Depois:
<Switch
  id="department-status"
  checked={formData.status === "active"}
  onCheckedChange={(checked) => handleInputChange('status', checked)}
  disabled={isSubmitting}
/>
<Label htmlFor="department-status" className="text-sm cursor-pointer">
  Departamento ativo
</Label>
```

## Logs de Debug Adicionados

Para facilitar o diagnóstico de problemas futuros, foram adicionados logs de debug:

1. **Ao carregar um departamento para edição**:
   - Mostra o ID, nome, manager_id, manager_name e status
   
2. **Ao criar um novo departamento**:
   - Indica que está criando um novo departamento

3. **Ao atualizar qualquer campo do formulário**:
   - Mostra qual campo está sendo atualizado
   - Mostra o valor antigo e o novo valor
   - Mostra o estado completo do formulário após a atualização

## Como Testar

1. **Teste do Gerente**:
   - Abra um departamento que já possui gerente
   - Verifique se o gerente aparece selecionado no dropdown
   - Verifique se NÃO aparece a mensagem laranja "Gerente obrigatório"
   - Tente trocar o gerente e salvar

2. **Teste do Status**:
   - Abra um departamento ativo
   - Clique no Switch "Departamento ativo"
   - Verifique se o Switch muda de estado visualmente
   - Salve e verifique se o status foi atualizado corretamente

3. **Teste de Criação**:
   - Clique em "Novo Departamento"
   - Preencha o nome
   - Selecione um gerente
   - Verifique se a mensagem laranja desaparece após selecionar o gerente
   - Teste o Switch de status
   - Salve e verifique se foi criado corretamente

## Verificação no Console

Abra o Console do navegador (F12) e procure por mensagens com os seguintes prefixos:

### Logs de Debug (`🔍 [DEBUG]`):
- `🔍 [DEBUG] Departamentos retornados do Supabase:` - Quantidade de departamentos carregados
- `🔍 [DEBUG] Primeiro departamento (raw):` - Dados brutos do primeiro departamento
- `🔍 [DEBUG] Departamento carregado:` - Dados processados de cada departamento
- `🔍 [DEBUG] DepartmentManagerInfo:` - Informações do gerente ao renderizar o card
- `🔍 [DEBUG] Carregando departamento:` - Dados do departamento sendo editado
- `🔍 [DEBUG] Criando novo departamento` - Indica criação de novo departamento
- `🔍 [DEBUG] Atualizando campo:` - Mostra qual campo está sendo atualizado
- `🔍 [DEBUG] FormData atualizado:` - Mostra o estado completo após atualização

### Avisos (`⚠️ [AVISO]`):
- `⚠️ [AVISO] Departamento tem manager_id mas manager_name não foi carregado:` - Indica problema no join do Supabase

### Sucessos (`✅ [SUCESSO]`):
- `✅ [SUCESSO] Nome do gerente carregado diretamente:` - Fallback funcionou corretamente

### Erros (`❌ [ERRO]`):
- `❌ [ERRO] Não foi possível carregar o nome do gerente:` - Problema crítico ao buscar gerente

## Melhorias Adicionais Implementadas

### 1. Fallback para Carregamento do Nome do Gerente
Se o join do Supabase falhar em carregar o nome do gerente, o sistema agora tenta buscar diretamente da tabela `profiles`:

```typescript
if (dept.manager_id && !managerName) {
  const { data: managerData } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', dept.manager_id)
    .single()
  
  if (managerData?.full_name) {
    managerName = managerData.full_name
  }
}
```

### 2. Logs Detalhados em Múltiplos Pontos
- Hook `use-departments`: Logs ao carregar dados do Supabase
- Componente `DepartmentManagerInfo`: Logs ao renderizar o card
- Componente `DepartmentForm`: Logs ao editar/criar departamento

## Próximos Passos

Se os problemas persistirem:

1. **Verifique os logs no console** para identificar onde está o problema:
   - Se aparecer `⚠️ [AVISO] Departamento tem manager_id mas manager_name não foi carregado`, há um problema no join do Supabase
   - Se aparecer `❌ [ERRO] Não foi possível carregar o nome do gerente`, há um problema de permissões ou o usuário não existe

2. **Verifique as políticas RLS do Supabase**:
   - Certifique-se de que a política de leitura da tabela `profiles` permite acesso aos dados dos gerentes
   - Verifique se a foreign key `departments_manager_id_fkey` está configurada corretamente

3. **Verifique os dados no banco**:
   ```sql
   -- Verificar departamentos e seus gerentes
   SELECT 
     d.id,
     d.name,
     d.manager_id,
     p.full_name as manager_name,
     d.status
   FROM departments d
   LEFT JOIN profiles p ON d.manager_id = p.id
   ORDER BY d.name;
   ```

4. **Verifique se o usuário gerente existe**:
   ```sql
   -- Verificar se todos os manager_id existem na tabela profiles
   SELECT 
     d.id,
     d.name,
     d.manager_id,
     CASE 
       WHEN p.id IS NULL THEN 'GERENTE NÃO ENCONTRADO'
       ELSE p.full_name
     END as status
   FROM departments d
   LEFT JOIN profiles p ON d.manager_id = p.id
   WHERE d.manager_id IS NOT NULL;
   ```

## Observações Importantes

- Os logs de debug devem ser removidos em produção
- A correção mantém a mesma lógica de negócio, apenas corrige a implementação técnica
- Não foram feitas mudanças no banco de dados ou nas políticas RLS
- A correção é compatível com o código existente
