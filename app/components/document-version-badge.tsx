"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { History, Clock } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface DocumentVersionBadgeProps {
  documentId: string
  currentVersion: number
  onClick?: () => void
  showTooltip?: boolean
}

interface VersionStats {
  totalVersions: number
  hasOlderVersions: boolean
}

export function DocumentVersionBadge({ 
  documentId, 
  currentVersion, 
  onClick,
  showTooltip = true 
}: DocumentVersionBadgeProps) {
  const [stats, setStats] = useState<VersionStats | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchVersionStats = async () => {
      try {
        setLoading(true)
        
        const { data, error } = await supabase
          .from('document_versions')
          .select('id')
          .eq('document_id', documentId)

        if (error) {
          console.warn('Erro ao buscar estatísticas de versão:', error)
          return
        }

        const totalVersions = (data?.length || 0) + 1 // +1 para a versão atual
        const hasOlderVersions = (data?.length || 0) > 0

        setStats({
          totalVersions,
          hasOlderVersions
        })
      } catch (error) {
        console.warn('Erro ao buscar estatísticas de versão:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVersionStats()
  }, [documentId])

  const badgeContent = (
    <Badge 
      variant="outline" 
      className={`text-xs cursor-pointer transition-colors ${
        stats?.hasOlderVersions 
          ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' 
          : 'bg-gray-50 text-gray-700 border-gray-200'
      }`}
      onClick={onClick}
    >
      <History className="h-3 w-3 mr-1" />
      V{currentVersion}
    </Badge>
  )

  if (!showTooltip || loading || !stats) {
    return badgeContent
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium">Versão {currentVersion}</p>
            {stats.hasOlderVersions ? (
              <p className="text-xs text-muted-foreground">
                {stats.totalVersions} versões disponíveis
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Primeira versão
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Clique para gerenciar versões
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}