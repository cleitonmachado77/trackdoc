# 🔧 Problema: Constraint de Unicidade Global

## 🚨 Problema Identificado

A tabela `categories` tem uma constraint de unicidade **GLOBAL** no campo `name`:

```sql
CONSTRAINT categories_name_key UNIQUE (name)
```

### Por que isso é um problema?

**Cenário atual (ERRADO):**
- Usuário A (entidade X) cria categoria "Rascunho" ✅
- Usuário B (entidade Y) tenta criar categoria "Rascunho" ❌ **ERRO 409**
- Resultado: Apenas UMA entidade pode usar cada nome de categoria

**Cenário esperado (CORRETO):**
- Usuário A (entidade X) cria categoria "Rascunho" ✅
- Usuário B (entidade Y) cria categoria "Rascunho" ✅
- Resultado: Cada entidade tem suas próprias categorias

## ✅ Solução

Mudar a constraint para ser **por entidade**:

```sql
CONSTRAINT categories_name_entity_unique UNIQUE (name, entity_id)
```

Isso permite que:
- ✅ Cada entidade tenha suas próprias categorias
- ✅ Nomes de categorias sejam únicos **dentro** de cada entidade
- ✅ Diferentes entidades possam usar os mesmos nomes

## 📝 Como Aplicar a Correção

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Cole o conteúdo do arquivo `EXECUTAR_NO_SUPABASE.sql`
5. Clique em **Run**

### Opção 2: Via CLI

```bash
supabase db push migrations/fix_categories_unique_constraint.sql
```

## 🧪 Como Testar

Após aplicar a correção:

1. **Teste 1: Criar categoria na sua entidade**
   - Nome: "Rascunho"
   - Deve funcionar ✅

2. **Teste 2: Criar categoria duplicada na MESMA entidade**
   - Nome: "Rascunho" (novamente)
   - Deve dar erro: "Já existe uma categoria com este nome" ✅

3. **Teste 3: Outra entidade criar categoria com mesmo nome**
   - Usuário de outra entidade cria "Rascunho"
   - Deve funcionar ✅

## 📊 Impacto

**Antes da correção:**
- ❌ Apenas uma entidade pode usar cada nome de categoria
- ❌ Conflitos entre entidades diferentes
- ❌ Experiência ruim para multi-tenant

**Depois da correção:**
- ✅ Cada entidade tem suas próprias categorias
- ✅ Sem conflitos entre entidades
- ✅ Sistema multi-tenant funcional

## 🔍 Verificação

Para verificar se a correção foi aplicada:

```sql
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.categories'::regclass
  AND conname LIKE '%name%';
```

**Resultado esperado:**
```
constraint_name              | definition
-----------------------------|----------------------------------
categories_name_entity_unique| UNIQUE (name, entity_id)
```

## 🎯 Próximos Passos

Após aplicar esta correção, verifique se outras tabelas têm o mesmo problema:
- `document_types` - Deveria ser único por entidade?
- `departments` - Deveria ser único por entidade?
- `library_categories` - Deveria ser único por entidade?

## 💡 Lição Aprendida

Em sistemas **multi-tenant**, constraints de unicidade devem **sempre** considerar o `entity_id` (ou tenant_id) para evitar conflitos entre diferentes organizações/entidades.
