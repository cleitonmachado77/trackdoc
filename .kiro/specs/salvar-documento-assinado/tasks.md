# Implementation Plan

- [x] 1. Adicionar estado e UI do checkbox "Salvar após Assinado"


  - Adicionar estado `saveAfterSigned` no componente ElectronicSignature
  - Adicionar estado `isSavingDocument` para indicador de carregamento
  - Implementar checkbox na UI com label "Salvar após Assinado"
  - Posicionar checkbox em local visível nas seções de assinatura simples e múltipla
  - _Requirements: 1.1, 1.2, 1.3_



- [ ] 2. Implementar função de salvamento automático de documento
  - Criar função `saveSignedDocument` que recebe dados da assinatura
  - Utilizar hook `useDocuments` para criar documento
  - Preparar objeto com dados do documento (título, descrição, arquivo, status)
  - Definir status como "approved" por padrão


  - Adicionar descrição "Documento criado via assinatura eletrônica"
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 3. Integrar salvamento com conclusão de assinatura
  - Identificar callback/função executada após assinatura concluída
  - Adicionar verificação do estado `saveAfterSigned`


  - Chamar `saveSignedDocument` se opção estiver marcada
  - Passar dados necessários (arquivo PDF, nome, caminho)
  - Garantir que não bloqueia fluxo de assinatura
  - _Requirements: 2.1, 2.2_

- [ ] 4. Implementar tratamento de erros e notificações
  - Adicionar try-catch na função de salvamento
  - Implementar notificação de sucesso com nome do documento
  - Implementar notificação de erro com mensagem descritiva
  - Adicionar loading state durante salvamento
  - Garantir que arquivo assinado permanece disponível em caso de erro
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 5. Testar fluxo completo de assinatura simples
  - Testar assinatura com checkbox marcado
  - Verificar criação de documento na página Documentos
  - Validar dados do documento criado
  - Testar assinatura com checkbox desmarcado
  - Verificar que documento NÃO é criado quando desmarcado
  - _Requirements: 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 6. Testar fluxo completo de assinatura múltipla
  - Testar assinatura múltipla com checkbox marcado
  - Verificar que documento é criado apenas após última assinatura
  - Validar dados do documento criado
  - Testar com checkbox desmarcado
  - Verificar comportamento correto em cada cenário
  - _Requirements: 1.2, 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 7. Validar tratamento de erros e edge cases
  - Testar erro ao criar documento (permissões, rede, etc)
  - Verificar exibição de notificações de erro
  - Testar com usuário sem entity_id
  - Testar com arquivo muito grande
  - Validar que fluxo de assinatura não é bloqueado por erros
  - _Requirements: 3.1, 3.2, 3.3, 3.5_
