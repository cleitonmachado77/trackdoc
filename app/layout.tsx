import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { HybridAuthProvider } from "@/lib/contexts/hybrid-auth-context"
import { SimpleAuthProvider } from "./components/simple-auth-context"
import { AuthWrapper } from "./components/auth-wrapper"
import { ErrorBoundary } from "./components/error-boundary"
import { ErrorHandlerSetup } from "./components/error-handler-setup"


export const metadata: Metadata = {
  title: "TrackDoc - Sistema de Gestao de Documentos",
  description: "Plataforma moderna para gestao interna de documentos corporativos",
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Usar autenticação simples em produção para evitar problemas de conectividade
  const isProduction = process.env.NODE_ENV === 'production'
  
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        <ErrorHandlerSetup />
        <ErrorBoundary>
          {isProduction ? (
            <SimpleAuthProvider>
              <AuthWrapper>
                {children}
              </AuthWrapper>
            </SimpleAuthProvider>
          ) : (
            <HybridAuthProvider>
              <AuthWrapper>
                {children}
              </AuthWrapper>
            </HybridAuthProvider>
          )}
        </ErrorBoundary>
      </body>
    </html>
  )
}
