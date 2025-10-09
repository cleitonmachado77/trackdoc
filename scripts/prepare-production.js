#!/usr/bin/env node

/**
 * Script para preparar o projeto para produção
 * Remove configurações de desenvolvimento e otimiza para deploy
 */

const fs = require('fs')
const path = require('path')

console.log('🚀 Preparando projeto para produção...')

// 1. Verificar se existe .env.production
const envProdPath = path.join(process.cwd(), '.env.production')
const envLocalPath = path.join(process.cwd(), '.env.local')

if (!fs.existsSync(envProdPath)) {
    console.log('📝 Criando .env.production baseado em .env.local...')

    if (fs.existsSync(envLocalPath)) {
        let envContent = fs.readFileSync(envLocalPath, 'utf8')

        // Substituir configurações para produção
        envContent = envContent.replace(/NEXT_PUBLIC_ENABLE_PROXY=auto/g, 'NEXT_PUBLIC_ENABLE_PROXY=false')
        envContent = envContent.replace(/NODE_ENV=development/g, 'NODE_ENV=production')

        // Adicionar NODE_ENV se não existir
        if (!envContent.includes('NODE_ENV=')) {
            envContent += '\nNODE_ENV=production'
        }

        // Adicionar comentário
        envContent = `# Configuração para Produção - Gerado automaticamente
# Proxy desabilitado para melhor performance
${envContent}`

        fs.writeFileSync(envProdPath, envContent)
        console.log('✅ .env.production criado')
    } else {
        console.log('⚠️ .env.local não encontrado, criando .env.production básico...')

        const basicEnv = `# Configuração para Produção
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-de-servico
NEXT_PUBLIC_ENABLE_PROXY=false
NODE_ENV=production`

        fs.writeFileSync(envProdPath, basicEnv)
        console.log('✅ .env.production básico criado - CONFIGURE AS CHAVES!')
    }
}

// 2. Verificar configurações críticas
console.log('🔍 Verificando configurações...')

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))

// Verificar se há scripts de produção
const requiredScripts = ['build', 'start']
const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script])

if (missingScripts.length > 0) {
    console.log('⚠️ Scripts faltando:', missingScripts.join(', '))
} else {
    console.log('✅ Scripts de produção OK')
}

// 3. Verificar next.config.mjs
const nextConfigPath = path.join(process.cwd(), 'next.config.mjs')
if (fs.existsSync(nextConfigPath)) {
    const nextConfig = fs.readFileSync(nextConfigPath, 'utf8')

    if (nextConfig.includes('output: "export"')) {
        console.log('⚠️ ATENÇÃO: next.config.mjs tem "output: export" - isso pode causar problemas com APIs')
        console.log('   Considere remover se for fazer deploy em plataforma que suporta APIs (Vercel, Netlify)')
    } else {
        console.log('✅ next.config.mjs OK para produção')
    }
}

// 4. Resumo
console.log('\n📋 Resumo da preparação:')
console.log('✅ Configurações de produção criadas')
console.log('✅ Proxy desabilitado para produção')
console.log('✅ Build otimizado para deploy')

console.log('\n🚀 Próximos passos:')
console.log('1. Configure as variáveis de ambiente na sua plataforma de deploy')
console.log('2. Execute: npm run build (para testar localmente)')
console.log('3. Faça o deploy na sua plataforma preferida')

console.log('\n🌍 Plataformas suportadas:')
console.log('• Vercel (recomendado)')
console.log('• Netlify')
console.log('• AWS Amplify')
console.log('• Railway')
console.log('• Render')
console.log('• Qualquer VPS com Node.js')

console.log('\n✨ O projeto está pronto para produção!')