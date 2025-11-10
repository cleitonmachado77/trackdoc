import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Biblioteca Pública | TrackDoc",
  description: "Acesse documentos públicos compartilhados",
}

export default function BibliotecaPublicaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
