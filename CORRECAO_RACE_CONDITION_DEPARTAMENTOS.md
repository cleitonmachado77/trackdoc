# 🔧 Correção: Race Condition em Departamentos

## 🚨 Problema Identificado

Usuários de outras entidades e usuários SOLO apareciam na lista de funcionários disponíveis para adicionar ao departamento.

### Causa Raiz: Race Condition

O problema era uma **condição de corrida** no carregamento do `entityId`:

```
1. Componente monta → entityId = null (valor inicial)
2. useEffect executa → busca funcionários com entity_id IS NULL ❌
3. Depois: entityId é carregado do banco → entityId = 'cdba1355...'
4. useEffect executa novamente → busca funcionários corretos ✅
```

**Resultado:** Por um breve momento, usuários SOLO eram buscados e exibidos.

## ✅ Solução Aplicada

Mudamos o valor inicial de `entityId` de `null` para `undefined`:

```typescript
// ❌ ANTES - null indica "usuário solo"
const [entityId, setEntityId] = useState<string | null>(null)

// ✅ DEPOIS - undefined indica "ainda não carregou"
const [entityId, setEntityId] = useState<string | null | undefined>(undefined)
```

### Semântica dos Valores

- `undefined` = Ainda não foi carregado do banco
- `null` = Usuário SOLO (sem entidade)
- `string` = Usuário com entidade (ID da entidade)

### Fluxo Correto

```
1. Componente monta → entityId = undefined
2. useEffect NÃO executa (entityId !== undefined é false) ⏳
3. entityId é carregado do banco → entityId = 'cdba1355...'
4. useEffect executa → busca funcionários corretos ✅
```

## 📊 Arquivos Modificados

- ✅ `hooks/use-department-employees.ts`
  - `entityId` inicializado como `undefined`
  - Logs adicionados para debug
  - Filtro adicional para garantir que usuários SOLO nunca apareçam

## 🧪 Como Testar

1. **Recarregue a página** (F5)
2. **Abra o modal de funcionários** de qualquer departamento
3. **Verifique no console:**
   ```
   ⏳ [FETCH] Aguardando entityId ser carregado...
   ✅ [ENTITY] Entity ID carregado: {entityId: '...'}
   ✅ [FETCH] Iniciando busca de funcionários com entityId: ...
   ```
4. **Verifique a lista:** Apenas usuários da sua entidade devem aparecer

## 🎯 Resultado

- ✅ Usuários SOLO não aparecem mais
- ✅ Usuários de outras entidades não aparecem mais
- ✅ Apenas usuários da mesma entidade são exibidos
- ✅ Sem race condition

## 💡 Lição Aprendida

Ao trabalhar com dados assíncronos que dependem de outros dados:

1. **Use `undefined`** para indicar "ainda não carregou"
2. **Use `null`** para indicar "valor vazio/nulo"
3. **Verifique `!== undefined`** antes de executar operações dependentes
4. **Adicione logs** para debug de race conditions

## 🔗 Problemas Relacionados

Este mesmo padrão deve ser aplicado em outros hooks que dependem de `entityId`:
- `use-categories.ts` ✅ Já corrigido
- `use-document-types.ts` ✅ Já corrigido
- `use-departments.ts` - Verificar se precisa
- `use-users.ts` - Verificar se precisa
