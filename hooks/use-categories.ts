import { useState, useEffect, useCallback } from 'react'
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
  created_by?: string
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

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Buscar o profile do usuário para obter entity_id
      let entityId: string | null = null
      
      if (user?.id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('entity_id')
          .eq('id', user.id)
          .single()
        
        entityId = profileData?.entity_id || null
      }

      let query = supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })

      // Filtrar por entity_id ou por created_by (usuários solo)
      if (entityId) {
        query = query.eq('entity_id', entityId)
      } else if (user?.id) {
        // Usuário solo: buscar apenas categorias criadas por ele
        query = query.is('entity_id', null).eq('created_by', user.id)
      }

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
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      fetchCategories()
    }
  }, [user?.id, fetchCategories])

  const createCategory = async (categoryData: Partial<Category>) => {
    try {
      setError(null)

      // Buscar o profile do usuário para obter entity_id
      let entityId: string | null = null
      
      if (user?.id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('entity_id')
          .eq('id', user.id)
          .single()
        
        entityId = profileData?.entity_id || null
      }

      const { data, error } = await supabase
        .from('categories')
        .insert({
          ...categoryData,
          entity_id: entityId,
          created_by: user?.id
        })
        .select()
        .single()

      if (error) {
        // Tratar erro de conflito (409)
        if (error.code === '23505') {
          throw new Error('Já existe uma categoria com este nome')
        }
        throw error
      }

      await fetchCategories()
      return data
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao criar categoria'
      setError(errorMessage)
      throw new Error(errorMessage)
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

      if (error) {
        // Tratar erro de conflito (409)
        if (error.code === '23505') {
          throw new Error('Já existe uma categoria com este nome')
        }
        throw error
      }

      await fetchCategories()
      return data
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao atualizar categoria'
      setError(errorMessage)
      throw new Error(errorMessage)
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
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao deletar categoria'
      setError(errorMessage)
      throw new Error(errorMessage)
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
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao alterar status da categoria'
      setError(errorMessage)
      throw new Error(errorMessage)
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
