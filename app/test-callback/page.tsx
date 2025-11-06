"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function TestCallbackPage() {
  const searchParams = useSearchParams()
  const [info, setInfo] = useState<any>({})

  useEffect(() => {
    const allParams = {}
    searchParams.forEach((value, key) => {
      // @ts-ignore
      allParams[key] = value
    })
    
    setInfo({
      url: window.location.href,
      origin: window.location.origin,
      pathname: window.location.pathname,
      search: window.location.search,
      params: allParams,
      timestamp: new Date().toISOString()
    })
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Debug - Callback Test</h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Informações da URL:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(info, null, 2)}
          </pre>
        </div>
        
        <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-semibold text-yellow-800">Como testar:</h3>
          <ol className="list-decimal list-inside text-yellow-700 mt-2">
            <li>Acesse: https://www.trackdoc.app.br/test-callback?code=123&confirmed=true</li>
            <li>Verifique se a URL está correta</li>
            <li>Veja se há redirecionamentos inesperados</li>
          </ol>
        </div>
      </div>
    </div>
  )
}