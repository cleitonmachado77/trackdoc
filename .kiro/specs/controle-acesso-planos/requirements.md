# Requirements Document - Sistema de Controle de Acesso por Planos

## Introduction

Sistema completo de controle de acesso baseado em planos de assinatura, com verificação de funcionalidades e limites de uso (usuários e armazenamento). O sistema deve bloquear automaticamente funcionalidades não disponíveis no plano do usuário e alertar quando limites forem atingidos.

## Glossary

- **Sistema**: TrackDoc - Sistema de gerenciamento de documentos
- **Usuário**: Pessoa autenticada no sistema com um plano ativo
- **Plano**: Conjunto de funcionalidades e limites (Básico, Profissional, Enterprise)
- **Subscription**: Assinatura ativa de um usuário vinculada a um plano
- **Funcionalidade**: Recurso específico do sistema (ex: chat, assinatura eletrônica)
- **Limite**: Restrição quantitativa (ex: máximo de usuários, armazenamento)
- **Entidade**: Empresa/organização à qual o usuário pertence
- **FeatureGate**: Componente que bloqueia acesso a funcionalidades

## Requirements

### Requirement 1: Configuração dos Planos

**User Story:** Como administrador do sistema, quero que os três planos estejam corretamente configurados no banco de dados, para que as regras de acesso sejam aplicadas automaticamente.

#### Acceptance Criteria

1. WHEN o sistema é inicializado THEN o Plano Básico SHALL ter 15 usuários, 10 GB de armazenamento e funcionalidades: dashboard_gerencial, upload_documentos, solicitacao_aprovacoes, suporte_email, biblioteca_publica habilitadas
2. WHEN o sistema é inicializado THEN o Plano Básico SHALL ter funcionalidades: assinatura_eletronica_simples, assinatura_eletronica_multipla, chat_nativo, auditoria_completa, backup_automatico_diario, suporte_tecnico_dedicado desabilitadas
3. WHEN o sistema é inicializado THEN o Plano Profissional SHALL ter 50 usuários, 50 GB de armazenamento e funcionalidades: dashboard_gerencial, upload_documentos, solicitacao_aprovacoes, suporte_email, biblioteca_publica, assinatura_eletronica_simples habilitadas
4. WHEN o sistema é inicializado THEN o Plano Profissional SHALL ter funcionalidades: assinatura_eletronica_multipla, chat_nativo, auditoria_completa, backup_automatico_diario, suporte_tecnico_dedicado desabilitadas
5. WHEN o sistema é inicializado THEN o Plano Enterprise SHALL ter 70 usuários, 120 GB de armazenamento e todas as funcionalidades habilitadas

### Requirement 2: Verificação de Funcionalidades

**User Story:** Como usuário do sistema, quero que apenas funcionalidades disponíveis no meu plano sejam acessíveis, para que eu saiba claramente o que posso utilizar.

#### Acceptance Criteria

1. WHEN um usuário com Plano Básico tenta acessar assinatura eletrônica simples THEN o Sistema SHALL bloquear o acesso e exibir mensagem informando que a funcionalidade não está disponível no plano atual
2. WHEN um usuário com Plano Básico tenta acessar chat nativo THEN o Sistema SHALL bloquear o acesso e exibir mensagem informando que a funcionalidade não está disponível no plano atual
3. WHEN um usuário com Plano Profissional tenta acessar assinatura eletrônica simples THEN o Sistema SHALL permitir o acesso
4. WHEN um usuário com Plano Profissional tenta acessar assinatura eletrônica múltipla THEN o Sistema SHALL bloquear o acesso e exibir mensagem informando que a funcionalidade requer upgrade para Enterprise
5. WHEN um usuário com Plano Enterprise tenta acessar qualquer funcionalidade THEN o Sistema SHALL permitir o acesso
6. WHEN um usuário sem plano ativo tenta acessar qualquer funcionalidade THEN o Sistema SHALL bloquear o acesso e exibir mensagem informando que é necessário um plano ativo

### Requirement 3: Controle de Limite de Usuários

**User Story:** Como administrador de entidade, quero que o sistema impeça a criação de novos usuários quando o limite do plano for atingido, para que eu saiba quando preciso fazer upgrade.

#### Acceptance Criteria

1. WHEN uma entidade com Plano Básico tem 15 usuários cadastrados THEN o Sistema SHALL bloquear a criação de novos usuários
2. WHEN uma entidade com Plano Básico tem 15 usuários cadastrados THEN o Sistema SHALL exibir mensagem informando que o limite de usuários foi atingido e sugerindo upgrade
3. WHEN uma entidade com Plano Profissional tem 50 usuários cadastrados THEN o Sistema SHALL bloquear a criação de novos usuários
4. WHEN uma entidade com Plano Enterprise tem 70 usuários cadastrados THEN o Sistema SHALL bloquear a criação de novos usuários
5. WHEN uma entidade está próxima do limite (90% ou mais) THEN o Sistema SHALL exibir alerta preventivo informando quantos usuários ainda podem ser criados

### Requirement 4: Controle de Limite de Armazenamento

**User Story:** Como usuário do sistema, quero ser alertado quando o armazenamento estiver próximo do limite, para que eu possa gerenciar meus arquivos ou solicitar upgrade.

#### Acceptance Criteria

1. WHEN um usuário com Plano Básico atinge 10 GB de armazenamento THEN o Sistema SHALL bloquear novos uploads
2. WHEN um usuário com Plano Básico atinge 10 GB de armazenamento THEN o Sistema SHALL exibir mensagem informando que o limite foi atingido e sugerindo upgrade ou exclusão de arquivos
3. WHEN um usuário atinge 80% do limite de armazenamento THEN o Sistema SHALL exibir alerta informando o percentual usado e espaço restante
4. WHEN um usuário atinge 90% do limite de armazenamento THEN o Sistema SHALL exibir alerta crítico informando que o limite está próximo
5. WHEN um usuário tenta fazer upload que excederia o limite THEN o Sistema SHALL bloquear o upload e exibir mensagem com o tamanho disponível

### Requirement 5: Mensagens de Bloqueio

**User Story:** Como usuário do sistema, quero receber mensagens claras quando uma funcionalidade estiver bloqueada, para que eu entenda o motivo e saiba como proceder.

#### Acceptance Criteria

1. WHEN uma funcionalidade é bloqueada por plano THEN o Sistema SHALL exibir mensagem contendo: nome da funcionalidade, plano atual do usuário, plano necessário para acesso
2. WHEN um limite é atingido THEN o Sistema SHALL exibir mensagem contendo: tipo de limite (usuários/armazenamento), valor atual, valor máximo, sugestão de ação
3. WHEN uma mensagem de bloqueio é exibida THEN o Sistema SHALL incluir link para página de planos
4. WHEN uma mensagem de bloqueio é exibida THEN o Sistema SHALL incluir orientação para contatar administrador
5. WHEN um usuário sem plano tenta acessar o sistema THEN o Sistema SHALL exibir mensagem informando que é necessário contatar o administrador para ativação de plano

### Requirement 6: Atualização de Uso em Tempo Real

**User Story:** Como sistema, quero atualizar automaticamente os contadores de uso, para que os limites sejam verificados com precisão.

#### Acceptance Criteria

1. WHEN um novo usuário é criado na entidade THEN o Sistema SHALL incrementar o contador current_users da subscription
2. WHEN um usuário é removido da entidade THEN o Sistema SHALL decrementar o contador current_users da subscription
3. WHEN um arquivo é enviado THEN o Sistema SHALL adicionar o tamanho do arquivo ao contador current_storage_gb da subscription
4. WHEN um arquivo é excluído THEN o Sistema SHALL subtrair o tamanho do arquivo do contador current_storage_gb da subscription
5. WHEN os contadores são atualizados THEN o Sistema SHALL verificar se os limites foram atingidos e atualizar o status de bloqueio

### Requirement 7: Painel de Administração

**User Story:** Como super administrador, quero visualizar o uso de cada usuário no painel, para que eu possa monitorar e tomar ações preventivas.

#### Acceptance Criteria

1. WHEN o super admin acessa o painel THEN o Sistema SHALL exibir para cada usuário: quantidade de documentos, armazenamento usado, percentual do limite
2. WHEN um usuário ultrapassa 80% de qualquer limite THEN o Sistema SHALL exibir badge de alerta amarelo no painel
3. WHEN um usuário atinge 100% de qualquer limite THEN o Sistema SHALL exibir badge de alerta vermelho no painel
4. WHEN o super admin visualiza estatísticas THEN o Sistema SHALL calcular valores em tempo real do banco de dados
5. WHEN o super admin filtra por plano THEN o Sistema SHALL incluir opção "Sem plano" e exibir usuários sem subscription ativa

### Requirement 8: Hooks de Verificação

**User Story:** Como desenvolvedor, quero hooks reutilizáveis para verificar acesso, para que a implementação seja consistente em todo o sistema.

#### Acceptance Criteria

1. WHEN useFeatureAccess é chamado com uma funcionalidade THEN o Sistema SHALL retornar: hasAccess (boolean), loading (boolean), reason (string), showUpgradePrompt (boolean)
2. WHEN useSubscription é chamado THEN o Sistema SHALL retornar: subscription, loading, error, hasFeature, isWithinLimit, current usage
3. WHEN FeatureGate envolve um componente THEN o Sistema SHALL renderizar o componente apenas se o usuário tiver acesso
4. WHEN FeatureGate bloqueia acesso THEN o Sistema SHALL exibir mensagem customizável ou fallback component
5. WHEN hooks são chamados THEN o Sistema SHALL fazer cache dos dados para evitar múltiplas consultas ao banco

### Requirement 9: Validação no Backend

**User Story:** Como sistema, quero validar permissões no backend, para garantir segurança mesmo se o frontend for manipulado.

#### Acceptance Criteria

1. WHEN uma API de funcionalidade restrita é chamada THEN o Sistema SHALL verificar se o usuário tem acesso antes de processar
2. WHEN uma API de upload é chamada THEN o Sistema SHALL verificar se há espaço disponível antes de aceitar o arquivo
3. WHEN uma API de criação de usuário é chamada THEN o Sistema SHALL verificar se o limite de usuários não foi atingido
4. WHEN validação falha no backend THEN o Sistema SHALL retornar erro HTTP 403 com mensagem descritiva
5. WHEN validação falha no backend THEN o Sistema SHALL logar a tentativa de acesso não autorizado

### Requirement 10: Migração e Atualização de Dados

**User Story:** Como administrador do sistema, quero garantir que os dados dos planos estejam corretos no banco, para que as regras sejam aplicadas adequadamente.

#### Acceptance Criteria

1. WHEN a migração é executada THEN o Sistema SHALL atualizar a tabela plans com as funcionalidades corretas de cada plano
2. WHEN a migração é executada THEN o Sistema SHALL atualizar os limites (max_users, max_storage_gb) de cada plano
3. WHEN a migração é executada THEN o Sistema SHALL preservar subscriptions existentes
4. WHEN a migração é executada THEN o Sistema SHALL validar que todos os campos obrigatórios estão preenchidos
5. WHEN a migração é concluída THEN o Sistema SHALL retornar relatório de sucesso com quantidade de registros atualizados
