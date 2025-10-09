/**
 * Proxy para redirecionar chamadas do Supabase através do servidor Next.js
 * Isso contorna problemas de proxy/firewall corporativo
 */

import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxyRequest(request, params.path, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxyRequest(request, params.path, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxyRequest(request, params.path, 'PUT')
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxyRequest(request, params.path, 'PATCH')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxyRequest(request, params.path, 'DELETE')
}

async function handleProxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: 'Supabase não configurado' },
        { status: 500 }
      )
    }

    // Construir URL do Supabase
    const path = pathSegments.join('/')
    const supabaseUrl = `${SUPABASE_URL}/${path}`
    
    // Obter query parameters
    const url = new URL(request.url)
    const searchParams = url.searchParams.toString()
    const finalUrl = searchParams ? `${supabaseUrl}?${searchParams}` : supabaseUrl

    console.log(`🔄 Proxy ${method}:`, finalUrl)

    // Preparar headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    }

    // Copiar headers importantes do request original
    const authHeader = request.headers.get('Authorization')
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const contentType = request.headers.get('Content-Type')
    if (contentType) {
      headers['Content-Type'] = contentType
    }

    // Preparar body para métodos que precisam
    let body: string | undefined
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const requestBody = await request.text()
        body = requestBody
      } catch (error) {
        console.error('Erro ao ler body:', error)
      }
    }

    // Fazer a requisição para o Supabase
    const response = await fetch(finalUrl, {
      method,
      headers,
      body,
    })

    // Obter resposta
    const responseText = await response.text()
    let responseData

    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = responseText
    }

    // Retornar resposta com os mesmos headers e status
    const responseHeaders = new Headers()
    
    // Copiar headers importantes da resposta
    response.headers.forEach((value, key) => {
      if (
        key.toLowerCase() !== 'content-encoding' &&
        key.toLowerCase() !== 'content-length' &&
        key.toLowerCase() !== 'transfer-encoding'
      ) {
        responseHeaders.set(key, value)
      }
    })

    return new NextResponse(JSON.stringify(responseData), {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })

  } catch (error) {
    console.error('Erro no proxy Supabase:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro no proxy do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}