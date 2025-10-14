# 📋 Criar Bucket via Interface do Supabase (Sem SQL)

## 🎯 Solução para Erro de Permissão
Como o erro `must be owner of relation objects` indica falta de permissões para criar políticas via SQL, vamos usar a interface gráfica do Supabase.

## 📝 Passo a Passo via Interface

### 1. **Acesse o Supabase Dashboard**
- Vá para: https://supabase.com/dashboard
- Selecione seu projeto TrackDoc
- Clique em **"Storage"** no menu lateral

### 2. **Criar o Bucket**
1. Clique no botão **"New bucket"**
2. Preencha os campos:
   - **Name:** `signed-documents`
   - **Bucket ID:** `signed-documents`
   - **Public bucket:** ✅ **Marque esta opção**
   - **File size limit:** `50 MB`
   - **Allowed MIME types:** `application/pdf`

3. Clique em **"Create bucket"**

### 3. **Configurar Políticas RLS**
1. Após criar o bucket, clique nele
2. Vá para a aba **"Policies"**
3. Clique em **"New policy"**

#### **Política 1: Leitura Pública**
- **Policy name:** `Public read for signed documents`
- **Allowed operation:** `SELECT`
- **Target roles:** `public`
- **USING expression:**
  ```sql
  bucket_id = 'signed-documents'
  ```

#### **Política 2: Upload Autenticado**
- **Policy name:** `Authenticated upload for signed documents`
- **Allowed operation:** `INSERT`
- **Target roles:** `authenticated`
- **WITH CHECK expression:**
  ```sql
  bucket_id = 'signed-documents'
  ```

#### **Política 3: Update Autenticado**
- **Policy name:** `Authenticated update for signed documents`
- **Allowed operation:** `UPDATE`
- **Target roles:** `authenticated`
- **USING expression:**
  ```sql
  bucket_id = 'signed-documents'
  ```

### 4. **Verificar Configuração**
1. Vá para **Storage** → **signed-documents**
2. Verifique se o bucket está marcado como **"Public"**
3. Vá para **Policies** e confirme que as 3 políticas foram criadas

## 🔄 Alternativa: SQL Simplificado (Apenas Bucket)

Se preferir usar SQL apenas para criar o bucket (sem políticas):

```sql
-- Execute no SQL Editor
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signed-documents',
  'signed-documents',
  true,
  52428800,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;
```

Depois configure as políticas pela interface conforme descrito acima.

## ✅ Verificar se Funcionou

### **1. Teste Visual**
- Vá para Storage → signed-documents
- Deve aparecer como bucket público
- Deve ter 3 políticas ativas

### **2. Teste Funcional**
1. Crie uma assinatura múltipla
2. Todos os usuários aprovam
3. Verifique se o documento aparece no histórico
4. Teste o download

### **3. URL de Teste**
O documento deve ser acessível via URL:
```
https://dhdeyznmncgukexofcxy.supabase.co/storage/v1/object/public/signed-documents/[nome-do-arquivo].pdf
```

## 🚨 Troubleshooting

### **Bucket não aparece como público**
- Edite o bucket e marque "Public bucket"
- Salve as alterações

### **Políticas não funcionam**
- Verifique se RLS está habilitado
- Confirme as expressões SQL das políticas
- Teste com usuário autenticado

### **Download não funciona**
- Verifique se o arquivo existe no bucket
- Confirme se a URL está correta
- Teste a política de leitura pública

## 📞 Suporte

Se ainda houver problemas:
1. Verifique se você é admin do projeto
2. Tente recriar o bucket
3. Teste com um arquivo pequeno primeiro
4. Verifique logs de erro no console do navegador

---
**Método:** ✅ Interface gráfica (sem SQL)
**Tempo estimado:** 5-10 minutos
**Dificuldade:** Fácil