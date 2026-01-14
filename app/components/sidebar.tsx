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
import { useProfile } from "./profile-context"

import FixedQuickSearchModal from "./fixed-quick-search-modal"
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
  const { profile, loading: profileLoading } = useProfile()

  const [isExpanded, setIsExpanded] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [showQuickSearch, setShowQuickSearch] = useState(false)

  // ✅ Perfil com fallback imediato - não espera carregamento
  const displayProfile = useMemo(() => {
    if (profile) {
      console.log('👤 [Sidebar] Usando perfil do contexto:', {
        full_name: profile.full_name,
        avatar_url: profile.avatar_url ? 'Presente' : 'Ausente'
      })
      return profile
    }
    
    // Fallback imediato com dados do user
    if (user) {
      const fallback = {
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
        email: user.email,
        avatar_url: user.user_metadata?.avatar_url || null,
        role: 'user'
      }
      console.log('👤 [Sidebar] Usando fallback do user:', {
        full_name: fallback.full_name,
        avatar_url: fallback.avatar_url ? 'Presente' : 'Ausente'
      })
      return fallback
    }
    
    return null
  }, [profile, user])

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
      {
        id: "electronic-signature",
        label: "Assinatura Eletrônica",
        icon: PenTool,
        badge: null,
      },
      {
        id: "office",
        label: "Office",
        icon: Edit,
        badge: null,
      },
      {
        id: "approvals",
        label: "Aprovações",
        icon: CheckCircle,
        badge: pendingApprovalsCount > 0 ? pendingApprovalsCount.toString() : null,
      },
      {
        id: "biblioteca",
        label: "Biblioteca",
        icon: Workflow,
        badge: null,
      },
      {
        id: "notifications",
        label: "Notificações",
        icon: Bell,
        badge: null, // Badge removido - notificações centralizadas na aba principal
        onClick: () => {
          // Otimização: Remover refresh desnecessário
          onViewChange('notifications')
        }
      },
      {
        id: "chat",
        label: "Chat",
        icon: MessageSquare,
        badge: null,
      },
      // ✅ Administração sempre visível - não espera perfil carregar
      {
        id: "admin",
        label: "Administração",
        icon: Settings,
        badge: null,
      },
    ]

    return baseItems
  }, [pendingApprovalsCount, onViewChange])

  return (
    <>
      {/* Mobile Menu Button - Melhorado para touch */}
      <Button 
        variant="ghost" 
        size="sm" 
        className="fixed top-3 left-3 z-50 md:hidden h-10 w-10 p-0 bg-background/80 backdrop-blur-sm border shadow-sm" 
        onClick={toggleMobileSidebar}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={toggleMobileSidebar} />
      )}

      {/* Sidebar - Melhorado para mobile */}
      <div
        className={cn(
          "bg-sidebar/95 backdrop-blur-sm border-r border-border flex flex-col transition-all duration-300 z-50 h-screen shadow-lg relative",
          "fixed md:relative",
          "w-[280px] sm:w-64", // Largura fixa em mobile para melhor usabilidade
          isExpanded ? "md:w-64" : "md:w-16",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* 🎨 Header - Novo Design - Melhorado para mobile */}
        <div className={cn("border-b border-border bg-gradient-to-r from-sidebar to-sidebar-accent/10", isExpanded || isMobileOpen ? "p-3 md:p-4" : "p-2")}>
          <div className="flex items-center justify-between">
            {(isExpanded || isMobileOpen) ? (
              <div className="flex items-center space-x-3">
                <div
                  className="flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => window.location.href = 'https://www.trackdoc.app.br/'}
                  title="Ir para página inicial"
                >
                  <img
                    src="/logo-horizontal-preto.png"
                    alt="TrackDoc Logo"
                    className="h-10 md:h-12 w-auto object-contain dark:invert"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">
                <div
                  className="flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => window.location.href = 'https://www.trackdoc.app.br/'}
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
            <div className={cn("flex items-center space-x-2", !(isExpanded || isMobileOpen) && "hidden")}>
              <SimpleThemeToggle />
            </div>
          </div>
        </div>

        {/* Botão de toggle mais visível - posicionado em relação ao sidebar inteiro */}
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

        {/* User Profile - ✅ Usa displayProfile com fallback imediato - Melhorado para mobile */}
        <div className={cn("border-b border-border", (isExpanded || isMobileOpen) ? "p-3 md:p-4" : "p-2")}>
          <div 
            className={cn(
              "flex items-center cursor-pointer hover:bg-sidebar-accent rounded-lg p-2 -m-2 transition-colors",
              (isExpanded || isMobileOpen) ? "space-x-3" : "justify-center"
            )}
            onClick={() => {
              onViewChange("minha-conta")
              if (isMobileOpen) setIsMobileOpen(false)
            }}
            title={!(isExpanded || isMobileOpen) ? `${displayProfile?.full_name || "Usuário"} - Clique para acessar Minha Conta` : "Clique para acessar Minha Conta"}
          >
            <Avatar
              className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-accent transition-all flex-shrink-0"
            >
              <AvatarImage src={displayProfile?.avatar_url} />
              <AvatarFallback>
                {displayProfile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            {(isExpanded || isMobileOpen) && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {displayProfile?.full_name || "Usuário"}
                </p>
                <p className="text-xs text-sidebar-foreground/70 truncate">{displayProfile?.email || user?.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation - Melhorado para touch em mobile */}
        <nav className={cn("flex-1 overflow-y-auto", isExpanded ? "p-4" : "p-2", "md:p-4")}>
          <div className="space-y-1 md:space-y-2">
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
                    "min-h-[48px] md:min-h-[44px]", // Altura mínima maior em mobile para touch
                    isExpanded || isMobileOpen ? "justify-start px-3" : "justify-center px-2",
                    !isExpanded && !isMobileOpen && "md:min-h-[44px]",
                    isActive
                      ? "!bg-primary dark:!text-white !text-primary-foreground hover:!bg-primary/90 !border-l-primary-foreground shadow-md focus:!bg-primary dark:focus:!text-white focus:!text-primary-foreground active:!bg-primary dark:active:!text-white focus-visible:!bg-primary dark:focus-visible:!text-white focus-visible:!text-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:border-l-sidebar-accent-foreground/30"
                  )}
                  style={isActive ? {
                    backgroundColor: 'hsl(var(--primary))',
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
                    // Fecha o menu mobile após clicar
                    if (isMobileOpen) {
                      setIsMobileOpen(false)
                    }
                  }}
                  title={!isExpanded && !isMobileOpen ? item.label : undefined}
                >
                  <Icon className={cn("h-5 w-5", (isExpanded || isMobileOpen) && "mr-3")} />
                  {(isExpanded || isMobileOpen) && (
                    <>
                      <span className="flex-1 text-left text-sm md:text-base">{item.label}</span>
                      {item.badge && (
                        <span className="ml-2 text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {/* Badge para sidebar recolhida */}
                  {!isExpanded && !isMobileOpen && item.badge && (
                    <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {item.badge}
                    </div>
                  )}
                </Button>
              )
            })}
          </div>
        </nav>

        {/* Footer - Melhorado para mobile */}
        <div className={cn("border-t border-border flex-shrink-0", (isExpanded || isMobileOpen) ? "p-3 md:p-4" : "p-2")}>
          {(isExpanded || isMobileOpen) ? (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider mb-3">Ações Rápidas</h3>
              <div className="space-y-1 p-2 bg-sidebar-accent rounded-lg border border-border">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar min-h-[44px]"
                  onClick={() => {
                    setShowQuickSearch(true)
                    if (isMobileOpen) setIsMobileOpen(false)
                  }}
                >
                  <Search className="h-4 w-4 mr-3" />
                  Busca Rápida
                </Button>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start transition-all duration-200 border-l-4 border-transparent min-h-[44px]",
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
                    if (isMobileOpen) setIsMobileOpen(false)
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
                className="w-full justify-center text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent min-h-[44px] px-2"
                onClick={() => setShowQuickSearch(true)}
                title="Busca Rápida"
              >
                <Search className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-center transition-all duration-200 border-l-4 border-transparent min-h-[44px] px-2",
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
                "w-full text-destructive hover:text-destructive hover:bg-destructive/10 min-h-[44px]",
                (isExpanded || isMobileOpen) ? "justify-start" : "justify-center",
              )}
              variant="ghost"
              size="sm"
              onClick={() => {
                signOut()
                if (isMobileOpen) setIsMobileOpen(false)
              }}
              title={!(isExpanded || isMobileOpen) ? "Sair" : undefined}
            >
              <LogOut className="h-4 w-4" />
              {(isExpanded || isMobileOpen) && <span className="ml-3">Sair</span>}
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
