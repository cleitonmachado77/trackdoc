# Padronização de Títulos - TrackDoc

## Componente PageTitle

Foi criado um componente padronizado `PageTitle` para unificar o tamanho e estilo dos títulos em toda a plataforma.

### Localização
```
components/ui/page-title.tsx
```

### Uso Básico

```tsx
import { PageTitle } from "@/components/ui/page-title"

// Título simples
<PageTitle
  title="Nome da Página"
  subtitle="Descrição opcional da página"
/>

// Título com botões de ação
<PageTitle
  title="Nome da Página"
  subtitle="Descrição opcional da página"
>
  <Button>Ação 1</Button>
  <Button>Ação 2</Button>
</PageTitle>
```

### Propriedades

| Propriedade | Tipo | Padrão | Descrição |
|-------------|------|--------|-----------|
| `title` | string | - | Título principal (obrigatório) |
| `subtitle` | string | - | Subtítulo opcional |
| `size` | "sm" \| "md" \| "lg" \| "xl" | "md" | Tamanho do título |
| `centered` | boolean | false | Centralizar o título |
| `className` | string | - | Classes CSS adicionais |
| `children` | ReactNode | - | Botões ou elementos de ação |

### Tamanhos Disponíveis

| Size | Classe CSS | Uso Recomendado |
|------|------------|-----------------|
| `sm` | `text-2xl` | Seções internas, modais |
| `md` | `text-3xl` | **Padrão** - Páginas principais |
| `lg` | `text-4xl` | Páginas de destaque (pricing, support) |
| `xl` | `text-5xl` | Landing pages, páginas especiais |

### Cores e Tema

O componente usa automaticamente as cores do sistema:
- **Modo Claro**: `text-trackdoc-black` para título, `text-trackdoc-gray` para subtítulo
- **Modo Escuro**: `text-foreground` para título, `text-muted-foreground` para subtítulo

### Exemplos de Implementação

#### 1. Página Principal (Dashboard)
```tsx
<PageTitle
  title="Dashboard"
  subtitle="Visão geral do sistema"
/>
```

#### 2. Página com Ações
```tsx
<PageTitle
  title="Biblioteca Pública"
  subtitle="Gerencie documentos públicos acessíveis por link externo"
>
  <Button variant="outline">
    <Eye className="h-4 w-4 mr-2" />
    Abrir Biblioteca
  </Button>
  <Button variant="outline">
    <Copy className="h-4 w-4 mr-2" />
    Copiar Link
  </Button>
</PageTitle>
```

#### 3. Página Centralizada
```tsx
<PageTitle
  title="Suporte e Contato"
  subtitle="Estamos aqui para ajudar você"
  size="lg"
  centered
/>
```

### Páginas Atualizadas

As seguintes páginas já foram atualizadas para usar o componente padronizado:

#### Páginas Principais
- ✅ `app/page.tsx` (Dashboard + seções Aprovações e Administração)
- ✅ `app/biblioteca/page.tsx` (Biblioteca Pública)
- ✅ `app/minha-conta/page.tsx` (Minha Conta)
- ✅ `app/support/page.tsx` (Suporte)
- ✅ `app/pricing/page.tsx` (Planos)
- ✅ `app/super-admin/page.tsx` (Painel de Administração)
- ✅ `app/verify-signature/page.tsx` (Verificação de Assinaturas)
- ✅ `app/choose-plan/page.tsx` (Escolha seu Plano)

#### Componentes
- ✅ `app/components/help-center.tsx` (Central de Ajuda)
- ✅ `app/components/unified-notifications-page.tsx` (Central de Notificações)
- ✅ `app/components/ai-document-creator.tsx` (Criador de Documentos com IA)
- ✅ `app/components/admin/user-management.tsx` (Gerenciar Usuários)
- ✅ `app/components/admin/entity-user-management.tsx` (Usuários da Entidade)

### Migração de Páginas Existentes

Para migrar uma página existente:

1. **Importe o componente:**
```tsx
import { PageTitle } from "@/components/ui/page-title"
```

2. **Substitua o título atual:**
```tsx
// Antes
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-3xl font-bold text-trackdoc-black">Título</h1>
    <p className="text-trackdoc-gray mt-1">Subtítulo</p>
  </div>
  <div className="flex gap-2">
    <Button>Ação</Button>
  </div>
</div>

// Depois
<PageTitle
  title="Título"
  subtitle="Subtítulo"
>
  <Button>Ação</Button>
</PageTitle>
```

### Benefícios da Padronização

1. **Consistência Visual**: Todos os títulos seguem o mesmo padrão de tamanho e espaçamento
2. **Manutenibilidade**: Mudanças no estilo podem ser feitas em um local central
3. **Responsividade**: O componente se adapta automaticamente aos temas claro/escuro
4. **Flexibilidade**: Suporte a diferentes tamanhos e layouts conforme necessário
5. **Acessibilidade**: Estrutura semântica correta com elementos H1

### Padrão de Tamanho

O tamanho padrão `md` (text-3xl) foi escolhido baseado na página "Biblioteca Pública" (Documentos), que serve como referência para toda a plataforma.