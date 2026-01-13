import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Slug é obrigatório' },
        { status: 400 }
      )
    }

    console.log('🔍 Buscando categorias para slug:', slug)

    // Verificar se a service role key está configurada
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada')
      return NextResponse.json(
        { error: 'Configuração de service role não encontrada' },
        { status: 500 }
      )
    }

    const serviceRoleSupabase = createClient(
      supabaseConfig.url,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    let entityId: string | null = null
    let userId: string | null = null

    // 1. Primeiro, tentar buscar a entidade diretamente pelo slug
    const { data: entityBySlug, error: entitySlugError } = await serviceRoleSupabase
      .from("entities")
      .select("id")
      .eq("id", slug)
      .single()

    if (!entitySlugError && entityBySlug) {
      entityId = entityBySlug.id
      console.log('✅ Encontrada entidade:', entityId)
    } else {
      // 2. Tentar buscar como usuário solo (slug é user_id)
      const { data: userProfile, error: userError } = await serviceRoleSupabase
        .from("profiles")
        .select("id")
        .eq("id", slug)
        .single()

      if (!userError && userProfile) {
        userId = userProfile.id
        console.log('✅ Encontrado usuário:', userId)
      } else {
        // 3. Tentar buscar pelo public_slug de algum documento
        const { data: firstItem, error: firstError } = await serviceRoleSupabase
          .from("public_library")
          .select("entity_id, created_by")
          .eq("public_slug", slug)
          .eq("is_active", true)
          .limit(1)
          .single()

        if (firstError || !firstItem) {
          console.log('❌ Biblioteca não encontrada para slug:', slug)
          return NextResponse.json(
            { error: 'Biblioteca não encontrada' },
            { status: 404 }
          )
        }

        entityId = firstItem.entity_id
        userId = firstItem.created_by
        console.log('✅ Encontrado via public_library - entityId:', entityId, 'userId:', userId)
      }
    }

    if (!entityId && !userId) {
      return NextResponse.json(
        { error: 'Biblioteca não encontrada' },
        { status: 404 }
      )
    }

    // Buscar categorias usando service role (bypassa RLS)
    let categoriesQuery = serviceRoleSupabase
      .from("library_categories")
      .select("id, name, description, icon, color, display_order")
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    if (entityId) {
      categoriesQuery = categoriesQuery.eq("entity_id", entityId)
    } else if (userId) {
      categoriesQuery = categoriesQuery.eq("created_by", userId)
    }

    const { data: categoriesData, error: categoriesError } = await categoriesQuery
    
    if (categoriesError) {
      console.error('❌ Erro ao buscar categorias:', categoriesError)
      return NextResponse.json(
        { error: 'Erro ao buscar categorias' },
        { status: 500 }
      )
    }

    console.log('✅ Categorias encontradas:', categoriesData?.length || 0)

    return NextResponse.json({
      success: true,
      categories: categoriesData || [],
      debug: {
        entityId,
        userId,
        slug
      }
    })

  } catch (error) {
    console.error('❌ Erro interno na busca de categorias:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}