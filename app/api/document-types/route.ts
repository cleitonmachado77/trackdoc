import { NextRequest, NextResponse } from 'next/server'
import { createDocumentType, getDocumentTypes } from '@/app/admin/actions'

export async function GET() {
  try {
    const documentTypes = await getDocumentTypes()
    return NextResponse.json({ success: true, data: documentTypes })
  } catch (error) {
    console.error('Erro ao buscar tipos de documento:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const result = await createDocumentType(data)
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error) {
    console.error('Erro ao criar tipo de documento:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}