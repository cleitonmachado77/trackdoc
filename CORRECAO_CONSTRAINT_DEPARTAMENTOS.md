# 🔧 Correção: Constraint Única de Departamentos

## 📋 Problema Identificado

A tabela `departments` possui uma constraint única apenas no campo `name`:
```sql
constraint departments_name_key unique (name)
```

Isso impede que diferentes entidades tenham departamentos com o mesmo nome (ex: "TI", "RH", "Financeiro").

## ✅ Solução

Alterar a constraint para ser única por **entidade + nome**:
```sql
constraint departments_entity_name_unique unique (entity_id, name)
```

## 🚀 Como Executar

### Opção 1: Via Supabase Dashboard

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Cole e execute o seguinte SQL:

```sql
-- Remover constraint antiga
ALTER TABLE public.departments 
DROP CONSTRAINT IF EXISTS departments_name_key;

-- Criar nova constraint (entity_id + name)
ALTER TABLE public.departments 
ADD CONSTRAINT departments_entity_name_unique UNIQUE (entity_id, name);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_departments_entity_name 
ON public.departments (entity_id, name);
```

### Opção 2: Via arquivo de migração

Execute o arquivo `migrations/fix_departments_unique_constraint.sql`

## 🎯 Resultado Esperado

Após a migração:
- ✅ Cada entidade pode ter seus próprios departamentos
- ✅ Nomes podem se repetir entre entidades diferentes
- ✅ Nomes continuam únicos dentro da mesma entidade
- ✅ Erro 409 (Conflict) será resolvido

## ⚠️ Importante

Execute esta migração **antes** de tentar criar novos departamentos.