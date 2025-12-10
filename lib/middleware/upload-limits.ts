import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface UploadValidationResult {
  canUpload: boolean
  reason?: string
  currentStorageGB: number
  maxStorageGB: number
  availableGB: number
  currentDocuments: number
  maxDocuments: number
}

/**
 * Verifica se um usuário pode fazer upload de um arquivo
 * baseado nos limites do seu plano
 */
export async function validateUploadLimits(
  userId: string,
  fileSizeBytes: number
): Promise<UploadValidationResult> {
  try {
    console.log('🔍 [validateUploadLimits] Verificando limites para usuário:', userId, 'tamanho:', fileSizeBytes)
    
    // Chamar função SQL para verificar se upload é permitido
    const { data, error } = await supabase
      .rpc('can_upload_file', {
        p_user_id: userId,
        p_file_size_bytes: fileSizeBytes
      })

    if (error) {
      console.error('❌ [validateUploadLimits] Erro ao verificar limites:', error)
      // Em caso de erro, permitir upload (fail-safe)
      return {
        canUpload: true,
        reason: 'Erro ao verificar limites - upload permitido por segurança',
        currentStorageGB: 0,
        maxStorageGB: 0,
        availableGB: 0,
        currentDocuments: 0,
        maxDocuments: 0
      }
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ [validateUploadLimits] Nenhum resultado retornado')
      return {
        canUpload: false,
        reason: 'Não foi possível verificar os limites do usuário',
        currentStorageGB: 0,
        maxStorageGB: 0,
        availableGB: 0,
        currentDocuments: 0,
        maxDocuments: 0
      }
    }

    const result = data[0]
    
    console.log('📊 [validateUploadLimits] Resultado da verificação:', {
      canUpload: result.can_upload,
      reason: result.reason,
      currentStorage: result.current_storage_gb,
      maxStorage: result.max_storage_gb,
      available: result.available_gb
    })

    return {
      canUpload: result.can_upload,
      reason: result.reason,
      currentStorageGB: parseFloat(result.current_storage_gb) || 0,
      maxStorageGB: parseFloat(result.max_storage_gb) || 0,
      availableGB: parseFloat(result.available_gb) || 0,
      currentDocuments: result.current_documents || 0,
      maxDocuments: result.max_documents || 0
    }
  } catch (error) {
    console.error('❌ [validateUploadLimits] Erro inesperado:', error)
    // Em caso de erro, permitir upload (fail-safe)
    return {
      canUpload: true,
      reason: 'Erro inesperado - upload permitido por segurança',
      currentStorageGB: 0,
      maxStorageGB: 0,
      availableGB: 0,
      currentDocuments: 0,
      maxDocuments: 0
    }
  }
}

/**
 * Formata mensagem de erro para o usuário
 */
export function formatUploadErrorMessage(result: UploadValidationResult): string {
  if (result.canUpload) {
    return ''
  }

  const { reason, currentStorageGB, maxStorageGB, availableGB, currentDocuments, maxDocuments } = result

  if (reason?.includes('documentos')) {
    return `Limite de documentos atingido. Você já possui ${currentDocuments} documentos de um máximo de ${maxDocuments} permitidos pelo seu plano.`
  }

  if (reason?.includes('armazenamento')) {
    return `Limite de armazenamento seria excedido. Você está usando ${currentStorageGB.toFixed(2)} GB de ${maxStorageGB} GB disponíveis. Espaço restante: ${availableGB.toFixed(2)} GB.`
  }

  if (reason?.includes('plano')) {
    return 'Você não possui um plano ativo. Entre em contato com o administrador para ativar um plano.'
  }

  return reason || 'Upload não permitido devido aos limites do seu plano.'
}

/**
 * Verifica se o usuário está próximo dos limites (80% ou mais)
 */
export async function checkUserLimitsWarning(userId: string): Promise<{
  hasWarning: boolean
  storageWarning: boolean
  documentsWarning: boolean
  storagePercent: number
  documentsPercent: number
}> {
  try {
    const { data, error } = await supabase
      .rpc('check_user_plan_limits', { p_user_id: userId })

    if (error || !data || data.length === 0) {
      return {
        hasWarning: false,
        storageWarning: false,
        documentsWarning: false,
        storagePercent: 0,
        documentsPercent: 0
      }
    }

    const limits = data[0]
    const storagePercent = limits.storage_usage_percent || 0
    const documentsPercent = limits.documents_usage_percent || 0
    
    const storageWarning = storagePercent >= 80
    const documentsWarning = documentsPercent >= 80

    return {
      hasWarning: storageWarning || documentsWarning,
      storageWarning,
      documentsWarning,
      storagePercent,
      documentsPercent
    }
  } catch (error) {
    console.error('❌ [checkUserLimitsWarning] Erro:', error)
    return {
      hasWarning: false,
      storageWarning: false,
      documentsWarning: false,
      storagePercent: 0,
      documentsPercent: 0
    }
  }
}