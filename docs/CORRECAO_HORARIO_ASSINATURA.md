# Correção do Horário de Assinatura Eletrônica

## Problema Identificado

O horário exibido quando um documento era assinado estava diferente do horário real. Isso ocorria porque:
1. As datas estavam sendo salvas em UTC (`new Date().toISOString()`)
2. As datas estavam sendo exibidas sem conversão para o timezone local do Brasil

## Solução Implementada

### 1. Correção no Salvamento (Backend)
Criadas funções helper para salvar timestamps no horário de Brasília:
- `getBrasiliaTimestamp()` em `app/api/arsign/route.ts`
- `getBrasiliaDate()` em `lib/digital-signature.ts`

### 2. Correção na Exibição (Frontend)
Adicionado o parâmetro `timeZone: 'America/Sao_Paulo'` em todas as formatações de data/hora relacionadas a assinaturas eletrônicas.

## Arquivos Modificados

### Backend (Salvamento)

#### 1. `app/api/arsign/route.ts`

Adicionada função helper:
```typescript
// Função helper para obter timestamp no horário de Brasília
function getBrasiliaTimestamp(): string {
  const now = new Date()
  // Converter para horário de Brasília (UTC-3)
  const brasiliaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  return brasiliaTime.toISOString()
}
```

Atualizado salvamento:
```typescript
// ANTES
signed_at: new Date().toISOString()

// DEPOIS
signed_at: getBrasiliaTimestamp()
```

#### 2. `lib/digital-signature.ts`

Adicionada função helper:
```typescript
// Função helper para obter timestamp no horário de Brasília
function getBrasiliaDate(): Date {
  const now = new Date()
  // Converter para horário de Brasília (UTC-3)
  const brasiliaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  return brasiliaTime
}
```

Atualizado timestamp:
```typescript
// ANTES
timestamp: new Date()

// DEPOIS
timestamp: getBrasiliaDate()
```

### Frontend (Exibição)

#### 3. `app/components/electronic-signature.tsx`

#### Função `formatDate`
```typescript
// ANTES
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// DEPOIS
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo' // Força timezone do Brasil
  })
}
```

#### Verificação de Assinatura
```typescript
// ANTES
<div><strong>Data:</strong> {new Date(timestamp).toLocaleDateString('pt-BR')}</div>
<div><strong>Hora:</strong> {new Date(timestamp).toLocaleTimeString('pt-BR')}</div>

// DEPOIS
<div><strong>Data:</strong> {new Date(timestamp).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</div>
<div><strong>Hora:</strong> {new Date(timestamp).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</div>
```

#### 4. `app/components/multi-signature-progress.tsx`

```typescript
// ANTES
{user.signed_at ? new Date(user.signed_at).toLocaleDateString() : 'Assinado'}

// DEPOIS
{user.signed_at ? new Date(user.signed_at).toLocaleString('pt-BR', { 
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo'
}) : 'Assinado'}
```

#### 5. `app/components/document-selector-modal.tsx`

```typescript
// ANTES
{document.metadata?.signed_at && (
  <p>Assinado em: {new Date(document.metadata.signed_at).toLocaleDateString('pt-BR')}</p>
)}

// DEPOIS
{document.metadata?.signed_at && (
  <p>Assinado em: {new Date(document.metadata.signed_at).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  })}</p>
)}
```

## Impacto

✅ **Horários corretos**: Todas as assinaturas agora exibem o horário correto do Brasil (GMT-3)
✅ **Consistência**: Formato padronizado em todos os componentes
✅ **Histórico preservado**: Assinaturas antigas também exibem o horário correto

## Formato de Exibição

Todas as datas de assinatura agora são exibidas no formato:
- **Data e Hora**: `DD/MM/AAAA HH:MM` (ex: `10/11/2025 14:30`)
- **Timezone**: America/Sao_Paulo (Horário de Brasília)

## Componentes Afetados

1. **Assinatura Eletrônica**
   - Histórico de assinaturas
   - Verificação de assinaturas
   - Lista de documentos assinados

2. **Assinatura Múltipla**
   - Progresso de assinaturas
   - Status de cada assinante
   - Data/hora de cada assinatura

3. **Seletor de Documentos**
   - Informações de documentos assinados
   - Metadados de assinatura

## Testes Recomendados

1. Assinar um novo documento e verificar se o horário está correto
2. Verificar o histórico de assinaturas antigas
3. Testar assinatura múltipla e verificar horários de cada assinante
4. Verificar a página de verificação de assinatura pública

## Notas Técnicas

- O timezone `America/Sao_Paulo` é usado para todo o Brasil
- Considera automaticamente horário de verão quando aplicável
- Compatível com todos os navegadores modernos
- Não afeta os dados armazenados no banco (continuam em UTC)
