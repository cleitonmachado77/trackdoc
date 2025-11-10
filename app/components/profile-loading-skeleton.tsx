"use client"

/**
 * Skeleton de loading para perfil
 * Usado quando o perfil está carregando mas não bloqueia a aplicação
 */
export function ProfileLoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
    </div>
  )
}

/**
 * Skeleton de loading para página completa
 * Usado apenas em casos críticos onde o perfil é obrigatório
 */
export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600 text-sm">Carregando...</p>
        <p className="text-gray-400 text-xs mt-2">Se demorar muito, recarregue a página</p>
      </div>
    </div>
  )
}
