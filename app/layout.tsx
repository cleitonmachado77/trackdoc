import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import "./globals"
import { HybridAuthProvider } from "@/lib/contexts/hybrid-auth-context"
import { SimpleAuthProvider } from "./components/simple-auth-context"
import { AuthWrapper } from "./components/auth-wrapper"
import { ErrorBoundary } from "./components/error-boundary"
import { ErrorHandlerSetup } from "./components/error-handler-setup"
import ClientOnly from "./components/client-only"


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
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        <ErrorHandlerSetup />
        <ErrorBoundary>
          <ClientOnly fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          }>
            <SimpleAuthProvider>
              <AuthWrapper>
                {children}
              </AuthWrapper>
            </SimpleAuthProvider>
          </ClientOnly>
        </ErrorBoundary>
      </body>
    </html>
  )
}

// Forçar renderização dinâmica globalmente
export const dynamic = 'force-dynamic'
export const revalidate = 0
