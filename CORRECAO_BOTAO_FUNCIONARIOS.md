# Correção: Botão Funcionários nos Cards de Departamento

## Problema Identificado

O botão "Funcionários" nos cards de departamento não mostrava nenhum funcionário, mesmo quando havia dados na tabela `user_departments`.

## Causa Raiz

O hook `use-department-employees.ts` estava usando um `entity_id` incorreto:

```typescript
// ❌ PROBLEMA: entity sempre era null
const { user, entity } = useAuth()
const entityId = entity?.id || 'ebde2fef-30e2-458b-8721-d86df2f6865b'
```

O contexto de autenticação (`SimpleAuthContext`) define `entity` como `null`, então sempre usava o fallback hardcoded, que não correspondia aos `entity_id` reais dos usuários.

## Solução Implementada

### 1. Correção do Hook `use-department-employees.ts`

**Antes:**
- Usava `entity?.id` (sempre null) + fallback hardcoded
- Filtrava funcionários por entity_id incorreto
- Resultado: nenhum funcionário era retornado

**Depois:**
- Busca o `entity_id` real do perfil do usuário logado
- Aplica filtro correto baseado na entidade do usuário
- Suporta usuários solo (sem entidade)

### 2. Mudanças Específicas

```typescript
// ✅ CORREÇÃO: Buscar entity_id do perfil
const [entityId, setEntityId] = useState<string | null>(null)

useEffect(() => {
  const fetchUserEntityId = async () => {
    if (!user?.id) return
    
    const { data: profileData } = await supabase
      .from('profiles')
      .select('entity_id')
      .eq('id', user.id)
      .single()
    
    setEntityId(profileData?.entity_id || null)
  }
  
  fetchUserEntityId()
}, [user?.id])
```

### 3. Filtro de Isolamento por Entidade

```typescript
// ✅ CORREÇÃO: Filtro correto por entidade
if (entityId) {
  profilesQuery = profilesQuery.eq('entity_id', entityId)
} else {
  profilesQuery = profilesQuery.is('entity_id', null)
}
```

## Regras de Isolamento

1. **Usuários com entidade**: Veem apenas funcionários da mesma entidade
2. **Usuários solo (sem entidade)**: Veem apenas outros usuários sem entidade
3. **Departamentos**: Devem ter o mesmo `entity_id` dos seus funcionários

## Dados de Teste

Os dados existentes na tabela `user_departments` estão corretos:

- **ADMINISTRATIVO**: Diego Emerson Adancheski (entity: ebfc8f63...)
- **Engenharia**: João Cunha (entity: 7378b7b1...)
- **LIC**: Cleiton Machado (entity: cdba1355...)
- **Marketing**: João Cunha (entity: 7378b7b1...)
- **RH**: Cleiton Machado (entity: cdba1355...)
- **Ti**: Usuário teste 1 (entity: cdba1355...)

## Resultado Esperado

Após a correção:
- ✅ Botão "Funcionários" deve mostrar os funcionários corretos
- ✅ Isolamento por entidade funcionando
- ✅ Usuários solo veem apenas seus próprios dados
- ✅ Modal de funcionários carrega corretamente

## Arquivos Modificados

- `hooks/use-department-employees.ts` - Correção principal
- `sql/testar_correcao_hook_funcionarios.sql` - Script de teste

## Scripts de Verificação

1. `sql/verificar_dados_departamentos_funcionarios.sql` - Verificar dados existentes
2. `sql/testar_correcao_hook_funcionarios.sql` - Testar correção
3. `sql/investigar_problema_isolamento_entidade.sql` - Investigar isolamento