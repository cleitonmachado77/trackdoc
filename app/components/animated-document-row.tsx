"use client"

import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"

interface AnimatedDocumentRowProps {
  children: React.ReactNode
  isNew?: boolean
  className?: string
}

export function AnimatedDocumentRow({ children, isNew = false, className }: AnimatedDocumentRowProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 100)
      return () => clearTimeout(timer)
    }

    setIsVisible(true)
  }, [isNew])

  const styles = useMemo<React.CSSProperties>(() => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "translateY(0)" : "translateY(16px)",
    backgroundColor: isNew && isVisible ? "rgba(220, 252, 231, 1)" : "transparent",
    borderLeftColor: isNew && isVisible ? "rgba(34, 197, 94, 1)" : "transparent",
    borderLeftWidth: isNew && isVisible ? 4 : 0,
  }), [isNew, isVisible])

  return (
    <div
      className={cn(
        "border-b border-border rounded-lg transition-all duration-500 ease-out",
        !isNew && "hover:bg-muted/50",
        className
      )}
      style={styles}
    >
      {children}
    </div>
  )
}
