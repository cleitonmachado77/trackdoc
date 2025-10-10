# 🔧 Correção de Títulos NULL - Implementação Completa

## ❌ Problema Identificado

### **Situação:**
- Novos documentos assinados estão sendo inseridos com `title = null`
- Exemplo do registro problemático:
```sql
INSERT INTO "public"."document_signatures" 
(..., "title") VALUES 
(..., null);
```

### **Causa Raiz:**
- A API `/api/arsign/route.ts` não estava incluindo o campo `title` na inserção
- Apenas o SQL de atualização foi criado, mas não a lógica para novos registros

## ✅ Solução Implementada

### **1. Correção na API de Assinatura:**

#### **Antes:**
```typescript
const { error: insertError } = await supabase.from('document_signatures').insert({
  user_id: user.id,
  document_id: documentId || null,
  arqsign_document_id: signature.id,
  status: 'completed',
  signature_url: signedFileName,
  // ❌ Sem campo title
  verification_code: signature.verificationCode,
  // ... outros campos
})
```

#### **Depois:**
```typescript
// Extrair título do nome do arquivo
const extractTitle = (fileName: string) => {
  if (!fileName) return null
  
  // Remove o path e a extensão .pdf
  const nameWithoutPath = fileName.replace(/^.*\//, '') // Remove path
  const nameWithoutExtension = nameWithoutPath.replace(/\.pdf$/i, '') // Remove .pdf
  
  // Se ainda tem .pdf no meio (como signed_xxx.pdf.pdf), remove novamente
  const cleanName = nameWithoutExtension.replace(/\.pdf$/i, '')
  
  return cleanName || null
}

const documentTitle = extractTitle(signedFileName)
console.log('📝 Título extraído:', documentTitle, 'do arquivo:', signedFileName)

const { error: insertError } = await supabase.from('document_signatures').insert({
  user_id: user.id,
  document_id: documentId || null,
  arqsign_document_id: signature.id,
  status: 'completed',
  signature_url: signedFileName,
  title: documentTitle, // ✅ NOVO CAMPO
  verification_code: signature.verificationCode,
  // ... outros campos
})
```

### **2. Lógica de Extração de Título:**

#### **Função `extractTitle`:**
```typescript
const extractTitle = (fileName: string) => {
  if (!fileName) return null
  
  // Remove o path e a extensão .pdf
  const nameWithoutPath = fileName.replace(/^.*\//, '') // Remove path
  const nameWithoutExtension = nameWithoutPath.replace(/\.pdf$/i, '') // Remove .pdf
  
  // Se ainda tem .pdf no meio (como signed_xxx.pdf.pdf), remove novamente
  const cleanName = nameWithoutExtension.replace(/\.pdf$/i, '')
  
  return cleanName || null
}
```

#### **Exemplos de Transformação:**
| Arquivo Original | Título Extraído |
|------------------|-----------------|
| `signed_1760113985089_1554_UNDIME.pdf.pdf` | `signed_1760113985089_1554_UNDIME` |
| `documento_teste.pdf` | `documento_teste` |
| `path/to/file.pdf` | `file` |
| `signed_123_CONTRATO.pdf.pdf` | `signed_123_CONTRATO` |

### **3. SQL para Corrigir Registros Existentes:**

#### **Script Completo:**
```sql
-- Atualizar registros com título NULL
UPDATE public.document_signatures 
SET title = CASE 
    WHEN signature_url IS NOT NULL THEN 
        -- Extrair nome do arquivo (remove path e extensões .pdf)
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(signature_url, '^.*/', ''), -- Remove path
                '\\.pdf\\.pdf$', '', 'gi' -- Remove .pdf.pdf duplo
            ),
            '\\.pdf$', '', 'gi' -- Remove .pdf simples
        )
    WHEN arqsign_document_id IS NOT NULL THEN 
        -- Usar ID do documento como fallback
        'Documento ' || arqsign_document_id
    ELSE 
        'Documento sem título'
END
WHERE title IS NULL;
```

#### **Correção Específica:**
```sql
-- Corrigir o registro mencionado pelo usuário
UPDATE public.document_signatures 
SET title = 'signed_1760113985089_1554_UNDIME'
WHERE id = '0a2aee3a-5e32-43d1-b43a-ab942900d2e9' 
  AND signature_url = 'signed_1760113985089_1554_UNDIME.pdf.pdf'
  AND title IS NULL;
```

## 🔍 Verificação e Testes

### **1. Verificar Registros com Título NULL:**
```sql
SELECT 
    id,
    signature_url,
    arqsign_document_id,
    title,
    created_at
FROM public.document_signatures 
WHERE title IS NULL
ORDER BY created_at DESC;
```

### **2. Testar Nova Assinatura:**
1. Assinar um novo documento
2. Verificar se o título é preenchido automaticamente
3. Confirmar na aba "Histórico" se o título aparece

### **3. Estatísticas:**
```sql
SELECT 
    COUNT(*) as total_signatures,
    COUNT(title) as signatures_with_title,
    COUNT(*) - COUNT(title) as signatures_without_title,
    ROUND(COUNT(title) * 100.0 / COUNT(*), 2) as percentage_with_title
FROM public.document_signatures;
```

## 📊 Resultado Esperado

### **Antes da Correção:**
```
Registro: id = '0a2aee3a-5e32-43d1-b43a-ab942900d2e9'
Arquivo: 'signed_1760113985089_1554_UNDIME.pdf.pdf'
Título: null ❌
Interface: "Documento N/A" ou "Documento sem título"
```

### **Depois da Correção:**
```
Registro: id = '0a2aee3a-5e32-43d1-b43a-ab942900d2e9'
Arquivo: 'signed_1760113985089_1554_UNDIME.pdf.pdf'
Título: 'signed_1760113985089_1554_UNDIME' ✅
Interface: "signed_1760113985089_1554_UNDIME"
```

### **Novos Registros:**
```
Processo: Usuário assina documento "CONTRATO.pdf"
Arquivo salvo: 'signed_123456789_CONTRATO.pdf.pdf'
Título extraído: 'signed_123456789_CONTRATO' ✅
Inserção: title = 'signed_123456789_CONTRATO'
Interface: Exibe "signed_123456789_CONTRATO"
```

## 🚀 Próximos Passos

### **1. Executar SQL de Correção:**
Execute o arquivo `SQL_FIX_NULL_TITLES.sql` no Supabase para:
- Corrigir todos os registros com título NULL
- Verificar o registro específico mencionado
- Obter estatísticas atualizadas

### **2. Testar Nova Assinatura:**
1. Assinar um novo documento
2. Verificar se o título é preenchido automaticamente
3. Confirmar na aba "Histórico" se aparece corretamente

### **3. Validar Interface:**
1. Acessar aba "Histórico"
2. Verificar se todos os documentos têm títulos
3. Confirmar que não há mais "Documento sem título"

## ✅ Benefícios da Correção

- ✅ **Novos registros** sempre terão título automaticamente
- ✅ **Registros existentes** serão corrigidos pelo SQL
- ✅ **Interface consistente** sem mais títulos vazios
- ✅ **Experiência melhorada** com identificação clara
- ✅ **Manutenção automática** para futuras assinaturas

---

## 🎯 Status da Correção

✅ **LÓGICA DE EXTRAÇÃO IMPLEMENTADA**  
✅ **API ATUALIZADA PARA INCLUIR TÍTULO**  
✅ **SQL DE CORREÇÃO CRIADO**  
✅ **REGISTRO ESPECÍFICO IDENTIFICADO**  
✅ **TESTES E VALIDAÇÃO DOCUMENTADOS**  

**Agora todos os novos documentos assinados terão títulos automaticamente!** 🚀