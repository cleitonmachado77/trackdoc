import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/lib/hooks/use-auth-final'
import { useToast } from '@/hooks/use-toast'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function useAvatarUploadSimple() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)

  const uploadAvatar = async (file: File) => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      })
      return null
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Por favor, selecione uma imagem (JPG, PNG ou WebP)",
        variant: "destructive",
      })
      return null
    }

    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 5MB",
        variant: "destructive",
      })
      return null
    }

    setIsUploading(true)

    try {
      // Converter arquivo para base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const base64Data = await base64Promise

      // Salvar avatar como base64 no campo avatar_url do perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: base64Data,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Erro ao atualizar perfil:', updateError)
        throw updateError
      }

      toast({
        title: "Avatar atualizado",
        description: "Sua foto de perfil foi atualizada com sucesso!",
      })

      return base64Data
    } catch (error) {
      console.error('Erro no upload do avatar:', error)
      toast({
        title: "Erro ao fazer upload",
        description: "Não foi possível atualizar sua foto de perfil. Tente novamente.",
        variant: "destructive",
      })
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const deleteAvatar = async () => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      })
      return false
    }

    setIsUploading(true)

    try {
      // Remover avatar_url do perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Erro ao remover avatar:', updateError)
        throw updateError
      }

      toast({
        title: "Avatar removido",
        description: "Sua foto de perfil foi removida com sucesso!",
      })

      return true
    } catch (error) {
      console.error('Erro ao remover avatar:', error)
      toast({
        title: "Erro ao remover avatar",
        description: "Não foi possível remover sua foto de perfil. Tente novamente.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsUploading(false)
    }
  }

  return {
    uploadAvatar,
    deleteAvatar,
    isUploading
  }
}
