"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Eye,
  EyeOff,
  Shield,
  Users,
  Building2,
  Lock
} from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface DocumentVisibilityBadgeProps {
  documentId: string
  isPublic: boolean
  authorId: string
  currentUserId?: string
  className?: string
}

export default function DocumentVisibilityBadge({
  documentId,
  isPublic,
  authorId,
  currentUserId,
  className = ""
}: DocumentVisibilityBadgeProps) {
  const [permissions, setPermissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const { data, error } = await supabase
          .from('document_permissions')
          .select(`
            *,
            department:departments(name),
            user:profiles!document_permissions_user_id_fkey(full_name)
          `)
          .eq('document_id', documentId)

        if (error) throw error

        setPermissions(data || [])
      } catch (error) {
        console.error('Erro ao buscar permissões do documento:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [documentId])

  if (loading) {
    return (
      <Badge variant="outline" className={`text-xs ${className}`}>
        <Shield className="h-3 w-3 mr-1" />
        Carregando...
      </Badge>
    )
  }

  // Se é público
  if (isPublic) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="secondary" className={`text-xs bg-green-50 text-green-700 border-green-200 ${className}`}>
              <Eye className="h-3 w-3 mr-1" />
              Público
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Todos os usuários da organização podem ver este documento</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Se não há permissões específicas, é privado
  if (permissions.length === 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className={`text-xs bg-gray-50 text-gray-700 border-gray-200 ${className}`}>
              <EyeOff className="h-3 w-3 mr-1" />
              Privado
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Apenas o autor pode ver este documento</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Se há permissões específicas, é restrito
  const departmentPermissions = permissions.filter(p => p.department_id)
  const userPermissions = permissions.filter(p => p.user_id)

  const tooltipContent = (
    <div className="space-y-2">
      <p className="font-medium">Acesso restrito a:</p>
      {departmentPermissions.length > 0 && (
        <div>
          <p className="text-xs font-medium">Departamentos:</p>
          <ul className="text-xs">
            {departmentPermissions.map(p => (
              <li key={p.id}>• {p.department?.name}</li>
            ))}
          </ul>
        </div>
      )}
      {userPermissions.length > 0 && (
        <div>
          <p className="text-xs font-medium">Usuários:</p>
          <ul className="text-xs">
            {userPermissions.map(p => (
              <li key={p.id}>• {p.user?.full_name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline" className={`text-xs bg-blue-50 text-blue-700 border-blue-200 ${className}`}>
            <Shield className="h-3 w-3 mr-1" />
            Restrito
            {departmentPermissions.length > 0 && (
              <Building2 className="h-3 w-3 ml-1" />
            )}
            {userPermissions.length > 0 && (
              <Users className="h-3 w-3 ml-1" />
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}