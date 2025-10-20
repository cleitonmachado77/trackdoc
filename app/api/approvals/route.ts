import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scope = searchParams.get('scope') || 'all'

    // Retornar resposta vazia mas válida
    // Como vocês não usam mais o sistema de workflows/aprovações,
    // esta API retorna dados vazios para não quebrar o frontend
    return NextResponse.json({
      success: true,
      processes: [],
      total: 0,
      message: `Sistema de aprovações desabilitado`
    })

  } catch (error) {
    console.error('Erro na API de aprovações:', error)
    return NextResponse.json({
      success: true,
      processes: [],
      total: 0,
      message: 'Sistema de aprovações indisponível'
    })
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    message: 'Sistema de aprovações desabilitado'
  }, { status: 501 })
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({
    success: false,
    message: 'Sistema de aprovações desabilitado'
  }, { status: 501 })
}