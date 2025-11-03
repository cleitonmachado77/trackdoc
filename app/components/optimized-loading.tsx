"use client"

import { memo } from "react"
import { Loader2 } from "lucide-react"

interface OptimizedLoadingProps {
  message?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

const OptimizedLoading = memo(function OptimizedLoading({ 
  message = "Carregando...", 
  size = "md",
  className = ""
}: OptimizedLoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  }

  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <div className="flex items-center space-x-3">
        <Loader2 className={`animate-spin text-primary ${sizeClasses[size]}`} />
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
    </div>
  )
})

export default OptimizedLoading