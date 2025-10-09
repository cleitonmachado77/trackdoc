import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        // Verificar variáveis de ambiente
        const envCheck = {
            NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            NODE_ENV: process.env.NODE_ENV,
            VERCEL_ENV: process.env.VERCEL_ENV || 'not-vercel'
        }

        // Informações do ambiente
        const environmentInfo = {
            isProduction: process.env.NODE_ENV === 'production',
            isVercel: !!process.env.VERCEL,
            timestamp: new Date().toISOString(),
            userAgent: request.headers.get('user-agent'),
            origin: request.headers.get('origin'),
            host: request.headers.get('host')
        }

        // Tentar criar cliente Supabase básico
        let supabaseTest = null
        try {
            const { createClient } = await import('@supabase/supabase-js')

            if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
                supabaseTest = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                )

                // Teste básico de conectividade
                const { data, error } = await supabaseTest.auth.getSession()

                return NextResponse.json({
                    status: 'success',
                    environment: environmentInfo,
                    envVariables: envCheck,
                    supabaseConnection: {
                        clientCreated: true,
                        sessionCheck: !error,
                        error: error?.message || null
                    },
                    message: 'Debug info collected successfully'
                })
            }
        } catch (supabaseError) {
            return NextResponse.json({
                status: 'error',
                environment: environmentInfo,
                envVariables: envCheck,
                supabaseConnection: {
                    clientCreated: false,
                    error: supabaseError instanceof Error ? supabaseError.message : 'Unknown error'
                },
                message: 'Failed to create Supabase client'
            })
        }

        return NextResponse.json({
            status: 'warning',
            environment: environmentInfo,
            envVariables: envCheck,
            supabaseConnection: {
                clientCreated: false,
                error: 'Missing environment variables'
            },
            message: 'Environment variables not configured'
        })

    } catch (error) {
        return NextResponse.json({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            message: 'Debug endpoint failed'
        }, { status: 500 })
    }
}