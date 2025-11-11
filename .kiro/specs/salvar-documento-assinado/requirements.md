# Requirements Document

## Introduction

Este documento define os requisitos para implementar a funcionalidade de salvar automaticamente documentos assinados eletronicamente na página de Documentos do sistema Trackdoc. A funcionalidade será uma opção simples via checkbox que não altera o fluxo atual de assinatura.

## Glossary

- **Sistema**: Plataforma Trackdoc de gestão de documentos
- **Usuário**: Pessoa autenticada que utiliza o sistema
- **Documento Assinado**: Arquivo PDF que passou pelo processo de assinatura eletrônica
- **Assinatura Simples**: Processo de assinatura com um único signatário
- **Assinatura Múltipla**: Processo de assinatura com múltiplos signatários
- **Página de Documentos**: Seção do sistema onde documentos são listados e gerenciados
- **Página de Assinatura Eletrônica**: Seção do sistema onde assinaturas são criadas e gerenciadas

## Requirements

### Requirement 1

**User Story:** Como usuário do sistema, eu quero ter a opção de salvar automaticamente um documento após ele ser assinado, para que o documento assinado fique disponível na página Documentos sem necessidade de upload manual.

#### Acceptance Criteria

1. WHEN o Usuário acessa a página de Assinatura Simples, THE Sistema SHALL exibir um checkbox com a opção "Salvar após Assinado"
2. WHEN o Usuário acessa a página de Assinatura Múltipla, THE Sistema SHALL exibir um checkbox com a opção "Salvar após Assinado"
3. WHEN o Usuário marca ou desmarca o checkbox, THE Sistema SHALL armazenar essa preferência para o processo de assinatura atual
4. WHEN o checkbox está desmarcado, THE Sistema SHALL manter o fluxo atual de assinatura sem alterações
5. WHEN o checkbox está marcado, THE Sistema SHALL preparar o salvamento automático após conclusão das assinaturas

### Requirement 2

**User Story:** Como usuário, eu quero que o documento seja salvo automaticamente na página Documentos após a assinatura ser concluída, para que eu possa acessá-lo facilmente no sistema.

#### Acceptance Criteria

1. WHEN a assinatura é concluída com sucesso, THE Sistema SHALL verificar se a opção "Salvar após Assinado" foi marcada
2. IF a opção "Salvar após Assinado" foi marcada, THEN THE Sistema SHALL criar automaticamente um novo documento na Página de Documentos
3. WHEN o documento é criado, THE Sistema SHALL utilizar o nome do arquivo original como título do documento
4. WHEN o documento é criado, THE Sistema SHALL anexar o arquivo PDF assinado ao documento
5. WHEN o documento é criado, THE Sistema SHALL definir o status como "approved" (aprovado)

### Requirement 3

**User Story:** Como usuário, eu quero receber feedback sobre o salvamento do documento, para saber se o processo foi concluído com sucesso.

#### Acceptance Criteria

1. WHEN o documento está sendo salvo, THE Sistema SHALL exibir um indicador de carregamento
2. WHEN o documento é salvo com sucesso, THE Sistema SHALL exibir uma notificação de sucesso
3. IF ocorrer um erro ao salvar, THEN THE Sistema SHALL exibir uma mensagem de erro
4. WHEN o documento é salvo com sucesso, THE Sistema SHALL incluir na notificação o nome do documento criado
5. IF ocorrer um erro ao salvar, THEN THE Sistema SHALL manter o arquivo assinado disponível para download manual

### Requirement 4

**User Story:** Como usuário, eu quero que o documento salvo automaticamente mantenha informações básicas da assinatura, para rastreabilidade.

#### Acceptance Criteria

1. WHEN o documento é criado automaticamente, THE Sistema SHALL adicionar na descrição a informação "Documento criado via assinatura eletrônica"
2. WHEN o documento é criado automaticamente, THE Sistema SHALL armazenar a data de criação como a data da assinatura
3. WHEN o documento é criado automaticamente, THE Sistema SHALL vincular o documento ao usuário que iniciou a assinatura
4. WHEN o documento é criado automaticamente, THE Sistema SHALL utilizar o tipo de arquivo PDF
5. WHEN o documento é criado automaticamente, THE Sistema SHALL definir o autor como o usuário atual
