"use client"

import { useEffect } from "react"

export default function SupportPage() {
  useEffect(() => {
    // Redirecionar automaticamente para a página externa de suporte
    window.location.href = "https://www.trackdoc.com.br/suporte"
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecionando para o suporte...</p>
        <p className="text-sm text-gray-500 mt-2">
          Se não for redirecionado automaticamente, 
          <a 
            href="https://www.trackdoc.com.br/suporte" 
            className="text-blue-600 hover:underline ml-1"
            target="_blank" 
            rel="noopener noreferrer"
          >
            clique aqui
          </a>
        </p>
      </div>
    </div>
  )
}