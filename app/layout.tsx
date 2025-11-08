import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { SimpleAuthProvider } from "./components/simple-auth-context"
import { AuthWrapper } from "./components/auth-wrapper"
import { ErrorBoundary } from "./components/error-boundary"
import { ErrorHandlerSetup } from "./components/error-handler-setup"
import { ThemeProvider } from "@/components/theme-provider"
import { PreloadGuard } from "./components/preload-guard"
import { Toaster } from "@/components/ui/toaster"


export const metadata: Metadata = {
  title: "Trackdoc I Gestão de Documentos",
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
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          <ErrorHandlerSetup />
          <ErrorBoundary>
            <SimpleAuthProvider>
              <PreloadGuard>
                <AuthWrapper>
                  {children}
                </AuthWrapper>
              </PreloadGuard>
            </SimpleAuthProvider>
          </ErrorBoundary>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}

// Forçar renderização dinâmica globalmente
// Otimização: Remover force-dynamic desnecessário que causa lentidão
// export const dynamic = 'force-dynamic'
// export const revalidate = 0
