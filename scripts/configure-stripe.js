#!/usr/bin/env node

/**
 * Script para configurar Stripe automaticamente
 * Atualiza o .env.local com as chaves do Stripe
 */

const fs = require('fs')
const path = require('path')

console.log('🔧 Configurando Stripe...\n')

// Chaves do Stripe (obtenha do .env.local)
const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_sua_chave_aqui'
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_sua_chave_aqui'

const envPath = path.join(process.cwd(), '.env.local')
let envContent = ''

// Ler .env.local existente
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8')
  console.log('✓ Arquivo .env.local encontrado')
} else {
  console.log('✓ Criando novo arquivo .env.local')
}

// Função para atualizar ou adicionar variável
function updateOrAddEnvVar(content, key, value) {
  const regex = new RegExp(`^${key}=.*$`, 'm')
  
  if (regex.test(content)) {
    // Atualizar existente
    return content.replace(regex, `${key}=${value}`)
  } else {
    // Adicionar nova
    return content + (content.endsWith('\n') ? '' : '\n') + `${key}=${value}\n`
  }
}

// Atualizar variáveis do Stripe
envContent = updateOrAddEnvVar(envContent, 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', STRIPE_PUBLISHABLE_KEY)
envContent = updateOrAddEnvVar(envContent, 'STRIPE_SECRET_KEY', STRIPE_SECRET_KEY)

// Adicionar STRIPE_WEBHOOK_SECRET se não existir
if (!envContent.includes('STRIPE_WEBHOOK_SECRET')) {
  envContent += 'STRIPE_WEBHOOK_SECRET=whsec_seu_webhook_secret_aqui\n'
}

// Adicionar NEXT_PUBLIC_APP_URL se não existir
if (!envContent.includes('NEXT_PUBLIC_APP_URL')) {
  envContent += 'NEXT_PUBLIC_APP_URL=http://localhost:3000\n'
}

// Salvar arquivo
fs.writeFileSync(envPath, envContent)

console.log('\n✅ Configuração concluída!\n')
console.log('Variáveis configuradas:')
console.log('  ✓ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')
console.log('  ✓ STRIPE_SECRET_KEY')
console.log('  ⚠ STRIPE_WEBHOOK_SECRET (precisa ser configurado)')
console.log('  ✓ NEXT_PUBLIC_APP_URL\n')

console.log('📋 Próximos passos:\n')
console.log('1. Configure o webhook:')
console.log('   Terminal 1: npm run dev')
console.log('   Terminal 2: stripe listen --forward-to localhost:3000/api/stripe/webhook\n')
console.log('2. Copie o webhook secret (whsec_...) e atualize no .env.local\n')
console.log('3. Reinicie a aplicação\n')
console.log('4. Obtenha os Price IDs dos produtos no Stripe Dashboard\n')
console.log('5. Atualize no banco de dados (SQL fornecido na documentação)\n')

console.log('📚 Documentação: CONFIGURACAO_STRIPE_RAPIDA.md\n')
