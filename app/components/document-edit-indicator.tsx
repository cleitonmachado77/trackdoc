"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Edit } from "lucide-react"

interface DocumentEditIndicatorProps {
  onClick: () => void
  disabled?: boolean
  className?: string
}

export default function DocumentEditIndicator({ 
  onClick, 
  disabled = false, 
  className = "" 
}: DocumentEditIndicatorProps) {
  if (disabled) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
            className={`h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-50 hover:text-blue-600 ${className}`}
          >
            <Edit className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p>Editar informações do documento</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}