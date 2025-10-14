import { useCallback, useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/lib/hooks/use-auth-final'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface DocumentVersion {
  id: string
  document_id: string
  version_number: number
  file_path: string
  file_name: string
  file_size: number
  file_type: string
  change_description?: string
  author_id: string
  created_at: string
  author?: { full_name: string }
  download_url?: string
}

export function useDocumentVersions(documentId?: string) {
  const { user } = useAuth()
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchVersions = useCallback(async () => {
    if (!documentId) {
      setVersions([])
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('document_versions')
        .select(`
          *,
          author:profiles!document_versions_author_id_fkey(full_name)
        `)
        .eq('document_id', documentId)
        .order('version_number', { ascending: false })

      if (error) throw error

      // Processar versões para incluir URLs de download
      const processedVersions = await Promise.all(
        (data || []).map(async (version) => {
          try {
            const { data: urlData } = await supabase.storage
              .from('documents')
              .createSignedUrl(version.file_path, 3600) // 1 hora

            return {
              ...version,
              download_url: urlData?.signedUrl
            }
          } catch (error) {
            console.warn(`Erro ao gerar URL para versão ${version.id}:`, error)
            return version
          }
        })
      )

      setVersions(processedVersions)
    } catch (err: any) {
      console.error('Erro ao buscar versões do documento:', err)
      setError(err.message || 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [documentId])

  useEffect(() => {
    fetchVersions()
  }, [fetchVersions])

  const createNewVersion = async (
    documentId: string,
    file: File,
    changeDescription?: string
  ) => {
    try {
      if (!user?.id) throw new Error('Usuário não autenticado')

      // Buscar a versão atual do documento
      const { data: currentDoc, error: docError } = await supabase
        .from('documents')
        .select('version, file_path')
        .eq('id', documentId)
        .single()

      if (docError) throw docError

      const newVersionNumber = (currentDoc.version || 1) + 1

      // Fazer upload do novo arquivo
      const fileExtension = file.name.split('.').pop()
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`
      const newFilePath = `documents/${user.id}/${uniqueFileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(newFilePath, file)

      if (uploadError) throw uploadError

      // Salvar a versão anterior na tabela de versões (se não for a primeira versão)
      if (currentDoc.version && currentDoc.version > 1) {
        // Buscar dados da versão anterior
        const { data: prevVersionData } = await supabase
          .from('document_versions')
          .select('*')
          .eq('document_id', documentId)
          .eq('version_number', currentDoc.version)
          .single()

        if (!prevVersionData) {
          // Se não existe registro da versão anterior, criar baseado no documento atual
          await supabase
            .from('document_versions')
            .insert({
              document_id: documentId,
              version_number: currentDoc.version,
              file_path: currentDoc.file_path,
              file_name: file.name, // Usar o nome do arquivo anterior se disponível
              file_size: 0, // Tamanho não disponível para versões anteriores
              file_type: file.type,
              author_id: user.id,
              change_description: 'Versão anterior'
            })
        }
      }

      // Criar registro da nova versão
      const { data: newVersion, error: versionError } = await supabase
        .from('document_versions')
        .insert({
          document_id: documentId,
          version_number: newVersionNumber,
          file_path: newFilePath,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          author_id: user.id,
          change_description: changeDescription || `Versão ${newVersionNumber}`
        })
        .select()
        .single()

      if (versionError) throw versionError

      // Atualizar o documento principal com a nova versão
      // Extrair o título do nome do arquivo (sem extensão)
      const newTitle = file.name.replace(/\.[^/.]+$/, "")
      
      const { data: updatedDoc, error: updateError } = await supabase
        .from('documents')
        .update({
          version: newVersionNumber,
          title: newTitle, // Atualizar o título com o nome do novo arquivo
          file_path: newFilePath,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select()
        .single()

      if (updateError) throw updateError

      // Atualizar a lista de versões
      await fetchVersions()

      return {
        success: true,
        newVersion: newVersion,
        updatedDocument: updatedDoc,
        newVersionNumber: newVersionNumber
      }
    } catch (error: any) {
      console.error('Erro ao criar nova versão:', error)
      throw error
    }
  }

  const restoreVersion = async (versionId: string) => {
    try {
      if (!user?.id) throw new Error('Usuário não autenticado')

      // Buscar dados da versão a ser restaurada
      const { data: versionData, error: versionError } = await supabase
        .from('document_versions')
        .select('*')
        .eq('id', versionId)
        .single()

      if (versionError) throw versionError

      // Buscar dados atuais do documento
      const { data: currentDoc, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', versionData.document_id)
        .single()

      if (docError) throw docError

      const newVersionNumber = (currentDoc.version || 1) + 1

      // Salvar a versão atual antes de restaurar
      const { error: backupError } = await supabase
        .from('document_versions')
        .insert({
          document_id: versionData.document_id,
          version_number: currentDoc.version,
          file_path: currentDoc.file_path,
          file_name: currentDoc.file_name,
          file_size: currentDoc.file_size,
          file_type: currentDoc.file_type,
          author_id: user.id,
          change_description: `Backup antes da restauração da V${versionData.version_number}`
        })

      if (backupError) throw backupError

      // Copiar o arquivo da versão para um novo local
      const { data: fileData } = await supabase.storage
        .from('documents')
        .download(versionData.file_path)

      if (!fileData) throw new Error('Erro ao baixar arquivo da versão')

      const fileExtension = versionData.file_name.split('.').pop()
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`
      const newFilePath = `documents/${user.id}/${uniqueFileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(newFilePath, fileData)

      if (uploadError) throw uploadError

      // Atualizar o documento principal com a nova versão
      // Extrair o título do nome do arquivo (sem extensão)
      const newTitle = versionData.file_name.replace(/\.[^/.]+$/, "")
      
      const { data: updatedDoc, error: updateError } = await supabase
        .from('documents')
        .update({
          version: newVersionNumber,
          title: newTitle, // Atualizar o título com o nome do arquivo restaurado
          file_path: newFilePath,
          file_name: versionData.file_name,
          file_size: versionData.file_size,
          file_type: versionData.file_type,
          updated_at: new Date().toISOString()
        })
        .eq('id', versionData.document_id)
        .select()
        .single()

      if (updateError) throw updateError

      // Criar registro da versão restaurada
      const { error: versionInsertError } = await supabase
        .from('document_versions')
        .insert({
          document_id: versionData.document_id,
          version_number: newVersionNumber,
          file_path: newFilePath,
          file_name: versionData.file_name,
          file_size: versionData.file_size,
          file_type: versionData.file_type,
          author_id: user.id,
          change_description: `Restaurado da V${versionData.version_number}`
        })

      if (versionInsertError) throw versionInsertError

      // Atualizar a lista de versões
      await fetchVersions()

      // Retornar os dados atualizados do documento para que o componente pai possa atualizar
      return {
        success: true,
        updatedDocument: updatedDoc,
        newVersion: newVersionNumber
      }
    } catch (error: any) {
      console.error('Erro ao restaurar versão:', error)
      throw error
    }
  }

  const downloadVersion = async (version: DocumentVersion) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(version.file_path, 3600)

      if (error) throw error

      if (data?.signedUrl) {
        const link = document.createElement('a')
        link.href = data.signedUrl
        link.download = version.file_name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error: any) {
      console.error('Erro ao baixar versão:', error)
      throw error
    }
  }

  return {
    versions,
    loading,
    error,
    createNewVersion,
    restoreVersion,
    downloadVersion,
    refetch: fetchVersions
  }
}