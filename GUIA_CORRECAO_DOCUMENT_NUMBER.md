# Guia de Correção do Document Number

## 🔍 Problema Identificado

**Erro 409 ao criar documentos** causado por:
1. Constraint `UNIQUE` global no `document_number` (deveria ser por entidade)
2. Formatos diferentes de numeração: `"2025-00012"` (antigo) e `"000012"` (novo)
3. Possível dessincronização da tabela `document_sequences`

## 📋 Ordem de Execução

### 1️⃣ MIGRAR_FORMATO_DOCUMENT_NUMBER.sql
**Objetivo:** Converter todos os números do formato antigo para o novo

**O que faz:**
- Converte `"2025-00012"` → `"000012"`
- Atualiza as sequências para refletir os números migrados
- Verifica se há conflitos

**Execute primeiro!**

```sql
-- No Supabase SQL Editor, execute:
-- MIGRAR_FORMATO_DOCUMENT_NUMBER.sql
```

### 2️⃣ CORRIGIR_CONSTRAINT_DOCUMENT_NUMBER.sql
**Objetivo:** Corrigir a constraint para permitir números iguais em entidades diferentes

**O que faz:**
- Remove constraint `UNIQUE (document_number)` global
- Cria constraint `UNIQUE (entity_id, document_number)` por entidade
- Renumera documentos duplicados (se houver)

**Execute depois da migração!**

```sql
-- No Supabase SQL Editor, execute:
-- CORRIGIR_CONSTRAINT_DOCUMENT_NUMBER.sql
```

### 3️⃣ CORRIGIR_SEQUENCIA_DOCUMENTOS.sql (Opcional)
**Objetivo:** Corrigir sequências dessincronizadas

**Use apenas se:**
- Ainda houver erros 409 após os passos anteriores
- As sequências estiverem dessincronizadas

## ✅ Verificação Final

Após executar os scripts, verifique:

```sql
-- 1. Todos os números devem estar no formato novo
SELECT 
    CASE 
        WHEN document_number ~ '^\d{6}$' THEN 'Novo ✅'
        ELSE 'Antigo ❌'
    END as formato,
    COUNT(*) as quantidade
FROM documents
WHERE document_number IS NOT NULL
GROUP BY 1;

-- 2. Não deve haver duplicatas dentro da mesma entidade
SELECT 
    entity_id,
    document_number,
    COUNT(*) as duplicatas
FROM documents
GROUP BY entity_id, document_number
HAVING COUNT(*) > 1;

-- 3. Sequências devem estar corretas
SELECT 
    ds.entity_id,
    e.name,
    ds.last_number as sequencia,
    MAX(d.document_number::INTEGER) as maior_numero,
    CASE 
        WHEN ds.last_number >= MAX(d.document_number::INTEGER) 
        THEN '✅ OK' 
        ELSE '❌ ERRO' 
    END as status
FROM document_sequences ds
LEFT JOIN entities e ON e.id = ds.entity_id
LEFT JOIN documents d ON d.entity_id = ds.entity_id
GROUP BY ds.entity_id, e.name, ds.last_number;
```

## 🎯 Resultado Esperado

Após a correção:
- ✅ Cada entidade pode ter seus próprios números (000001, 000002...)
- ✅ Não haverá mais conflito entre entidades
- ✅ Todos os números estarão no formato padronizado (000001)
- ✅ As sequências estarão sincronizadas

## 🚨 Em Caso de Erro

Se ainda houver problemas:

1. **Verifique os logs** no console do navegador
2. **Execute as queries de verificação** acima
3. **Compartilhe os resultados** para análise

## 📝 Notas Importantes

- ⚠️ Faça backup antes de executar
- ⚠️ Execute em horário de baixo uso
- ⚠️ Teste em ambiente de desenvolvimento primeiro (se possível)
- ✅ Os scripts são idempotentes (podem ser executados múltiplas vezes)
