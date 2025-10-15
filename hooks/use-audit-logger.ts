import { useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/lib/hooks/use-auth-final'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface AuditLogEntry {
  action: string
  resource_type: string
  resource_id: string
  details?: any
  severity?: 'info' | 'success' | 'warning' | 'error'
  ip_address?: string
}

export function useAuditLogger() {
  const { user } = useAuth()

  const logAction = useCallback(async (entry: AuditLogEntry) => {
    try {
      if (!user?.id) return

      // Buscar entity_id do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('entity_id')
        .eq('id', user.id)
        .single()

      const entityId = profile?.entity_id

      // Obter IP do usuário (simulado para desenvolvimento)
      const ipAddress = entry.ip_address || '127.0.0.1'

      // Tentar inserir na tabela audit_logs se existir
      try {
        await supabase
          .from('audit_logs')
          .insert({
            action: entry.action,
            user_id: user.id,
            entity_id: entityId,
            resource_type: entry.resource_type,
            resource_id: entry.resource_id,
            details: entry.details || {},
            severity: entry.severity || 'info',
            ip_address: ipAddress,
            user_agent: navigator.userAgent,
            created_at: new Date().toISOString()
          })
        
        console.log('Log de auditoria registrado:', entry.action)
      } catch (auditError) {
        // Se a tabela não existir, registrar no console para desenvolvimento
        console.log('Log de auditoria (tabela não encontrada):', {
          action: entry.action,
          user: user.email,
          entity: entityId,
          resource: `${entry.resource_type}:${entry.resource_id}`,
          details: entry.details,
          severity: entry.severity || 'info',
          timestamp: new Date().toISOString()
        })
      }
    } catch (error) {
      console.warn('Erro ao registrar log de auditoria:', error)
    }
  }, [user])

  // Funções específicas para diferentes tipos de ações
  const logDocumentAction = useCallback((action: string, documentId: string, documentTitle: string, severity: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    logAction({
      action: `${action}: ${documentTitle}`,
      resource_type: 'document',
      resource_id: documentId,
      details: { document_title: documentTitle },
      severity
    })
  }, [logAction])

  const logApprovalAction = useCallback((action: string, approvalId: string, documentTitle: string, approved: boolean, comments?: string) => {
    logAction({
      action: `${action}: ${documentTitle}`,
      resource_type: 'approval',
      resource_id: approvalId,
      details: { 
        document_title: documentTitle,
        approved,
        comments
      },
      severity: approved ? 'success' : 'error'
    })
  }, [logAction])

  const logSignatureAction = useCallback((action: string, signatureId: string, documentTitle: string, status: string) => {
    logAction({
      action: `${action}: ${documentTitle}`,
      resource_type: 'signature',
      resource_id: signatureId,
      details: { 
        document_title: documentTitle,
        status
      },
      severity: status === 'completed' ? 'success' : status === 'failed' ? 'error' : 'info'
    })
  }, [logAction])

  const logUserAction = useCallback((action: string, targetUserId: string, userEmail: string, details?: any) => {
    logAction({
      action: `${action}: ${userEmail}`,
      resource_type: 'user',
      resource_id: targetUserId,
      details: { 
        user_email: userEmail,
        ...details
      },
      severity: 'info'
    })
  }, [logAction])

  const logSystemAction = useCallback((action: string, resourceType: string, resourceId: string, details?: any, severity: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    logAction({
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details,
      severity
    })
  }, [logAction])

  const logFileUpload = useCallback((filename: string, fileSize: number, documentId: string, documentTitle: string) => {
    logAction({
      action: `Arquivo enviado: ${filename}`,
      resource_type: 'file',
      resource_id: documentId,
      details: { 
        filename,
        file_size: fileSize,
        document_title: documentTitle
      },
      severity: 'success'
    })
  }, [logAction])

  const logConfigurationChange = useCallback((configType: string, configId: string, changes: any) => {
    logAction({
      action: `Configuração alterada: ${configType}`,
      resource_type: 'configuration',
      resource_id: configId,
      details: { 
        config_type: configType,
        changes
      },
      severity: 'info'
    })
  }, [logAction])

  const logNotificationSent = useCallback((title: string, notificationId: string, recipients: number, type: string) => {
    logAction({
      action: `Notificação enviada: ${title}`,
      resource_type: 'notification',
      resource_id: notificationId,
      details: { 
        title,
        recipients_count: recipients,
        type
      },
      severity: 'success'
    })
  }, [logAction])

  const logCommentAdded = useCallback((documentTitle: string, commentId: string, documentId: string) => {
    logAction({
      action: `Comentário adicionado: ${documentTitle}`,
      resource_type: 'comment',
      resource_id: commentId,
      details: { 
        document_title: documentTitle,
        document_id: documentId
      },
      severity: 'info'
    })
  }, [logAction])

  const logLoginActivity = useCallback((loginType: 'success' | 'failed' | 'logout', details?: any) => {
    const actions = {
      success: 'Login realizado com sucesso',
      failed: 'Tentativa de login falhada',
      logout: 'Logout realizado'
    }
    
    logAction({
      action: actions[loginType],
      resource_type: 'auth',
      resource_id: user?.id || 'unknown',
      details: {
        login_type: loginType,
        ...details
      },
      severity: loginType === 'success' ? 'success' : loginType === 'failed' ? 'error' : 'info'
    })
  }, [logAction, user])

  const logEntityUpdate = useCallback((entityName: string, entityId: string, changes: any) => {
    logAction({
      action: `Entidade atualizada: ${entityName}`,
      resource_type: 'entity',
      resource_id: entityId,
      details: { 
        entity_name: entityName,
        changes
      },
      severity: 'info'
    })
  }, [logAction])

  return {
    logAction,
    logDocumentAction,
    logApprovalAction,
    logSignatureAction,
    logUserAction,
    logSystemAction,
    logFileUpload,
    logConfigurationChange,
    logNotificationSent,
    logCommentAdded,
    logLoginActivity,
    logEntityUpdate
  }
}