import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/lib/hooks/use-auth-final'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface EntityStats {
  total_documents: number
  draft_documents: number
  pending_documents: number
  approved_documents: number
  total_users: number
  active_users: number
  recent_activity: Array<{
    id: string
    action: string
    user_name: string
    created_at: string
  }>
  documents_by_category: Array<{
    category: string
    count: number
    color: string
  }>
  documents_by_type: Array<{
    type: string
    count: number
    color: string
  }>
}

export function useEntityStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState<EntityStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetchEntityStats()
    } else {
      setStats(null)
      setLoading(false)
    }
  }, [user?.id])

  const fetchEntityStats = async () => {
    try {
      setLoading(true)
      setError(null)

      // Buscar o profile do usuário para obter entity_id
      let entityId = 'ebde2fef-30e2-458b-8721-d86df2f6865b' // ID padrão da entidade
      
      if (user?.id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('entity_id')
          .eq('id', user.id)
          .single()
        
        if (profileData?.entity_id) {
          entityId = profileData.entity_id
        }
      }

      if (!entityId) return

      // Buscar estatísticas básicas usando a função RPC
      const { data: basicStats, error: basicError } = await supabase
        .rpc('get_entity_stats', { p_entity_id: entityId })

      if (basicError) throw basicError

      // Buscar documentos por categoria
      const { data: categoryStats, error: categoryError } = await supabase
        .from('documents')
        .select(`
          category_id,
          categories!documents_category_id_fkey(name, color)
        `)
        .eq('entity_id', entityId)
        .not('category_id', 'is', null)

      if (categoryError) throw categoryError

      // Buscar documentos por tipo
      const { data: typeStats, error: typeError } = await supabase
        .from('documents')
        .select(`
          document_type_id,
          document_types!documents_document_type_id_fkey(name, color)
        `)
        .eq('entity_id', entityId)
        .not('document_type_id', 'is', null)

      if (typeError) throw typeError

      // Buscar atividade recente
      const { data: recentActivity, error: activityError } = await supabase
        .from('audit_logs')
        .select(`
          id,
          action,
          created_at,
          profiles!audit_logs_user_id_fkey(full_name)
        `)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (activityError) throw activityError

      // Processar estatísticas por categoria
      const categoryCounts = categoryStats?.reduce((acc: any, doc: any) => {
        const categoryName = doc.categories?.name || 'Sem categoria'
        const categoryColor = doc.categories?.color || '#6B7280'
        
        if (!acc[categoryName]) {
          acc[categoryName] = { count: 0, color: categoryColor }
        }
        acc[categoryName].count++
        return acc
      }, {})

      const documentsByCategory = Object.entries(categoryCounts || {}).map(([name, data]: [string, any]) => ({
        category: name,
        count: data.count,
        color: data.color
      }))

      // Processar estatísticas por tipo
      const typeCounts = typeStats?.reduce((acc: any, doc: any) => {
        const typeName = doc.document_types?.name || 'Sem tipo'
        const typeColor = doc.document_types?.color || '#6B7280'
        
        if (!acc[typeName]) {
          acc[typeName] = { count: 0, color: typeColor }
        }
        acc[typeName].count++
        return acc
      }, {})

      const documentsByType = Object.entries(typeCounts || {}).map(([name, data]: [string, any]) => ({
        type: name,
        count: data.count,
        color: data.color
      }))

      // Processar atividade recente
      const processedActivity = recentActivity?.map((log: any) => ({
        id: log.id,
        action: log.action,
        user_name: log.profiles?.full_name || 'Usuário desconhecido',
        created_at: log.created_at
      })) || []

      const entityStats: EntityStats = {
        total_documents: basicStats?.[0]?.total_documents || 0,
        draft_documents: basicStats?.[0]?.draft_documents || 0,
        pending_documents: basicStats?.[0]?.pending_documents || 0,
        approved_documents: basicStats?.[0]?.approved_documents || 0,
        total_users: basicStats?.[0]?.total_users || 0,
        active_users: basicStats?.[0]?.active_users || 0,
        recent_activity: processedActivity,
        documents_by_category: documentsByCategory,
        documents_by_type: documentsByType
      }

      setStats(entityStats)
    } catch (err) {
      console.error('Erro ao carregar estatísticas da entidade:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas')
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  const refreshStats = () => {
    fetchEntityStats()
  }

  return {
    stats,
    loading,
    error,
    refreshStats
  }
}
