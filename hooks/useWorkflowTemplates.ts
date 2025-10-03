import { useCallback, useMemo, useState } from 'react'

export interface WorkflowTemplateStepForm {
  id?: string
  stepOrder: number
  type: 'user' | 'action'
  name: string
  metadata: Record<string, any>
  uiPosition: { x: number; y: number }
}

export interface WorkflowTemplateTransitionForm {
  id?: string
  fromStepId: string
  toStepId: string
  condition: 'always' | 'approved' | 'rejected' | 'custom'
  metadata?: Record<string, any>
}

export interface WorkflowTemplateForm {
  id?: string
  name: string
  description?: string
  status: 'draft' | 'active' | 'inactive'
  entityId?: string
  steps: WorkflowTemplateStepForm[]
  transitions: WorkflowTemplateTransitionForm[]
}

export interface WorkflowTemplateResponse extends WorkflowTemplateForm {
  id: string
  entity_id?: string
  created_by: string
  created_at: string
  updated_at: string
  template_snapshot?: {
    steps: WorkflowTemplateStepForm[]
    transitions: WorkflowTemplateTransitionForm[]
  }
}

export function useWorkflowTemplates() {
  const [templates, setTemplates] = useState<WorkflowTemplateResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/workflows/templates')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar templates')
      }

      const formatted = (data.templates || []).map((template: WorkflowTemplateResponse) => ({
        ...template,
        steps: template.template_snapshot?.steps ?? template.steps ?? [],
        transitions: template.template_snapshot?.transitions ?? template.transitions ?? [],
      }))

      setTemplates(formatted)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar templates'
      setError(message)
      console.error('[useWorkflowTemplates] fetchTemplates error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const saveTemplate = useCallback(async (payload: WorkflowTemplateForm) => {
    try {
      const response = await fetch('/api/workflows/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar template')
      }

      await fetchTemplates()
      return { success: true, templateId: data.templateId as string }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar template'
      console.error('[useWorkflowTemplates] saveTemplate error:', err)
      return { success: false, error: message }
    }
  }, [fetchTemplates])

  const deleteTemplate = useCallback(async (templateId: string) => {
    try {
      const response = await fetch(`/api/workflows/templates?id=${templateId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir template')
      }

      await fetchTemplates()
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir template'
      console.error('[useWorkflowTemplates] deleteTemplate error:', err)
      return { success: false, error: message }
    }
  }, [fetchTemplates])

  const value = useMemo(() => ({
    templates,
    loading,
    error,
    fetchTemplates,
    saveTemplate,
    deleteTemplate,
  }), [templates, loading, error, fetchTemplates, saveTemplate, deleteTemplate])

  return value
}

