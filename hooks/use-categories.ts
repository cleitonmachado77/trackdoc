import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/lib/hooks/use-auth-final'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface Category {
  id: string
  name: string
  description?: string
  color?: string
  entity_id?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
  // Relacionamentos
  document_count?: number
}

export function useCategories() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetchCategories()
    }
  }, [user?.id])

  const fetchCategories = async () => {
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

      let query = supabase
        .from('categories')
        .select('*')
        .eq('entity_id', entityId)
        .order('name', { ascending: true })

      const { data, error } = await query

      if (error) throw error



      // Buscar contagem de documentos para cada categoria
      const categoriesWithCounts = await Promise.all(
        (data || []).map(async (category) => {
          // Contar documentos
          const { count: docCount } = await supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)

          return {
            ...category,
            document_count: docCount || 0
          }
        })
      )

      setCategories(categoriesWithCounts)
    } catch (err) {
      console.error('Erro ao carregar categorias:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar categorias')
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const createCategory = async (categoryData: Partial<Category>) => {
    try {
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

      const { data, error } = await supabase
        .from('categories')
        .insert({
          ...categoryData,
          entity_id: entityId
        })
        .select()
        .single()

      if (error) throw error

      // Debug: Log da categoria criada


      await fetchCategories()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar categoria')
      throw err
    }
  }

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      setError(null)

      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      await fetchCategories()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar categoria')
      throw err
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      setError(null)

      // Verificar se há documentos usando esta categoria
      const { count: docCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', id)

      if (docCount && docCount > 0) {
        throw new Error('Não é possível deletar uma categoria que possui documentos')
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar categoria')
      throw err
    }
  }

  const toggleCategoryStatus = async (id: string) => {
    try {
      setError(null)

      const category = categories.find(c => c.id === id)
      if (!category) throw new Error('Categoria não encontrada')

      const newStatus = category.status === 'active' ? 'inactive' : 'active'

      const { data, error } = await supabase
        .from('categories')
        .update({ status: newStatus })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      await fetchCategories()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar status da categoria')
      throw err
    }
  }

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
    refetch: fetchCategories
  }
}
