# Página Office - Editor de Documentos

## Visão Geral

A página Office permite que usuários criem e editem documentos Word diretamente na plataforma, sem necessidade de software externo como Microsoft Word ou LibreOffice.

## Localização

- **Menu:** Sidebar → Office (entre "Assinatura Eletrônica" e "Aprovações")
- **Rota:** `/office` (gerenciada internamente pelo sistema de views)

## Funcionalidades

### 1. Criar Novo Documento
- Cria um documento Word em branco
- Editor completo com formatação
- Salva automaticamente no storage

### 2. Enviar Documento Existente
- Upload de arquivos Word (.doc, .docx, .odt)
- Validação de tipo de arquivo
- Armazenamento seguro no Supabase Storage

### 3. Editar Documentos
- Lista todos os documentos do usuário
- Busca por nome
- Edição em tempo real
- Formatação completa (fontes, cores, tabelas, imagens)

### 4. Gerenciar Documentos
- Download de documentos
- Exclusão de documentos
- Visualização de data de atualização

## Arquitetura

### Componentes

1. **`app/office/page.tsx`**
   - Página principal com lista de documentos
   - Gerenciamento de uploads
   - Busca e filtros

2. **`app/components/document-editor.tsx`**
   - Editor OnlyOffice integrado
   - Gerenciamento de salvamento
   - Configuração do editor

### Fluxo de Dados

```
Usuário → Lista de Documentos → Seleção/Criação → Editor → Salvamento → Storage
```

### Storage

Os documentos são armazenados em:
- **Bucket:** `documents`
- **Estrutura:** `{user_id}/{timestamp}_{filename}`
- **Metadados:** Tabela `documents` no Supabase

## Integração com OnlyOffice

### Requisitos

1. OnlyOffice Document Server rodando
2. Variável de ambiente configurada: `NEXT_PUBLIC_ONLYOFFICE_URL`

### Configuração

Ver documentação completa em: `docs/ONLYOFFICE_SETUP.md`

### Modo de Desenvolvimento

Sem o Document Server configurado, a página exibe:
- Lista de documentos funcional
- Upload funcional
- Placeholder do editor com instruções de configuração

## Segurança

### Validações

- ✅ Autenticação obrigatória
- ✅ Validação de tipo de arquivo
- ✅ Isolamento por usuário (user_id)
- ✅ Validação de permissões no Supabase

### Storage Policies

Os documentos são protegidos por RLS (Row Level Security):
- Usuários só podem acessar seus próprios documentos
- Upload requer autenticação
- Download requer autenticação e ownership

## Tipos de Arquivo Suportados

| Formato | Extensão | MIME Type |
|---------|----------|-----------|
| Word 2007+ | .docx | application/vnd.openxmlformats-officedocument.wordprocessingml.document |
| Word 97-2003 | .doc | application/msword |
| OpenDocument | .odt | application/vnd.oasis.opendocument.text |

## API Endpoints

### Listar Documentos
```typescript
supabase
  .from('documents')
  .select('*')
  .eq('user_id', user.id)
  .order('updated_at', { ascending: false })
```

### Upload
```typescript
supabase.storage
  .from('documents')
  .upload(fileName, file)
```

### Download
```typescript
supabase.storage
  .from('documents')
  .download(filePath)
```

### Deletar
```typescript
supabase
  .from('documents')
  .delete()
  .eq('id', documentId)
```

## Melhorias Futuras

### Curto Prazo
- [ ] Colaboração em tempo real (múltiplos usuários)
- [ ] Versionamento de documentos
- [ ] Comentários e revisões
- [ ] Templates pré-definidos

### Médio Prazo
- [ ] Exportação para PDF
- [ ] Integração com assinatura eletrônica
- [ ] Compartilhamento de documentos
- [ ] Histórico de alterações

### Longo Prazo
- [ ] Suporte a Excel e PowerPoint
- [ ] OCR para documentos escaneados
- [ ] IA para sugestões de texto
- [ ] Integração com workflows de aprovação

## Troubleshooting

### Editor não carrega

1. Verificar se OnlyOffice está rodando: `docker ps`
2. Verificar variável de ambiente
3. Verificar console do navegador para erros
4. Verificar logs do Document Server

### Upload falha

1. Verificar permissões do bucket no Supabase
2. Verificar tamanho do arquivo (limite padrão: 50MB)
3. Verificar tipo de arquivo
4. Verificar autenticação do usuário

### Documento não salva

1. Verificar conexão com Supabase
2. Verificar permissões RLS
3. Verificar logs do navegador
4. Verificar configuração do callback do OnlyOffice

## Contato

Para dúvidas ou sugestões sobre esta funcionalidade, entre em contato com a equipe de desenvolvimento.
