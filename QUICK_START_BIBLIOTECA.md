# 🚀 Quick Start - Biblioteca Pública

## ⚡ Instalação em 3 Passos

### 1️⃣ Execute o SQL no Supabase (2 minutos)

```bash
# Acesse: https://app.supabase.com
# Vá para: SQL Editor > New Query
# Cole e execute os 2 arquivos SQL:
```

**Arquivo 1**: `sql/create_public_library.sql`
**Arquivo 2**: `sql/public_library_rls_policies.sql`

### 2️⃣ Verifique a Instalação (30 segundos)

```sql
-- Execute no SQL Editor para verificar:
SELECT table_name FROM information_schema.tables WHERE table_name = 'public_library';
-- Deve retornar: public_library

SELECT count(*) FROM pg_policies WHERE tablename = 'public_library';
-- Deve retornar: 5 (cinco políticas)
```

### 3️⃣ Teste a Funcionalidade (1 minuto)

1. Faça login na plataforma
2. Clique em **"Biblioteca"** no menu lateral
3. Clique em **"Adicionar Documento"**
4. Selecione um documento existente
5. Clique em **"Copiar Link"**
6. Abra o link em uma aba anônima ✅

---

## 📱 Como Usar

### Para Administradores

```
1. Menu Lateral → Biblioteca
2. Adicionar Documento
3. Escolher: Existente ou Novo
4. Preencher informações
5. Copiar Link Público
6. Compartilhar! 🎉
```

### Para Usuários Externos

```
1. Receber link público
2. Abrir no navegador
3. Ver documentos organizados
4. Baixar ou visualizar
5. Sem login necessário! 🔓
```

---

## 🎯 Recursos Principais

| Recurso | Descrição | Status |
|---------|-----------|--------|
| 📄 Adicionar Documentos | Existentes ou novos | ✅ |
| 🔗 Link Público | Compartilhável | ✅ |
| 👁️ Ativar/Desativar | Controle de visibilidade | ✅ |
| 🏷️ Categorias | Organização | ✅ |
| 🔒 Segurança | RLS + Validações | ✅ |
| 📱 Responsivo | Mobile-friendly | ✅ |

---

## 💻 Código Rápido

### Hook React

```typescript
import { usePublicLibrary } from "@/hooks/use-public-library"

const { items, addExistingDocument, copyPublicLink } = usePublicLibrary({
  entityId: "your-entity-id"
})

// Adicionar documento
await addExistingDocument("doc-id", "entity-id")

// Copiar link
await copyPublicLink("slug-123")
```

### API Direta

```typescript
// Adicionar à biblioteca
await supabase.from("public_library").insert({
  entity_id: "entity-id",
  title: "Meu Documento",
  is_active: true
})

// Buscar documentos públicos
await supabase.from("public_library")
  .select("*")
  .eq("public_slug", "slug-123")
  .eq("is_active", true)
```

---

## 🔍 Estrutura de Pastas

```
trackdoc/
├── sql/
│   ├── create_public_library.sql          ← Execute primeiro
│   └── public_library_rls_policies.sql    ← Execute segundo
├── app/
│   ├── biblioteca/page.tsx                ← Página interna
│   └── biblioteca-publica/[slug]/page.tsx ← Página pública
├── hooks/
│   └── use-public-library.ts              ← Hook customizado
├── examples/
│   └── biblioteca-publica-api-example.ts  ← Exemplos
└── docs/
    └── biblioteca-publica.md              ← Documentação
```

---

## ⚠️ Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| Tabela não existe | Execute `create_public_library.sql` |
| Permissão negada | Execute `public_library_rls_policies.sql` |
| Link não funciona | Verifique `is_active = true` |
| Não aparece no menu | Limpe cache do navegador |

---

## 📊 Fluxo Visual

```
┌─────────────────────────────────────────────────────────┐
│                    ADMINISTRADOR                         │
├─────────────────────────────────────────────────────────┤
│  1. Login na Plataforma                                 │
│  2. Menu → Biblioteca                                   │
│  3. Adicionar Documento                                 │
│  4. Copiar Link Público                                 │
│  5. Compartilhar Link                                   │
└─────────────────────────────────────────────────────────┘
                          ↓
                    [Link Público]
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  USUÁRIO EXTERNO                         │
├─────────────────────────────────────────────────────────┤
│  1. Recebe Link                                         │
│  2. Abre no Navegador (sem login)                       │
│  3. Vê Documentos Organizados                           │
│  4. Baixa ou Visualiza                                  │
│  5. Sem Cadastro Necessário! ✅                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Preview da Interface

### Página Interna (Gerenciamento)
```
┌────────────────────────────────────────────┐
│  📚 Biblioteca Pública                     │
│  ┌──────────────────────────────────────┐ │
│  │ [+ Adicionar Documento]              │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │ 📄 Manual do Usuário                 │ │
│  │ Categoria: Manuais                   │ │
│  │ Status: ✅ Ativo                     │ │
│  │ [👁️] [🔗 Copiar] [🗑️]              │ │
│  └──────────────────────────────────────┘ │
└────────────────────────────────────────────┘
```

### Página Pública (Visualização)
```
┌────────────────────────────────────────────┐
│  🏢 Nome da Empresa                        │
│  Biblioteca Pública de Documentos          │
├────────────────────────────────────────────┤
│  📁 Políticas                              │
│  ┌──────────────┐ ┌──────────────┐       │
│  │ 📄 Política  │ │ 📄 Código    │       │
│  │ de Privac.   │ │ de Conduta   │       │
│  │ [Ver] [⬇️]   │ │ [Ver] [⬇️]   │       │
│  └──────────────┘ └──────────────┘       │
│                                            │
│  📁 Manuais                                │
│  ┌──────────────┐                         │
│  │ 📄 Manual    │                         │
│  │ do Usuário   │                         │
│  │ [Ver] [⬇️]   │                         │
│  └──────────────┘                         │
└────────────────────────────────────────────┘
```

---

## ✅ Checklist de Instalação

- [ ] Executei `create_public_library.sql`
- [ ] Executei `public_library_rls_policies.sql`
- [ ] Verifiquei que a tabela foi criada
- [ ] Verifiquei que as políticas foram criadas
- [ ] Testei adicionar um documento
- [ ] Copiei e testei o link público
- [ ] Link funciona em aba anônima
- [ ] Documentos aparecem organizados

---

## 🎯 Próximos Passos

1. ✅ **Instalação Completa**
2. 🎨 **Personalizar Design** (opcional)
3. 📊 **Adicionar Analytics** (opcional)
4. 🚀 **Compartilhar Links**
5. 🎉 **Usar e Aproveitar!**

---

## 📞 Precisa de Ajuda?

- 📖 **Documentação Completa**: `docs/biblioteca-publica.md`
- 🔧 **Guia de Instalação**: `BIBLIOTECA_PUBLICA_INSTALACAO.md`
- 📝 **Resumo Completo**: `BIBLIOTECA_PUBLICA_RESUMO.md`
- 💻 **Exemplos de Código**: `examples/biblioteca-publica-api-example.ts`

---

## 🌟 Dica Pro

Use o hook `usePublicLibrary` para facilitar o desenvolvimento:

```typescript
const biblioteca = usePublicLibrary({ entityId })

// Tudo que você precisa em um só lugar:
biblioteca.items          // Lista de documentos
biblioteca.loading        // Estado de carregamento
biblioteca.addExistingDocument()  // Adicionar
biblioteca.toggleActive()         // Ativar/Desativar
biblioteca.copyPublicLink()       // Copiar link
biblioteca.stats          // Estatísticas
```

---

**🚀 Pronto! Sua Biblioteca Pública está configurada!**

**Tempo total de instalação**: ~5 minutos  
**Dificuldade**: ⭐⭐☆☆☆ (Fácil)  
**Status**: ✅ Pronto para Produção

---

*Criado com ❤️ pela equipe TrackDoc*
