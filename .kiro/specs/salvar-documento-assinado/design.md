# Design Document

## Overview

Esta funcionalidade adiciona a capacidade de salvar automaticamente documentos assinados eletronicamente na página de Documentos do sistema. A implementação será feita através de um checkbox simples que não altera o fluxo existente de assinatura eletrônica.

## Architecture

### Componentes Afetados

1. **ElectronicSignature Component** (`app/components/electronic-signature.tsx`)
   - Adicionar checkbox "Salvar após Assinado"
   - Gerenciar estado da opção de salvamento
   - Implementar lógica de salvamento após assinatura concluída

2. **useDocuments Hook** (`hooks/use-documents.ts`)
   - Utilizar função `createDocument` existente
   - Adicionar suporte para criação via assinatura eletrônica

3. **Database** (Supabase)
   - Utilizar tabela `documents` existente
   - Adicionar campo opcional para referenciar assinatura eletrônica (se necessário)

### Fluxo de Dados

```
1. Usuário marca checkbox "Salvar após Assinado"
   ↓
2. Estado local armazena preferência
   ↓
3. Processo de assinatura ocorre normalmente
   ↓
4. Ao concluir assinatura com sucesso:
   ↓
5. Sistema verifica se opção está marcada
   ↓
6. Se SIM: Cria documento automaticamente
   ↓
7. Exibe notificação de sucesso/erro
```

## Components and Interfaces

### 1. Estado do Componente ElectronicSignature

```typescript
interface SignatureState {
  // Estados existentes...
  saveAfterSigned: boolean  // Nova propriedade
  isSavingDocument: boolean // Indicador de salvamento
}
```

### 2. Função de Salvamento

```typescript
const saveSignedDocument = async (
  signatureId: string,
  fileName: string,
  filePath: string
) => {
  try {
    setIsSavingDocument(true)
    
    const documentData = {
      title: fileName,
      description: "Documento criado via assinatura eletrônica",
      file_path: filePath,
      file_name: fileName,
      file_type: "application/pdf",
      status: "approved",
      // Outros campos necessários
    }
    
    await createDocument(documentData)
    
    toast({
      title: "Documento salvo",
      description: `O documento "${fileName}" foi salvo com sucesso.`
    })
  } catch (error) {
    toast({
      title: "Erro ao salvar documento",
      description: error.message,
      variant: "destructive"
    })
  } finally {
    setIsSavingDocument(false)
  }
}
```

### 3. UI do Checkbox

```tsx
<div className="flex items-center space-x-2">
  <Checkbox
    id="saveAfterSigned"
    checked={saveAfterSigned}
    onCheckedChange={(checked) => setSaveAfterSigned(checked as boolean)}
  />
  <Label htmlFor="saveAfterSigned" className="text-sm font-medium">
    Salvar após Assinado
  </Label>
</div>
```

## Data Models

### Documento Criado Automaticamente

```typescript
{
  title: string              // Nome do arquivo original
  description: string        // "Documento criado via assinatura eletrônica"
  file_path: string         // Caminho do PDF assinado
  file_name: string         // Nome do arquivo
  file_type: string         // "application/pdf"
  file_size: number         // Tamanho do arquivo
  status: "approved"        // Status aprovado por padrão
  author_id: string         // ID do usuário que criou a assinatura
  entity_id: string         // ID da entidade do usuário
  department_id?: string    // Departamento do usuário (opcional)
  created_at: timestamp     // Data da assinatura
  signature_id?: string     // Referência à assinatura (opcional)
}
```

## Error Handling

### Cenários de Erro

1. **Erro ao criar documento**
   - Exibir toast com mensagem de erro
   - Manter arquivo assinado disponível para download
   - Não bloquear o fluxo de assinatura

2. **Erro ao fazer upload do arquivo**
   - Exibir mensagem específica sobre falha no upload
   - Sugerir tentativa manual

3. **Usuário sem permissão**
   - Verificar permissões antes de tentar salvar
   - Exibir mensagem apropriada

### Tratamento de Erros

```typescript
try {
  // Tentativa de salvamento
} catch (error) {
  console.error("Erro ao salvar documento assinado:", error)
  
  toast({
    title: "Erro ao salvar documento",
    description: "O documento foi assinado com sucesso, mas não foi possível salvá-lo automaticamente. Você pode fazer o download e upload manual.",
    variant: "destructive"
  })
  
  // Não bloquear o fluxo - usuário pode continuar
}
```

## Testing Strategy

### Testes Unitários

1. **Checkbox de salvamento**
   - Verificar renderização do checkbox
   - Testar mudança de estado ao marcar/desmarcar
   - Validar que estado é mantido durante o processo

2. **Função de salvamento**
   - Testar criação de documento com dados corretos
   - Verificar tratamento de erros
   - Validar notificações exibidas

### Testes de Integração

1. **Fluxo completo de assinatura simples**
   - Marcar checkbox
   - Completar assinatura
   - Verificar documento criado na página Documentos

2. **Fluxo completo de assinatura múltipla**
   - Marcar checkbox
   - Completar todas as assinaturas
   - Verificar documento criado após última assinatura

3. **Fluxo sem salvamento**
   - Não marcar checkbox
   - Completar assinatura
   - Verificar que documento NÃO foi criado

### Testes de UI

1. **Posicionamento do checkbox**
   - Verificar visibilidade em diferentes resoluções
   - Testar acessibilidade (keyboard navigation)

2. **Feedback visual**
   - Verificar loading state durante salvamento
   - Testar exibição de notificações

## Implementation Notes

### Ordem de Implementação

1. Adicionar estado `saveAfterSigned` ao componente
2. Implementar UI do checkbox
3. Criar função `saveSignedDocument`
4. Integrar com callback de conclusão de assinatura
5. Adicionar tratamento de erros
6. Implementar notificações
7. Testar fluxos completos

### Considerações Técnicas

- Utilizar hook `useDocuments` existente para criar documento
- Reutilizar lógica de upload de arquivos existente
- Manter compatibilidade com fluxo atual
- Não bloquear processo de assinatura em caso de erro no salvamento
- Garantir que arquivo assinado sempre fique disponível para download

### Pontos de Atenção

- Verificar permissões do usuário antes de salvar
- Garantir que entity_id está disponível
- Validar que arquivo PDF assinado está acessível
- Considerar limite de tamanho de arquivo
- Tratar casos onde usuário não tem departamento associado
