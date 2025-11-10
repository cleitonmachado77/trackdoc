# 📚 Instalação da Biblioteca Pública

## Guia Rápido de Instalação

### Passo 1: Executar Scripts SQL no Supabase

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá para **SQL Editor** no menu lateral
4. Clique em **New Query**

#### 1.1 Criar Tabela e Triggers

Cole e execute o conteúdo do arquivo `sql/create_public_library.sql`:

```sql
-- Cole aqui o conteúdo completo do arquivo sql/create_public_library.sql
```

#### 1.2 Configurar Políticas de Segurança (RLS)

Cole e execute o conteúdo do arquivo `sql/public_library_rls_policies.sql`:

```sql
-- Cole aqui o conteúdo completo do arquivo sql/public_library_rls_policies.sql
```

### Passo 2: Verificar Instalação

Execute a seguinte query para verificar se tudo foi criado corretamente:

```sql
-- Verificar se a tabela foi criada
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'public_library';

-- Verificar políticas RLS
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'public_library';

-- Verificar triggers
SELECT trigger_name 
FROM information_schema.triggers 
WHERE event_object_table = 'public_library';
```

### Passo 3: Testar a Funcionalidade

1. **Acesse a plataforma** e faça login
2. **Clique em "Biblioteca"** no menu lateral
3. **Adicione um documento** à biblioteca:
   - Clique em "Adicionar Documento"
   - Selecione um documento existente ou crie um novo
   - Preencha as informações
   - Clique em "Adicionar"
4. **Copie o link público** gerado
5. **Abra o link em uma aba anônima** para testar o acesso público

## Estrutura de Arquivos Criados

```
trackdoc/
├── sql/
│   ├── create_public_library.sql          # Criação da tabela e triggers
│   └── public_library_rls_policies.sql    # Políticas de segurança
├── app/
│   ├── biblioteca/
│   │   └── page.tsx                       # Página de gerenciamento interno
│   └── biblioteca-publica/
│       └── [slug]/
│           └── page.tsx                   # Página pública de visualização
├── docs/
│   └── biblioteca-publica.md              # Documentação completa
├── scripts/
│   └── setup-biblioteca-publica.js        # Script auxiliar de instalação
└── BIBLIOTECA_PUBLICA_INSTALACAO.md       # Este arquivo
```

## Funcionalidades Implementadas

### ✅ Gerenciamento Interno
- [x] Adicionar documentos existentes à biblioteca
- [x] Criar novos registros de documentos
- [x] Ativar/desativar documentos
- [x] Organizar por categorias
- [x] Copiar link público
- [x] Remover documentos

### ✅ Visualização Pública
- [x] Acesso sem autenticação
- [x] Visualização por entidade
- [x] Organização por categorias
- [x] Download de documentos
- [x] Visualização no navegador
- [x] Interface responsiva

### ✅ Segurança
- [x] Row Level Security (RLS)
- [x] Controle de acesso por entidade
- [x] Validação de documentos ativos
- [x] Slug único por entidade

## Configurações Adicionais (Opcional)

### Configurar Storage Público no Supabase

Para permitir que usuários não autenticados visualizem documentos:

1. Acesse **Storage** no Supabase Dashboard
2. Selecione o bucket **documents**
3. Vá para **Policies**
4. Adicione uma política de leitura pública:

```sql
CREATE POLICY "Public can view documents in public library"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'documents' 
  AND name IN (
    SELECT file_path 
    FROM public.public_library 
    WHERE is_active = true
  )
);
```

### Customizar Domínio (Opcional)

Para usar um domínio personalizado para a biblioteca pública:

1. Configure um domínio no Vercel/Netlify
2. Adicione um redirect/rewrite para `/biblioteca-publica/*`
3. Atualize as variáveis de ambiente se necessário

## Solução de Problemas

### Erro: "Tabela não encontrada"
- Verifique se o script SQL foi executado corretamente
- Confirme que está no schema `public`

### Erro: "Permissão negada"
- Verifique se as políticas RLS foram criadas
- Confirme que o usuário tem `entity_id` no perfil

### Link público não funciona
- Verifique se o documento está marcado como `is_active = true`
- Confirme que o slug está correto
- Verifique as políticas de storage

### Documentos não aparecem na página pública
- Confirme que `is_active = true`
- Verifique se o `entity_id` está correto
- Teste a query diretamente no SQL Editor

## Próximos Passos

Após a instalação, você pode:

1. **Personalizar o design** da página pública
2. **Adicionar analytics** para rastrear visualizações
3. **Implementar cache** para melhor performance
4. **Adicionar SEO** com meta tags
5. **Criar templates** customizados por entidade

## Suporte

Para mais informações, consulte:
- 📖 [Documentação Completa](docs/biblioteca-publica.md)
- 🐛 Issues no GitHub
- 💬 Suporte da equipe

---

**Versão**: 1.0.0  
**Data**: Novembro 2025  
**Autor**: TrackDoc Team
