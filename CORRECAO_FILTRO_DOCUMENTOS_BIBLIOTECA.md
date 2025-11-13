# Correção: Filtro de Documentos na Biblioteca Pública

## Problema Identificado

Na página de Biblioteca Pública, ao tentar adicionar novos documentos, poucos documentos estavam aparecendo na lista de seleção, mesmo havendo muitos documentos cadastrados na página de Documentos.

## Causa Raiz

O código estava filtrando apenas documentos com `status = "approved"`:

```typescript
.eq("status", "approved")
```

Isso excluía todos os documentos em outros status como:
- `draft` (rascunho)
- `pending_approval` (pendente de aprovação)
- Outros status válidos

## Solução Implementada

### 1. Alteração no Filtro de Status

Modificado o filtro para incluir múltiplos status:

```typescript
.in("status", ["approved", "draft", "pending_approval"])
```

Agora a lista mostra documentos em três estados:
- ✅ **Aprovados**: Documentos já aprovados
- 📝 **Rascunho**: Documentos em elaboração
- ⏳ **Pendente**: Documentos aguardando aprovação

### 2. Indicadores Visuais de Status

Adicionado badges coloridos para identificar o status de cada documento:

- 🟢 **Aprovado**: Verde
- ⚪ **Rascunho**: Cinza
- 🟡 **Pendente**: Amarelo
- 🔴 **Rejeitado**: Vermelho (se aparecer)
- 🔵 **Arquivado**: Azul (se aparecer)

### 3. Remoção de Logs de Debug

Removidos os logs de debug desnecessários que estavam poluindo o console.

## Arquivo Modificado

- `app/biblioteca/page.tsx`

## Benefícios

1. **Maior Visibilidade**: Todos os documentos relevantes agora aparecem na lista
2. **Melhor UX**: Usuários podem ver o status de cada documento antes de adicionar
3. **Flexibilidade**: Permite adicionar documentos em diferentes estágios do fluxo
4. **Transparência**: Status visual claro de cada documento

## Teste Recomendado

1. Acesse a página "Biblioteca Pública"
2. Clique em "Adicionar Documentos"
3. Verifique se todos os documentos da sua entidade aparecem
4. Observe os badges de status ao lado de cada título
5. Selecione e adicione documentos à biblioteca

## Observações

- Documentos já adicionados à biblioteca continuam marcados como "Já na biblioteca" e desabilitados
- O filtro por título continua funcionando normalmente
- A categorização opcional permanece disponível
