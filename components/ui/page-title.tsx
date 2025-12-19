import { cn } from "@/lib/utils"

interface PageTitleProps {
  title: string
  subtitle?: string
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
  centered?: boolean
  children?: React.ReactNode
}

const sizeClasses = {
  sm: "text-2xl",
  md: "text-3xl", // Padrão baseado na biblioteca
  lg: "text-4xl",
  xl: "text-5xl"
}

export function PageTitle({ 
  title, 
  subtitle, 
  className, 
  size = "md", 
  centered = false,
  children 
}: PageTitleProps) {
  const containerClasses = cn(
    "space-y-1",
    centered && "text-center",
    className
  )

  const titleClasses = cn(
    sizeClasses[size],
    "font-bold text-trackdoc-black dark:text-foreground"
  )

  const subtitleClasses = cn(
    "text-trackdoc-gray dark:text-muted-foreground",
    centered ? "text-lg" : "text-base"
  )

  if (children) {
    return (
      <div className={cn("flex items-center justify-between", className)}>
        <div className="space-y-1">
          <h1 className={titleClasses}>{title}</h1>
          {subtitle && (
            <p className={subtitleClasses}>{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className={containerClasses}>
      <h1 className={titleClasses}>{title}</h1>
      {subtitle && (
        <p className={subtitleClasses}>{subtitle}</p>
      )}
    </div>
  )
}