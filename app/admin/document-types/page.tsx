import DocumentTypeManagement from "@/app/components/admin/document-type-management"
import { getDocumentTypes, getDocumentsCount } from "@/app/admin/actions"

export default async function DocumentTypesPage() {
  // Buscar dados em paralelo
  const [documentTypes, documentsCount] = await Promise.all([
    getDocumentTypes(),
    getDocumentsCount()
  ])
  
  return <DocumentTypeManagement 
    initialDocumentTypes={documentTypes ?? []} 
    totalDocuments={documentsCount}
  />
}
