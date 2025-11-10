import { LucideIcon } from "lucide-react"

interface PageHeaderProps {
  title: string
  icon?: LucideIcon
}

export function PageHeader({ title, icon: Icon }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-end mb-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {Icon && <Icon className="h-4 w-4" />}
        <span className="font-medium">{title}</span>
      </div>
    </div>
  )
}
