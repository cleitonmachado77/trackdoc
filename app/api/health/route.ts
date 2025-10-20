import { NextRequest, NextResponse } from 'next/server'
import { checkConnectivity } from '@/lib/network-config'
import { validateSupabaseConfig } from '@/lib/supabase/config'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Iniciando diagnóstico de saúde do sistema...')
    
    const health = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {
        connectivity: false,
        supabaseConfig: false,
        environment: false,
      },
      details: {
        connectivity: 'Verificando conectividade com a internet...',
        supabaseConfig: 'Verificando configuração do Supabase...',
        environment: 'Verificando variáveis de ambiente...',
      }
    }
    
    // Verificar conectividade
    try {
      health.checks.connectivity = await checkConnectivity()
      health.details.connectivity = health.checks.connectivity 
        ? 'Conectividade OK' 
        : 'Sem conectividade com a internet'
    } catch (error) {
      health.details.connectivity = `Erro de conectividade: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }
    
    // Verificar configuração do Supabase
    try {
      health.checks.supabaseConfig = validateSupabaseConfig()
      health.details.supabaseConfig = health.checks.supabaseConfig 
        ? 'Configuração do Supabase OK' 
        : 'Configuração do Supabase incompleta'
    } catch (error) {
      health.details.supabaseConfig = `Erro na configuração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }
    
    // Verificar variáveis de ambiente essenciais
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ]
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])
    
    health.checks.environment = missingEnvVars.length === 0
    health.details.environment = missingEnvVars.length === 0 
      ? 'Variáveis de ambiente OK' 
      : `Variáveis faltando: ${missingEnvVars.join(', ')}`
    
    // Determinar status geral
    const allChecksPass = Object.values(health.checks).every(check => check === true)
    health.status = allChecksPass ? 'healthy' : 'unhealthy'
    
    console.log('✅ Diagnóstico concluído:', health.status)
    
    return NextResponse.json(health, {
      status: allChecksPass ? 200 : 503
    })
    
  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error)
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      checks: {
        connectivity: false,
        supabaseConfig: false,
        environment: false,
      }
    }, { status: 500 })
  }
}
