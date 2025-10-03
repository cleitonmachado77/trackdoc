"use client"

import { useState, memo, useCallback, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { useAuth } from "@/lib/contexts/auth-context"
import { useUserProfile } from "@/hooks/use-database-data"
import { useNotificationCounterSimple } from "@/hooks/use-notification-counter-simple"
import FixedQuickSearchModal from "./fixed-quick-search-modal"
import UnifiedNotificationBell from "./unified-notification-bell"
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
      // {
      //   id: "document-workflow",
      //   label: "Tramitação de Documentos",
      //   icon: Workflow,
      //   badge: null,
      // },
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

    // Adicionar item de administração se for admin
    if (profile?.role === 'admin') {
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
          "bg-white/95 backdrop-blur-sm border-r border-trackdoc-blue-light flex flex-col transition-all duration-300 z-50 h-screen shadow-trackdoc-lg",
          "fixed md:relative",
          isExpanded ? "w-64" : "w-16",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* 🎨 Header - Novo Design */}
        <div className="p-4 border-b border-trackdoc-blue-light bg-gradient-to-r from-white to-trackdoc-blue-light/10">
          <div className="flex items-center justify-between">
            {isExpanded && (
              <div className="flex items-center space-x-3">
                <div 
                  className="flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => window.location.href = '/landing'}
                  title="Ir para página inicial"
                >
                  <img 
                    src="/logo-horizontal-preto.png" 
                    alt="TrackDoc Logo" 
                    className="h-12 w-auto object-contain"
                  />
                </div>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={toggleSidebar} className="hidden md:flex">
              {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback>
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            {isExpanded && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profile?.full_name || "Usuário"}
                </p>
                <p className="text-xs text-gray-500 truncate">{profile?.email || user?.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeView === item.id

              return (
                <Button
                  key={item.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full transition-colors",
                    isExpanded ? "justify-start" : "justify-center",
                    isActive && "bg-blue-50 text-blue-600 border-blue-100",
                  )}
                  onClick={() => {
                    if (item.onClick) {
                      item.onClick()
                    } else {
                      onViewChange(item.id)
                    }
                  }}
                >
                  <Icon className={cn("h-4 w-4", isExpanded && "mr-3")} />
                  {isExpanded && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Button>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          {isExpanded && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Ações Rápidas</h3>
              <div className="space-y-1 p-2 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    className="flex-1 justify-start text-gray-600 hover:text-gray-900 hover:bg-white"
                    onClick={() => setShowQuickSearch(true)}
                  >
                    <Search className="h-4 w-4 mr-3" />
                    Busca Rápida
                  </Button>
                  <UnifiedNotificationBell />
                </div>
                <Button
                  variant={activeView === "help" ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-white",
                    activeView === "help" && "bg-blue-50 text-blue-700 border-blue-200",
                  )}
                  onClick={() => onViewChange("help")}
                >
                  <HelpCircle className="h-4 w-4 mr-3" />
                  Ajuda
                </Button>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-gray-100">
            <Button
              className={cn(
                "w-full text-red-600 hover:text-red-700 hover:bg-red-50",
                isExpanded ? "justify-start" : "justify-center",
              )}
              variant="ghost"
              size="sm"
              onClick={signOut}
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
