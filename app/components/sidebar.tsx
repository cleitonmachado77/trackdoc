"use client"

import { useState, memo, useCallback, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SimpleThemeToggle } from "@/components/ui/theme-toggle"
import {
  FileText,
  LayoutDashboard,
  CheckCircle,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Edit,
  LogOut,
  PenTool,
  Workflow,
  MessageSquare,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from '@/lib/hooks/use-auth-final'
import { useUserProfile } from "@/hooks/use-database-data"
import { useNotificationCounterSimple } from "@/hooks/use-notification-counter-simple"
import FixedQuickSearchModal from "./fixed-quick-search-modal"
import BellNotificationsV2 from "./bell-notifications-v2"
import { createBrowserClient } from "@supabase/ssr"

interface SidebarProps {
  activeView: string
  onViewChange: (view: string) => void
  pendingApprovalsCount: number
}

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const Sidebar = memo(function Sidebar({ activeView, onViewChange, pendingApprovalsCount }: SidebarProps) {
  const { user, signOut } = useAuth()
  const { profile } = useUserProfile(user?.id)
  const { unreadCount: unreadNotificationsCount, refreshCounter } = useNotificationCounterSimple()
  const [isExpanded, setIsExpanded] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [showQuickSearch, setShowQuickSearch] = useState(false)

  const toggleSidebar = useCallback(() => {
    setIsExpanded(!isExpanded)
  }, [isExpanded])

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileOpen(!isMobileOpen)
  }, [isMobileOpen])


  const menuItems = useMemo(() => {
    const baseItems = [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        badge: null,
      },
      {
        id: "documents",
        label: "Documentos",
        icon: FileText,
        badge: null,
      },
      // {
      //   id: "ai-create",
      //   label: "Criar com IA",
      //   icon: Sparkles,
      //   badge: "Novo",
      // },
      {
        id: "electronic-signature",
        label: "Assinatura Eletrônica",
        icon: PenTool,
        badge: null,
      },

      {
        id: "approvals",
        label: "Aprovações",
        icon: CheckCircle,
        badge: pendingApprovalsCount > 0 ? pendingApprovalsCount.toString() : null,
      },
      {
        id: "notifications",
        label: "Notificações",
        icon: Bell,
        badge: unreadNotificationsCount > 0 ? unreadNotificationsCount.toString() : null,
        onClick: () => {
          console.log('🔄 Forçando atualização do contador...')
          refreshCounter()
          onViewChange('notifications')
        }
      },
      {
        id: "chat",
        label: "Chat",
        icon: MessageSquare,
        badge: null,
      },
      {
        id: "minha-conta",
        label: "Minha Conta",
        icon: User,
        badge: null,
      },
    ]

    // ✅ MUDANÇA: Adicionar item de administração para todos os usuários autenticados
    // Isso permite que usuários sem entidade possam criar uma entidade
    if (profile) {
      baseItems.push({
        id: "admin",
        label: "Administração",
        icon: Settings,
        badge: null,
      })
    }

    return baseItems
  }, [pendingApprovalsCount, unreadNotificationsCount, profile?.role, onViewChange])

  return (
    <>
      {/* Mobile Menu Button */}
      <Button variant="ghost" size="sm" className="fixed top-4 left-4 z-50 md:hidden" onClick={toggleMobileSidebar}>
        {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={toggleMobileSidebar} />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "bg-sidebar/95 backdrop-blur-sm border-r border-border flex flex-col transition-all duration-300 z-50 h-screen shadow-lg",
          "fixed md:relative",
          isExpanded ? "w-64" : "w-16",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* 🎨 Header - Novo Design */}
        <div className={cn("border-b border-border bg-gradient-to-r from-sidebar to-sidebar-accent/10", isExpanded ? "p-4" : "p-2")}>
          <div className="flex items-center justify-between">
            {isExpanded ? (
              <div className="flex items-center space-x-3">
                <div
                  className="flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => window.location.href = '/landing'}
                  title="Ir para página inicial"
                >
                  <img
                    src="/logo-horizontal-preto.png"
                    alt="TrackDoc Logo"
                    className="h-12 w-auto object-contain dark:invert"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">
                <div
                  className="flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => window.location.href = '/landing'}
                  title="Ir para página inicial"
                >
                  <img
                    src="/favicon.svg"
                    alt="TrackDoc Logo"
                    className="h-8 w-8 object-contain"
                  />
                </div>
              </div>
            )}
            <div className={cn("flex items-center space-x-2", !isExpanded && "hidden")}>
              <SimpleThemeToggle />
            </div>
            {/* Botão de toggle mais visível */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSidebar}
              className={cn(
                "hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10",
                "bg-background border-2 border-border shadow-md hover:shadow-lg",
                "h-8 w-8 p-0 rounded-full transition-all duration-200",
                "hover:bg-accent hover:border-accent-foreground/20"
              )}
              title={isExpanded ? "Recolher sidebar" : "Expandir sidebar"}
            >
              {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* User Profile */}
        <div className={cn("border-b border-border", isExpanded ? "p-4" : "p-2")}>
          <div className={cn("flex items-center", isExpanded ? "space-x-3" : "justify-center")}>
            <Avatar
              className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-accent transition-all"
              title={!isExpanded ? `${profile?.full_name || "Usuário"} - ${profile?.email || user?.email}` : undefined}
            >
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback>
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            {isExpanded && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {profile?.full_name || "Usuário"}
                </p>
                <p className="text-xs text-sidebar-foreground/70 truncate">{profile?.email || user?.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className={cn("flex-1 overflow-y-auto", isExpanded ? "p-4" : "p-2")}>
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeView === item.id

              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={cn(
                    "w-full transition-all duration-200 relative border-l-4 border-transparent",
                    "focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none",
                    isExpanded ? "justify-start px-3" : "justify-center px-2",
                    !isExpanded && "min-h-[44px]",
                    isActive
                      ? "!bg-primary !text-primary-foreground hover:!bg-primary/90 !border-l-primary-foreground shadow-md focus:!bg-primary focus:!text-primary-foreground active:!bg-primary focus-visible:!bg-primary focus-visible:!text-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:border-l-sidebar-accent-foreground/30"
                  )}
                  style={isActive ? {
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                    borderLeftColor: 'hsl(var(--primary-foreground))'
                  } : {}}
                  onClick={(e) => {
                    // Força o botão a perder o foco imediatamente
                    e.currentTarget.blur()
                    if (item.onClick) {
                      item.onClick()
                    } else {
                      onViewChange(item.id)
                    }
                  }}
                  title={!isExpanded ? item.label : undefined}
                >
                  <Icon className={cn("h-5 w-5", isExpanded && "mr-3")} />
                  {isExpanded && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className="ml-2 text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {/* Badge para sidebar recolhida */}
                  {!isExpanded && item.badge && (
                    <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {item.badge}
                    </div>
                  )}
                </Button>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className={cn("border-t border-border flex-shrink-0", isExpanded ? "p-4" : "p-2")}>
          {isExpanded ? (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider mb-3">Ações Rápidas</h3>
              <div className="space-y-1 p-2 bg-sidebar-accent rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    className="flex-1 justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar"
                    onClick={() => setShowQuickSearch(true)}
                  >
                    <Search className="h-4 w-4 mr-3" />
                    Busca Rápida
                  </Button>
                  <BellNotificationsV2 />
                </div>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start transition-all duration-200 border-l-4 border-transparent",
                    "focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none",
                    activeView === "help"
                      ? "!bg-primary !text-primary-foreground hover:!bg-primary/90 !border-l-primary-foreground shadow-md focus:!bg-primary focus:!text-primary-foreground active:!bg-primary focus-visible:!bg-primary focus-visible:!text-primary-foreground"
                      : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent hover:border-l-sidebar-accent-foreground/30"
                  )}
                  style={activeView === "help" ? {
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                    borderLeftColor: 'hsl(var(--primary-foreground))'
                  } : {}}
                  onClick={(e) => {
                    e.currentTarget.blur()
                    onViewChange("help")
                  }}
                >
                  <HelpCircle className="h-4 w-4 mr-3" />
                  Ajuda
                </Button>
              </div>
            </div>
          ) : (
            <div className="mb-4 space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-center text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => setShowQuickSearch(true)}
                title="Busca Rápida"
              >
                <Search className="h-5 w-5" />
              </Button>
              <div className="flex justify-center">
                <BellNotificationsV2 />
              </div>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-center transition-all duration-200 border-l-4 border-transparent min-h-[44px]",
                  "focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none",
                  activeView === "help"
                    ? "!bg-primary !text-primary-foreground hover:!bg-primary/90 !border-l-primary-foreground shadow-md focus:!bg-primary focus:!text-primary-foreground active:!bg-primary focus-visible:!bg-primary focus-visible:!text-primary-foreground"
                    : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent hover:border-l-sidebar-accent-foreground/30"
                )}
                style={activeView === "help" ? {
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  borderLeftColor: 'hsl(var(--primary-foreground))'
                } : {}}
                onClick={(e) => {
                  e.currentTarget.blur()
                  onViewChange("help")
                }}
                title="Ajuda"
              >
                <HelpCircle className="h-5 w-5" />
              </Button>
            </div>
          )}

          <div className="pt-3 border-t border-border">
            <Button
              className={cn(
                "w-full text-destructive hover:text-destructive hover:bg-destructive/10",
                isExpanded ? "justify-start" : "justify-center",
              )}
              variant="ghost"
              size="sm"
              onClick={signOut}
              title={!isExpanded ? "Sair" : undefined}
            >
              <LogOut className="h-4 w-4" />
              {isExpanded && <span className="ml-3">Sair</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* Fixed Quick Search Modal */}
      <FixedQuickSearchModal
        open={showQuickSearch}
        onOpenChange={setShowQuickSearch}
      />
    </>
  )
})

export default Sidebar
