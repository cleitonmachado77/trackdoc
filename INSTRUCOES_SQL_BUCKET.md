# 📋 Instruções: Criar Bucket para Documentos Assinados

## 🎯 Objetivo
Criar o bucket `signed-documents` no Supabase Storage para armazenar documentos de assinatura múltipla finalizados.

## 📝 Passo a Passo

### 1. **Acesse o Supabase Dashboard**
- Vá para: https://supabase.com/dashboard
- Selecione seu projeto TrackDoc
- Clique em "SQL Editor" no menu lateral

### 2. **Execute o Script SQL**
Copie e cole o conteúdo do arquivo `SQL_CREATE_SIGNED_DOCUMENTS_BUCKET_SIMPLE.sql`:

```sql
-- 1. Criar bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signed-documents',
  'signed-documents',
  true,
  52428800,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Habilitar RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de acesso
CREATE POLICY "Public read for signed documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'signed-documents');

CREATE POLICY "Authenticated upload for signed documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'signed-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated update for signed documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'signed-documents' 
  AND auth.role() = 'authenticated'
);
```

### 3. **Verificar Criação**
Execute esta consulta para verificar:

```sql
-- Verificar bucket
SELECT 
  id,
  name,
  public,
  file_size_limit
FROM storage.buckets 
WHERE id = 'signed-documents';

-- Verificar políticas
SELECT 
  policyname
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%signed documents%';
```

## ✅ Resultado Esperado

### **Bucket Criado:**
- ID: `signed-documents`
- Nome: `signed-documents`
- Público: `true`
- Limite: `52428800` (50MB)
- Tipos: `{application/pdf}`

### **Políticas Criadas:**
- `Public read for signed documents`
- `Authenticated upload for signed documents`
- `Authenticated update for signed documents`

## 🚨 Possíveis Erros

### **Erro: "policy already exists"**
**Solução:** Ignore, significa que já foi criado antes.

### **Erro: "bucket already exists"**
**Solução:** Ignore, o `ON CONFLICT DO NOTHING` trata isso.

### **Erro de sintaxe**
**Solução:** Execute cada comando separadamente.

## 🧪 Testar Funcionamento

Após criar o bucket, teste uma assinatura múltipla:

1. Crie uma solicitação de assinatura múltipla
2. Todos os usuários aprovam
3. Verifique se o documento aparece no histórico
4. Teste o download do documento assinado

## 📞 Suporte

Se houver problemas:
1. Verifique se está no projeto correto
2. Confirme permissões de administrador
3. Execute comandos um por vez
4. Verifique logs de erro no Supabase

---
**Status:** ✅ Pronto para execução
**Tempo estimado:** 2-3 minutos