/**
 * Traduz roles do inglês para português
 */
export function translateRole(role: string | undefined | null): string {
  if (!role) return ''
  
  const translations: Record<string, string> = {
    'manager': 'Gerente',
    'admin': 'Administrador',
    'user': 'Usuário',
    'viewer': 'Visualizador'
  }
  
  return translations[role.toLowerCase()] || role
}

/**
 * Traduz status do inglês para português
 */
export function translateStatus(status: string | undefined | null): string {
  if (!status) return ''
  
  const translations: Record<string, string> = {
    'active': 'Ativo',
    'inactive': 'Inativo',
    'suspended': 'Suspenso',
    'pending_confirmation': 'Pendente confirmação',
    'deleted': 'Excluído',
    'pending': 'Pendente',
    'approved': 'Aprovado',
    'rejected': 'Rejeitado',
    'completed': 'Concluído',
    'failed': 'Falhou',
    'cancelled': 'Cancelado'
  }
  
  return translations[status.toLowerCase()] || status
}
