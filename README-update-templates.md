# Atualização de Templates de Assinatura

Este diretório contém scripts para atualizar o texto padrão dos templates de assinatura de:

**Texto antigo:** "Este documento foi assinado digitalmente com certificado válido."

**Texto novo:** "Este documento foi assinado digitalmente e pode ser verificado em www.trackdoc.com.br."

## Problema Identificado

A tabela `signature_templates` no banco de dados tem um valor padrão definido com o texto antigo, e usuários existentes podem ter templates salvos com o texto antigo.

## Soluções Disponíveis

### Opção 1: Script SQL (Recomendado)

Execute o arquivo `update-signature-templates.sql` diretamente no **Supabase SQL Editor**:

1. Acesse o painel do Supabase
2. Vá para "SQL Editor"
3. Cole o conteúdo do arquivo `update-signature-templates.sql`
4. Execute o script

### Opção 2: Script Node.js

Se você tem acesso às variáveis de ambiente e chave de serviço:

```bash
# Instalar dependências (se necessário)
npm install @supabase/supabase-js

# Definir variáveis de ambiente
export NEXT_PUBLIC_SUPABASE_URL="sua_url_aqui"
export SUPABASE_SERVICE_ROLE_KEY="sua_chave_de_servico_aqui"

# Executar o script
node update-signature-templates.js
```

## O que os scripts fazem

1. **Atualizam o valor padrão da coluna** `custom_text` na tabela `signature_templates`
2. **Atualizam todos os registros existentes** que ainda usam o texto antigo
3. **Mostram estatísticas** de quantos templates foram atualizados

## Verificação

Após executar, você pode verificar se a atualização funcionou:

```sql
SELECT 
  COUNT(*) as total_templates,
  COUNT(CASE WHEN custom_text LIKE '%www.trackdoc.com.br%' THEN 1 END) as templates_with_new_text,
  COUNT(CASE WHEN custom_text LIKE '%certificado válido%' THEN 1 END) as templates_with_old_text
FROM public.signature_templates;
```

## Limpeza

Após executar com sucesso, você pode deletar estes arquivos:
- `update-signature-templates.js`
- `update-signature-templates.sql`
- `README-update-templates.md`