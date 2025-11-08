import DocumentTypeManagement from "@/app/components/admin/document-type-management"
import { getDocumentTypes, getDocumentsCount } from "@/app/admin/actions"
import { headers } from 'next/headers'

// Desabilitar TODOS os tipos de cache
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'

export default async function DocumentTypesPage() {
  // LOGS FORÇADOS - DEVEM APARECER NO TERMINAL
  console.error("=" .repeat(80))
  console.error("🚨 [DocumentTypesPage] PÁGINA CARREGADA!")
  console.error("🚨 [DocumentTypesPage] Se você está vendo isso, a página foi executada")
  console.error("=" .repeat(80))
  
  // Forçar headers para garantir que não há cache
  const headersList = headers()
  const timestamp = new Date().toISOString()
  
  console.log("🔄 [DocumentTypesPage] ==================== CARREGANDO ====================")
  console.log("🔄 [DocumentTypesPage] Timestamp:", timestamp)
  console.log("🔄 [DocumentTypesPage] Headers:", headersList.get('user-agent'))
  
  // Buscar dados em paralelo
  const [documentTypes, documentsCount] = await Promise.all([
    getDocumentTypes(),
    getDocumentsCount()
  ])
  
  console.log("🔄 [DocumentTypesPage] Dados carregados:", documentTypes.length, "tipos")
  console.log("🔄 [DocumentTypesPage] Tipos:", documentTypes.map(t => ({ 
    name: t.name, 
    retentionPeriod: t.retentionPeriod 
  })))
  console.log("🔄 [DocumentTypesPage] ====================================================")
  
  return <DocumentTypeManagement 
    initialDocumentTypes={documentTypes ?? []} 
    totalDocuments={documentsCount}
    key={timestamp} // Força re-render com key única
  />
}
