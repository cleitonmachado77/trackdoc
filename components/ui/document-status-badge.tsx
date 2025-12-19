import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface DocumentStatusBadgeProps {
  status: string
  approvalRequired?: boolean
  className?: string
  size?: "sm" | "md" | "lg"
}

// Cores padronizadas mais suaves baseadas na imagem fornecida
const statusConfig = {
  approved: {
    label: "Aprovado",
    className: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
  },
  pending_approval: {
    label: "Em aprovação", 
    className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
  },
  rejected: {
    label: "Rejeitado",
    className: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
  },
  no_approval: {
    label: "Sem aprovação",
    className: "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
  },
  // Para compatibilidade com status antigos
  draft: {
    label: "Sem aprovação", // Mapear draft para "Sem aprovação" quando não requer aprovação
    className: "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
  },
  pending: {
    label: "Em aprovação",
    className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
  }
}

const sizeClasses = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-1", 
  lg: "text-base px-3 py-1.5"
}

export function DocumentStatusBadge({ 
  status, 
  approvalRequired = true, 
  className, 
  size = "sm" 
}: DocumentStatusBadgeProps) {
  // Lógica para determinar o status correto
  let finalStatus = status
  let finalLabel = status

  // Se é draft mas não requer aprovação, mostrar como "Sem aprovação"
  if (status === 'draft' && !approvalRequired) {
    finalStatus = 'no_approval'
  }

  const config = statusConfig[finalStatus as keyof typeof statusConfig] || statusConfig.no_approval
  
  return (
    <Badge 
      variant="outline"
      className={cn(
        config.className,
        sizeClasses[size],
        "font-medium border transition-colors",
        className
      )}
    >
      {config.label}
    </Badge>
  )
}

// Função utilitária para obter as classes de cor de um status (para uso em outros componentes)
export function getStatusColorClasses(status: string, approvalRequired: boolean = true) {
  let finalStatus = status
  
  if (status === 'draft' && !approvalRequired) {
    finalStatus = 'no_approval'
  }
  
  const config = statusConfig[finalStatus as keyof typeof statusConfig] || statusConfig.no_approval
  return config.className
}

// Função utilitária para obter o label de um status
export function getStatusLabel(status: string, approvalRequired: boolean = true) {
  let finalStatus = status
  
  if (status === 'draft' && !approvalRequired) {
    finalStatus = 'no_approval'
  }
  
  const config = statusConfig[finalStatus as keyof typeof statusConfig] || statusConfig.no_approval
  return config.label
}