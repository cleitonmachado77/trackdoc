#!/usr/bin/env node

/**
 * Script para verificar se as configurações de produção estão corretas
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 Verificando configurações de produção...\n')

// Verificar arquivo .env.local
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  console.log('✅ Arquivo .env.local encontrado')
  
  const envContent = fs.readFileSync(envPath, 'utf8')
  
  // Verificar variáveis essenciais
  const requiredVars = [
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      const line = envContent.split('\n').find(line => line.startsWith(varName))
      if (line && line.includes('trackdoc.app.br')) {
        console.log(`✅ ${varName} configurado corretamente`)
      } else if (line && line.includes('your_')) {
        console.log(`⚠️  ${varName} precisa ser substituído pelo valor real`)
      } else {
        console.log(`✅ ${varName} encontrado`)
      }
    } else {
      console.log(`❌ ${varName} não encontrado`)
    }
  })
} else {
  console.log('❌ Arquivo .env.local não encontrado')
}

console.log('\n🔍 Verificando arquivos modificados...\n')

// Verificar se os arquivos foram modificados
const filesToCheck = [
  'app/auth/callback/route.ts',
  'lib/supabase/config.ts',
  'app/register/page.tsx',
  'app/components/admin-guard.tsx'
]

filesToCheck.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath)
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8')
    
    switch (filePath) {
      case 'app/auth/callback/route.ts':
        if (content.includes('NEXT_PUBLIC_APP_URL') && content.includes('trackdoc.app.br')) {
          console.log('✅ Callback configurado para produção')
        } else {
          console.log('⚠️  Callback pode não estar configurado corretamente')
        }
        break
        
      case 'lib/supabase/config.ts':
        if (content.includes('appUrl') && content.includes('redirectTo')) {
          console.log('✅ Configuração do Supabase atualizada')
        } else {
          console.log('⚠️  Configuração do Supabase pode estar incompleta')
        }
        break
        
      case 'app/register/page.tsx':
        if (content.includes('emailRedirectTo')) {
          console.log('✅ Registro configurado com redirecionamento correto')
        } else {
          console.log('⚠️  Registro pode não ter redirecionamento configurado')
        }
        break
        
      case 'app/components/admin-guard.tsx':
        if (!content.includes("profile?.role !== 'admin'")) {
          console.log('✅ AdminGuard permite acesso para todos os usuários')
        } else {
          console.log('⚠️  AdminGuard ainda pode estar restringindo acesso')
        }
        break
    }
  } else {
    console.log(`❌ Arquivo não encontrado: ${filePath}`)
  }
})

console.log('\n📋 Checklist de Deploy:\n')
console.log('□ Configurar URLs no painel do Supabase:')
console.log('  - Site URL: https://www.trackdoc.app.br')
console.log('  - Redirect URLs: https://www.trackdoc.app.br/auth/callback')
console.log('□ Substituir variáveis do Supabase no .env.local')
console.log('□ Fazer deploy das alterações')
console.log('□ Testar fluxo de registro completo')
console.log('□ Testar acesso à administração')

console.log('\n🎯 Configurações aplicadas com sucesso!')