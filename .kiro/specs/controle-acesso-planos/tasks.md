# Implementation Plan - Sistema de Controle de Acesso por Planos

## Fase 1: Atualização do Banco de Dados

- [ ] 1. Atualizar configuração dos planos no banco de dados
  - Executar SQL para atualizar funcionalidades do Plano Básico
  - Executar SQL para atualizar funcionalidades do Plano Profissional
  - Executar SQL para atualizar funcionalidades do Plano Enterprise
  - Verificar que todos os planos têm os limites corretos (15, 50, 70 usuários)
  - Verificar que todos os planos têm o armazenamento correto (10, 50, 120 GB)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2. Criar script de verificação dos planos
  - Criar função SQL que retorna configuração atual de cada plano
  - Validar que todas as funcionalidades estão configuradas corretamente
  - Gerar relatório de diferenças se houver
  - _Requirements: 10.1, 10.2, 10.4, 10.5_

## Fase 2: Hooks e Utilitários

- [ ] 3. Melhorar hook useFeatureAccess
  - [ ] 3.1 Adicionar campo `requiredPlan` no retorno
    - Implementar lógica para determinar qual plano é necessário para cada funcionalidade
    - Retornar 'profissional' para assinatura_eletronica_simples
    - Retornar 'enterprise' para funcionalidades exclusivas do Enterprise
    - _Requirements: 2.1, 2.4, 5.1_

  - [ ] 3.2 Melhorar mensagens de erro
    - Incluir nome da funcionalidade na mensagem
    - Incluir plano atual do usuário
    - Incluir plano necessário para acesso
    - _Requirements: 5.1, 5.2_

- [ ] 4. Estender hook useSubscription
  - [ ] 4.1 Adicionar método getRemainingUsers()
    - Calcular: plan.max_users - subscription.current_users
    - Retornar número de usuários que ainda podem ser criados
    - _Requirements: 3.5, 8.2_

  - [ ] 4.2 Adicionar método getRemainingStorage()
    - Calcular: plan.max_storage_gb - subscription.current_storage_gb
    - Retornar armazenamento disponível em GB
    - _Requirements: 4.5, 8.2_

  - [ ] 4.3 Adicionar método getUsagePercentage()
    - Calcular percentual de uso para usuários e armazenamento
    - Retornar valor entre 0-100
    - _Requirements: 4.3, 4.4, 7.2, 7.3_

- [ ] 5. Criar hook useLimitCheck
  - Criar novo hook para verificação de limites
  - Implementar verificação de limite de usuários
  - Implementar verificação de limite de armazenamento
  - Retornar: isWithinLimit, remaining, percentage, shouldAlert
  - _Requirements: 3.1, 3.2, 4.1, 4.2_

## Fase 3: Componentes de UI

- [ ] 6. Atualizar componente FeatureGate
  - [ ] 6.1 Melhorar mensagens de bloqueio
    - Exibir nome da funcionalidade bloqueada
    - Exibir plano atual do usuário
    - Exibir plano necessário para acesso
    - Incluir botão "Ver Planos"
    - Incluir texto "Contatar Administrador"
    - _Requirements: 2.1, 2.2, 2.4, 5.1, 5.3, 5.4_

  - [ ] 6.2 Adicionar suporte a mensagens customizadas
    - Permitir prop `customMessage` opcional
    - Usar mensagem customizada se fornecida
    - _Requirements: 5.1, 8.4_

- [ ] 7. Criar componente LimitGuard
  - Criar novo componente para verificar limites antes de ações
  - Aceitar props: userId, limitType, requiredAmount, children
  - Bloquear renderização se limite for excedido
  - Exibir mensagem apropriada quando bloqueado
  - _Requirements: 3.1, 3.2, 4.1, 4.2_

- [ ] 8. Criar componente LimitAlert
  - Criar componente para alertas preventivos
  - Exibir alerta amarelo em 80% de uso
  - Exibir alerta vermelho em 90% de uso
  - Mostrar valores: usado, total, restante, percentual
  - Incluir botões de ação apropriados
  - _Requirements: 3.5, 4.3, 4.4, 7.2, 7.3_

- [ ] 9. Criar componente UpgradeBanner
  - Criar banner para sugerir upgrade
  - Exibir quando limite é atingido
  - Mostrar benefícios do próximo plano
  - Incluir botão "Ver Planos"
  - _Requirements: 3.2, 4.2, 5.2_

## Fase 4: Validação Backend

- [ ] 10. Criar middleware validateFeatureAccess
  - [ ] 10.1 Implementar verificação de funcionalidade
    - Buscar subscription do usuário
    - Verificar se funcionalidade está habilitada no plano
    - Retornar erro 403 se não tiver acesso
    - Incluir informações detalhadas no erro
    - _Requirements: 9.1, 9.4_

  - [ ] 10.2 Aplicar middleware nas rotas de funcionalidades
    - Aplicar em rotas de assinatura eletrônica
    - Aplicar em rotas de chat
    - Aplicar em rotas de auditoria/logs
    - Aplicar em rotas de biblioteca pública
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 9.1_

- [ ] 11. Criar middleware validateStorageLimit
  - [ ] 11.1 Implementar verificação de armazenamento
    - Buscar uso atual de armazenamento
    - Calcular se novo arquivo cabe no limite
    - Retornar erro 403 se exceder limite
    - Incluir espaço disponível na mensagem de erro
    - _Requirements: 4.1, 4.2, 4.5, 9.2_

  - [ ] 11.2 Aplicar middleware nas rotas de upload
    - Aplicar em rota de upload de documentos
    - Aplicar em rota de upload de avatares
    - Aplicar em qualquer rota que aceite arquivos
    - _Requirements: 4.1, 4.5, 9.2_

- [ ] 12. Criar middleware validateUserLimit
  - Implementar verificação de limite de usuários
  - Buscar quantidade atual de usuários na entidade
  - Verificar se pode criar novo usuário
  - Retornar erro 403 se limite atingido
  - Incluir quantidade disponível na mensagem
  - _Requirements: 3.1, 3.2, 3.5, 9.3_

- [ ] 13. Implementar logging de tentativas bloqueadas
  - Criar função para logar tentativas de acesso não autorizado
  - Registrar: usuário, funcionalidade, plano, timestamp
  - Armazenar em tabela de audit_log
  - _Requirements: 9.5_

## Fase 5: Atualização de Uso em Tempo Real

- [ ] 14. Implementar atualização de current_users
  - [ ] 14.1 Criar função para incrementar contador
    - Criar função `incrementUserCount(entityId)`
    - Buscar subscription da entidade
    - Incrementar current_users
    - Verificar se atingiu limite
    - _Requirements: 6.1, 6.5_

  - [ ] 14.2 Criar função para decrementar contador
    - Criar função `decrementUserCount(entityId)`
    - Buscar subscription da entidade
    - Decrementar current_users
    - Garantir que não fique negativo
    - _Requirements: 6.2, 6.5_

  - [ ] 14.3 Integrar com criação de usuários
    - Chamar incrementUserCount após criar usuário
    - Chamar decrementUserCount após remover usuário
    - Atualizar em tempo real
    - _Requirements: 6.1, 6.2_

- [ ] 15. Implementar atualização de current_storage_gb
  - [ ] 15.1 Criar função para adicionar armazenamento
    - Criar função `addStorage(userId, sizeInBytes)`
    - Converter bytes para GB
    - Adicionar ao current_storage_gb
    - Verificar se atingiu limite
    - _Requirements: 6.3, 6.5_

  - [ ] 15.2 Criar função para remover armazenamento
    - Criar função `removeStorage(userId, sizeInBytes)`
    - Converter bytes para GB
    - Subtrair do current_storage_gb
    - Garantir que não fique negativo
    - _Requirements: 6.4, 6.5_

  - [ ] 15.3 Integrar com upload/exclusão de arquivos
    - Chamar addStorage após upload bem-sucedido
    - Chamar removeStorage após exclusão de arquivo
    - Atualizar em tempo real
    - _Requirements: 6.3, 6.4_

## Fase 6: Mensagens e Alertas

- [ ] 16. Criar sistema de mensagens padronizadas
  - Criar arquivo com templates de mensagens
  - Implementar função para gerar mensagem de funcionalidade bloqueada
  - Implementar função para gerar mensagem de limite atingido
  - Implementar função para gerar alertas preventivos
  - Incluir interpolação de variáveis (plano, valores, etc)
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 17. Implementar alertas preventivos
  - [ ] 17.1 Criar componente AlertBanner
    - Exibir banner no topo quando uso >= 80%
    - Estilo amarelo para 80-89%
    - Estilo vermelho para 90-99%
    - Mostrar valores e percentual
    - _Requirements: 4.3, 4.4, 7.2, 7.3_

  - [ ] 17.2 Integrar alertas no dashboard
    - Verificar percentual de uso ao carregar dashboard
    - Exibir AlertBanner se necessário
    - Permitir fechar alerta (mas reexibir em próximo acesso)
    - _Requirements: 3.5, 4.3, 4.4_

- [ ] 18. Adicionar toasts em pontos críticos
  - Toast ao tentar acessar funcionalidade bloqueada
  - Toast ao atingir limite de usuários
  - Toast ao atingir limite de armazenamento
  - Toast ao fazer upload que excede limite
  - Toast ao criar usuário que excede limite
  - _Requirements: 2.1, 2.2, 3.1, 3.2, 4.1, 4.2_

## Fase 7: Integração e Testes

- [ ] 19. Testar fluxo de funcionalidades bloqueadas
  - Testar acesso a assinatura eletrônica com Plano Básico (deve bloquear)
  - Testar acesso a chat com Plano Básico (deve bloquear)
  - Testar acesso a assinatura eletrônica com Plano Profissional (deve permitir)
  - Testar acesso a chat com Plano Enterprise (deve permitir)
  - Verificar mensagens exibidas
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 20. Testar fluxo de limite de usuários
  - Criar entidade com Plano Básico
  - Criar 15 usuários
  - Tentar criar 16º usuário (deve bloquear)
  - Verificar mensagem de limite atingido
  - Verificar alerta preventivo em 14 usuários (93%)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 21. Testar fluxo de limite de armazenamento
  - Fazer upload de arquivos até 8 GB (80%)
  - Verificar alerta amarelo
  - Fazer upload até 9 GB (90%)
  - Verificar alerta vermelho
  - Fazer upload até 10 GB
  - Tentar upload adicional (deve bloquear)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 22. Testar validação backend
  - Tentar acessar API de funcionalidade bloqueada
  - Verificar retorno 403 com mensagem correta
  - Tentar upload além do limite via API
  - Verificar retorno 403 com espaço disponível
  - Verificar logs de tentativas bloqueadas
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 23. Testar atualização de contadores
  - Criar usuário e verificar incremento de current_users
  - Remover usuário e verificar decremento de current_users
  - Fazer upload e verificar incremento de current_storage_gb
  - Excluir arquivo e verificar decremento de current_storage_gb
  - Verificar valores no banco de dados
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 24. Testar upgrade de plano
  - Criar usuário com Plano Básico
  - Verificar funcionalidades bloqueadas
  - Fazer upgrade para Profissional
  - Verificar funcionalidades liberadas
  - Verificar novos limites aplicados
  - _Requirements: 2.3, 2.4, 2.5_

- [ ] 25. Checkpoint - Garantir que todos os testes passam
  - Executar todos os testes
  - Corrigir bugs encontrados
  - Validar com usuário se necessário

## Fase 8: Documentação e Finalização

- [ ] 26. Atualizar documentação
  - Atualizar CONTROLE_ACESSO_PLANOS.md com novos componentes
  - Documentar novos hooks e métodos
  - Adicionar exemplos de uso de LimitGuard e LimitAlert
  - Documentar códigos de erro do backend
  - Criar guia de troubleshooting
  - _Requirements: Todos_

- [ ] 27. Criar guia de mensagens de erro
  - Listar todos os códigos de erro
  - Documentar quando cada erro ocorre
  - Explicar como resolver cada erro
  - Incluir screenshots das mensagens
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 28. Validação final com super admin
  - Demonstrar painel com estatísticas
  - Demonstrar alertas de limite
  - Demonstrar bloqueio de funcionalidades
  - Coletar feedback
  - Fazer ajustes finais se necessário
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
