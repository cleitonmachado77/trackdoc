import { useState, useCallback } from 'react'
import { validateUploadLimits, formatUploadErrorMessage, checkUserLimitsWarning, UploadValidationResult } from '@/lib/middleware/upload-limits'
import { useAuth } from '@/lib/hooks/use-auth-final'
import { useToast } from '@/hooks/use-toast'

export function useUploadLimits() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isValidating, setIsValidating] = useState(false)

  /**
   * Valida se um arquivo pode ser enviado
   */
  const validateFile = useCallback(async (file: File): Promise<boolean> => {
    if (!user?.id) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para fazer upload de arquivos.",
        variant: "destructive"
      })
      return false
    }

    setIsValidating(true)
    
    try {
      const result = await validateUploadLimits(user.id, file.size)
      
      if (!result.canUpload) {
        const errorMessage = formatUploadErrorMessage(result)
        
        toast({
          title: "Upload não permitido",
          description: errorMessage,
          variant: "destructive"
        })
        
        return false
      }

      // Verificar se está próximo dos limites e mostrar aviso
      const warning = await checkUserLimitsWarning(user.id)
      
      if (warning.hasWarning) {
        let warningMessage = "Atenção: Você está próximo dos limites do seu plano. "
        
        if (warning.storageWarning) {
          warningMessage += `Armazenamento: ${warning.storagePercent}% usado. `
        }
        
        if (warning.documentsWarning) {
          warningMessage += `Documentos: ${warning.documentsPercent}% do limite. `
        }
        
        toast({
          title: "Aviso de limite",
          description: warningMessage,
          variant: "default"
        })
      }

      return true
    } catch (error) {
      console.error('Erro ao validar upload:', error)
      
      toast({
        title: "Erro na validação",
        description: "Não foi possível verificar os limites. Tente novamente.",
        variant: "destructive"
      })
      
      return false
    } finally {
      setIsValidating(false)
    }
  }, [user?.id, toast])

  /**
   * Valida múltiplos arquivos
   */
  const validateFiles = useCallback(async (files: File[]): Promise<boolean> => {
    if (!user?.id) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para fazer upload de arquivos.",
        variant: "destructive"
      })
      return false
    }

    setIsValidating(true)
    
    try {
      // Calcular tamanho total
      const totalSize = files.reduce((sum, file) => sum + file.size, 0)
      
      const result = await validateUploadLimits(user.id, totalSize)
      
      if (!result.canUpload) {
        const errorMessage = formatUploadErrorMessage(result)
        
        toast({
          title: "Upload não permitido",
          description: errorMessage,
          variant: "destructive"
        })
        
        return false
      }

      // Verificar limite de documentos
      if (result.currentDocuments + files.length > result.maxDocuments) {
        toast({
          title: "Limite de documentos",
          description: `Você pode enviar apenas ${result.maxDocuments - result.currentDocuments} documento(s) adicional(is). Limite atual: ${result.currentDocuments}/${result.maxDocuments}`,
          variant: "destructive"
        })
        
        return false
      }

      return true
    } catch (error) {
      console.error('Erro ao validar uploads múltiplos:', error)
      
      toast({
        title: "Erro na validação",
        description: "Não foi possível verificar os limites. Tente novamente.",
        variant: "destructive"
      })
      
      return false
    } finally {
      setIsValidating(false)
    }
  }, [user?.id, toast])

  /**
   * Verifica os limites atuais do usuário
   */
  const checkLimits = useCallback(async (): Promise<UploadValidationResult | null> => {
    if (!user?.id) return null

    try {
      // Usar um arquivo de 1 byte para verificar os limites atuais
      return await validateUploadLimits(user.id, 1)
    } catch (error) {
      console.error('Erro ao verificar limites:', error)
      return null
    }
  }, [user?.id])

  /**
   * Verifica se há avisos de limite
   */
  const checkWarnings = useCallback(async () => {
    if (!user?.id) return

    try {
      const warning = await checkUserLimitsWarning(user.id)
      
      if (warning.hasWarning) {
        let warningMessage = "Você está próximo dos limites do seu plano:\n"
        
        if (warning.storageWarning) {
          warningMessage += `• Armazenamento: ${warning.storagePercent}% usado\n`
        }
        
        if (warning.documentsWarning) {
          warningMessage += `• Documentos: ${warning.documentsPercent}% do limite\n`
        }
        
        toast({
          title: "Aviso de limite",
          description: warningMessage,
          variant: "default"
        })
      }
    } catch (error) {
      console.error('Erro ao verificar avisos:', error)
    }
  }, [user?.id, toast])

  return {
    validateFile,
    validateFiles,
    checkLimits,
    checkWarnings,
    isValidating
  }
}