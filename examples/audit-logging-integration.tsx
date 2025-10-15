// Exemplo de como integrar o sistema de logs de auditoria em componentes

import { useAuditLogger } from '@/hooks/use-audit-logger'

// Exemplo 1: Componente de Upload de Documentos
function DocumentUpload() {
  const { logFileUpload, logDocumentAction } = useAuditLogger()

  const handleFileUpload = async (file: File, documentId: string, documentTitle: string) => {
    try {
      // ... lógica de upload ...
      
      // Registrar log do upload
      logFileUpload(file.name, file.size, documentId, documentTitle)
      
    } catch (error) {
      // Registrar log de erro
      logDocumentAction('Erro no upload', documentId, documentTitle, 'error')
    }
  }

  return (
    // ... JSX do componente ...
    <div>Upload Component</div>
  )
}

// Exemplo 2: Componente de Aprovação de Documentos
function DocumentApproval() {
  const { logApprovalAction } = useAuditLogger()

  const handleApproval = async (approvalId: string, documentTitle: string, approved: boolean, comments?: string) => {
    try {
      // ... lógica de aprovação ...
      
      // Registrar log da aprovação
      logApprovalAction(
        approved ? 'Documento aprovado' : 'Documento rejeitado',
        approvalId,
        documentTitle,
        approved,
        comments
      )
      
    } catch (error) {
      console.error('Erro na aprovação:', error)
    }
  }

  return (
    // ... JSX do componente ...
    <div>Approval Component</div>
  )
}

// Exemplo 3: Componente de Assinatura Digital
function DigitalSignature() {
  const { logSignatureAction } = useAuditLogger()

  const handleSignature = async (signatureId: string, documentTitle: string) => {
    try {
      // ... lógica de assinatura ...
      
      // Registrar log da assinatura
      logSignatureAction('Assinatura digital realizada', signatureId, documentTitle, 'completed')
      
    } catch (error) {
      // Registrar log de erro na assinatura
      logSignatureAction('Erro na assinatura digital', signatureId, documentTitle, 'failed')
    }
  }

  return (
    // ... JSX do componente ...
    <div>Signature Component</div>
  )
}

// Exemplo 4: Componente de Gerenciamento de Usuários
function UserManagement() {
  const { logUserAction } = useAuditLogger()

  const handleCreateUser = async (userData: any) => {
    try {
      // ... lógica de criação de usuário ...
      
      // Registrar log de criação de usuário
      logUserAction('Usuário criado', userData.id, userData.email, {
        full_name: userData.full_name,
        role: userData.role
      })
      
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
    }
  }

  const handleUpdateUserStatus = async (userId: string, userEmail: string, newStatus: string) => {
    try {
      // ... lógica de atualização de status ...
      
      // Registrar log de alteração de status
      logUserAction('Status do usuário alterado', userId, userEmail, {
        new_status: newStatus
      })
      
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  return (
    // ... JSX do componente ...
    <div>User Management Component</div>
  )
}

// Exemplo 5: Componente de Configurações
function EntitySettings() {
  const { logConfigurationChange, logEntityUpdate } = useAuditLogger()

  const handleSettingsUpdate = async (entityId: string, entityName: string, changes: any) => {
    try {
      // ... lógica de atualização de configurações ...
      
      // Registrar log de alteração de configurações
      logEntityUpdate(entityName, entityId, changes)
      
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error)
    }
  }

  const handleSpecificConfigChange = async (configType: string, configId: string, changes: any) => {
    try {
      // ... lógica de alteração específica ...
      
      // Registrar log de configuração específica
      logConfigurationChange(configType, configId, changes)
      
    } catch (error) {
      console.error('Erro ao alterar configuração:', error)
    }
  }

  return (
    // ... JSX do componente ...
    <div>Settings Component</div>
  )
}

// Exemplo 6: Componente de Notificações
function NotificationSystem() {
  const { logNotificationSent } = useAuditLogger()

  const sendNotification = async (title: string, notificationId: string, recipients: string[], type: string) => {
    try {
      // ... lógica de envio de notificação ...
      
      // Registrar log de notificação enviada
      logNotificationSent(title, notificationId, recipients.length, type)
      
    } catch (error) {
      console.error('Erro ao enviar notificação:', error)
    }
  }

  return (
    // ... JSX do componente ...
    <div>Notification Component</div>
  )
}

// Exemplo 7: Componente de Comentários
function DocumentComments() {
  const { logCommentAdded } = useAuditLogger()

  const handleAddComment = async (documentTitle: string, commentId: string, documentId: string) => {
    try {
      // ... lógica de adição de comentário ...
      
      // Registrar log de comentário adicionado
      logCommentAdded(documentTitle, commentId, documentId)
      
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error)
    }
  }

  return (
    // ... JSX do componente ...
    <div>Comments Component</div>
  )
}

// Exemplo 8: Hook de Login/Logout
function useAuthWithLogging() {
  const { logLoginActivity } = useAuditLogger()

  const handleLogin = async (credentials: any) => {
    try {
      // ... lógica de login ...
      
      // Registrar log de login bem-sucedido
      logLoginActivity('success', {
        login_method: 'email',
        timestamp: new Date().toISOString()
      })
      
    } catch (error) {
      // Registrar log de tentativa de login falhada
      logLoginActivity('failed', {
        error_message: error.message,
        attempted_email: credentials.email
      })
    }
  }

  const handleLogout = async () => {
    try {
      // ... lógica de logout ...
      
      // Registrar log de logout
      logLoginActivity('logout')
      
    } catch (error) {
      console.error('Erro no logout:', error)
    }
  }

  return { handleLogin, handleLogout }
}

// Exemplo 9: Uso do log genérico para ações customizadas
function CustomComponent() {
  const { logSystemAction } = useAuditLogger()

  const handleCustomAction = async () => {
    try {
      // ... lógica customizada ...
      
      // Registrar log de ação customizada
      logSystemAction(
        'Ação customizada realizada',
        'custom',
        'custom-id',
        {
          custom_data: 'dados específicos da ação',
          timestamp: new Date().toISOString()
        },
        'info'
      )
      
    } catch (error) {
      // Registrar log de erro
      logSystemAction(
        'Erro na ação customizada',
        'custom',
        'custom-id',
        {
          error_message: error.message
        },
        'error'
      )
    }
  }

  return (
    // ... JSX do componente ...
    <div>Custom Component</div>
  )
}

export {
  DocumentUpload,
  DocumentApproval,
  DigitalSignature,
  UserManagement,
  EntitySettings,
  NotificationSystem,
  DocumentComments,
  useAuthWithLogging,
  CustomComponent
}

/*
INSTRUÇÕES DE USO:

1. Importe o hook useAuditLogger no seu componente
2. Desestruture as funções específicas que você precisa
3. Chame as funções de log nos momentos apropriados:
   - Após operações bem-sucedidas
   - Em caso de erros
   - Quando houver mudanças importantes

4. Tipos de logs disponíveis:
   - logDocumentAction: Para ações em documentos
   - logApprovalAction: Para aprovações/rejeições
   - logSignatureAction: Para assinaturas digitais
   - logUserAction: Para ações de usuários
   - logFileUpload: Para uploads de arquivos
   - logConfigurationChange: Para mudanças de configuração
   - logNotificationSent: Para notificações enviadas
   - logCommentAdded: Para comentários adicionados
   - logLoginActivity: Para atividades de login/logout
   - logEntityUpdate: Para atualizações da entidade
   - logSystemAction: Para ações genéricas do sistema

5. Severidades disponíveis:
   - 'info': Informações gerais
   - 'success': Operações bem-sucedidas
   - 'warning': Avisos importantes
   - 'error': Erros e falhas

6. Os logs são automaticamente associados ao usuário logado e à entidade
7. Todos os logs aparecem na página "Logs do Sistema" para administradores
*/