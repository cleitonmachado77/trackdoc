"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface LogoutButtonProps {
  className?: string
  variant?: "default" | "ghost" | "outline"
  size?: "default" | "sm" | "lg"
  showIcon?: boolean
  showText?: boolean
}

export default function LogoutButton({
  className = "",
  variant = "ghost",
  size = "sm",
  showIcon = true,
  showText = true,
}: LogoutButtonProps) {
  const router = useRouter()

  const handleLogout = () => {
    // Limpar dados de autenticação
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("userName")
    localStorage.removeItem("userRole")
    localStorage.removeItem("rememberMe")

    // Redirecionar para a página de login externa
    window.location.href = "https://www.trackdoc.app.br/login/"
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          {showIcon && <LogOut className="h-4 w-4" />}
          {showText && showIcon && <span className="ml-2">Sair</span>}
          {showText && !showIcon && "Sair"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Logout</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja sair do sistema? Você precisará fazer login novamente para acessar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
            Sair
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
