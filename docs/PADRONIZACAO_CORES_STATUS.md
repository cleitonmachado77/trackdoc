# Padronização de Cores de Status - TrackDoc

## ✅ Implementação Concluída

### Objetivo
Padronizar as cores das tags de status de documentos em toda a plataforma, usando cores mais suaves e consistentes.

## Novo Sistema de Cores

### Componente Principal
**`components/ui/document-status-badge.tsx`** - Componente padronizado para badges de status

### Cores Padronizadas

| Status | Cor de Fundo | Cor do Texto | Cor da Borda | Classe CSS |
|--------|--------------|--------------|--------------|------------|
| **Aprovado** | Verde claro | Verde escuro | Verde médio | `bg-green-50 text-green-700 border-green-200` |
| **Em aprovação** | Âmbar claro | Âmbar escuro | Âmbar médio | `bg-amber-50 text-amber-700 border-amber-200` |
| **Rejeitado** | Vermelho claro | Vermelho escuro | Vermelho médio | `bg-red-50 text-red-700 border-red-200` |
| **Sem aprovação** | Cinza claro | Cinza escuro | Cinza médio | `bg-gray-50 text-gray-700 border-gray-200` |

### Cores para Gráficos e Indicadores

| Status | Cor Principal | Código Hex |
|--------|---------------|------------|
| **Aprovado** | Verde | `#059669` (green-600) |
| **Em aprovação** | Âmbar | `#D97706` (amber-600) |
| **Rejeitado** | Vermelho | `#DC2626` (red-600) |
| **Sem aprovação** | Cinza | `#6B7280` (gray-500) |

## Componentes Atualizados

### 1. **`components/ui/document-status-badge.tsx`** ⭐ (NOVO)
- Componente padronizado para badges de status
- Suporte a diferentes tamanhos (sm, md, lg)
- Lógica para mapear status antigos para novos
- Funções utilitárias para obter cores e labels

### 2. **`app/components/document-list.tsx`**
- Substituída implementação manual por `DocumentStatusBadge`
- Cores padronizadas aplicadas

### 3. **`app/components/document-preview-modal.tsx`**
- Atualizada para usar `DocumentStatusBadge`
- Removidas definições de cores antigas

### 4. **`app/page.tsx`** (Dashboard)
- Cores dos gráficos atualizadas
- Indicadores de status com cores padronizadas
- Estatísticas visuais harmonizadas

### 5. **`app/components/approval-details-modal.tsx`**
- Badges de aprovação com cores suaves
- Consistência visual mantida

## Como Usar

### Uso Básico
```tsx
import { DocumentStatusBadge } from "@/components/ui/document-status-badge"

// Badge simples
<DocumentStatusBadge status="approved" />

// Com informação de aprovação
<DocumentStatusBadge 
  status="draft" 
  approvalRequired={false} 
/>

// Tamanho personalizado
<DocumentStatusBadge 
  status="pending_approval" 
  size="lg" 
/>
```

### Funções Utilitárias
```tsx
import { 
  getStatusColorClasses, 
  getStatusLabel 
} from "@/components/ui/document-status-badge"

// Obter classes CSS
const classes = getStatusColorClasses("approved")

// Obter label do status
const label = getStatusLabel("draft", false) // "Sem aprovação"
```

### Para Novos Componentes
```tsx
// Use sempre o componente padronizado
<DocumentStatusBadge status={document.status} />

// Ao invés de implementação manual
<Badge className="bg-green-100 text-green-800">Aprovado</Badge>
```

## Benefícios Alcançados

1. **Consistência Visual**: Todas as badges seguem o mesmo padrão de cores
2. **Cores Mais Suaves**: Interface mais agradável e profissional
3. **Manutenibilidade**: Mudanças centralizadas no componente
4. **Acessibilidade**: Contraste adequado entre texto e fundo
5. **Flexibilidade**: Diferentes tamanhos e customizações
6. **Compatibilidade**: Mapeia status antigos automaticamente

## Mapeamento de Status

| Status Antigo | Status Novo | Condição |
|---------------|-------------|----------|
| `draft` | `no_approval` | Quando `approval_required = false` |
| `draft` | `draft` | Quando `approval_required = true` |
| `pending` | `pending_approval` | Sempre |
| `approved` | `approved` | Sempre |
| `rejected` | `rejected` | Sempre |

## Padrão Visual

As cores seguem o padrão da imagem fornecida:
- **Tons suaves**: Fundos claros (50) com textos escuros (700)
- **Bordas médias**: Bordas com tom intermediário (200)
- **Hover states**: Transições suaves para tons ligeiramente mais escuros
- **Consistência**: Mesmo padrão aplicado em toda a plataforma

## Próximos Passos

Para manter a consistência:
1. **Sempre use** `DocumentStatusBadge` para novos componentes
2. **Evite** implementações manuais de badges de status
3. **Teste** em modo claro e escuro
4. **Documente** novos status se necessário

A padronização está completa e pronta para uso em toda a plataforma!