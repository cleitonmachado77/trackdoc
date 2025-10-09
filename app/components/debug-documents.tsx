"use client"

import { useAuth } from '@/lib/hooks/use-unified-auth'
import { useDocuments } from "@/hooks/use-documents"
import { useCategories } from "@/hooks/use-categories"
import { useDepartments } from "@/hooks/use-departments"
import { useDocumentTypes } from "@/hooks/use-document-types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugDocuments() {
  const { user } = useAuth()
  const { documents, loading: docsLoading, error: docsError } = useDocuments()
  const { categories, loading: catLoading, error: catError } = useCategories()
  const { departments, loading: deptLoading, error: deptError } = useDepartments()
  const { documentTypes, loading: typeLoading, error: typeError } = useDocumentTypes()

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Debug - Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Usuário:</strong> {user?.email || 'Não autenticado'}</p>
            <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
            
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Documentos:</h3>
              <p>Loading: {docsLoading ? 'Sim' : 'Não'}</p>
              <p>Error: {docsError || 'Nenhum'}</p>
              <p>Count: {documents.length}</p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Categorias:</h3>
              <p>Loading: {catLoading ? 'Sim' : 'Não'}</p>
              <p>Error: {catError || 'Nenhum'}</p>
              <p>Count: {categories.length}</p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Departamentos:</h3>
              <p>Loading: {deptLoading ? 'Sim' : 'Não'}</p>
              <p>Error: {deptError || 'Nenhum'}</p>
              <p>Count: {departments.length}</p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Tipos de Documento:</h3>
              <p>Loading: {typeLoading ? 'Sim' : 'Não'}</p>
              <p>Error: {typeError || 'Nenhum'}</p>
              <p>Count: {documentTypes.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
