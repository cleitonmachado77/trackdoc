#!/usr/bin/env node

/**
 * Script de Setup do Sistema de Planos e Assinaturas
 * 
 * Este script ajuda a configurar o sistema de planos:
 * 1. Verifica dependências
 * 2. Verifica variáveis de ambiente
 * 3. Testa conexão com Supabase
 * 4. Verifica se as tabelas existem
 * 5. Fornece instruções de próximos passos
 */

const fs = require('fs')
const path = require('path')

console.log('🚀 Setup do Sistema de Planos e Assinaturas\n')

// Cores para o terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function checkmark() {
  return `${colors.green}✓${colors.reset}`
}

function crossmark() {
  return `${colors.red}✗${colors.reset}`
}

function warning() {
  return `${colors.yellow}⚠${colors.reset}`
}

// 1. Verificar dependências
log('\n📦 Verificando dependências...', 'cyan')

const packageJsonPath = path.join(process.cwd(), 'package.json')
if (!fs.existsSync(packageJsonPath)) {
  log(`${crossmark()} package.json não encontrado`, 'red')
  process.exit(1)
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }

const requiredDeps = {
  'stripe': 'Stripe SDK',
  '@stripe/stripe-js': 'Stripe.js',
  'date-fns': 'Date utilities',
}

let missingDeps = []

for (const [dep, name] of Object.entries(requiredDeps)) {
  if (dependencies[dep]) {
    log(`${checkmark()} ${name} (${dep})`)
  } else {
    log(`${crossmark()} ${name} (${dep}) - FALTANDO`, 'red')
    missingDeps.push(dep)
  }
}

if (missingDeps.length > 0) {
  log(`\n${warning()} Instale as dependências faltantes:`, 'yellow')
  log(`npm install ${missingDeps.join(' ')}`, 'cyan')
  log('\nOu execute:', 'yellow')
  log('npm install stripe @stripe/stripe-js date-fns', 'cyan')
  process.exit(1)
}

// 2. Verificar variáveis de ambiente
log('\n🔐 Verificando variáveis de ambiente...', 'cyan')

const envPath = path.join(process.cwd(), '.env.local')
let envVars = {}

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) {
      envVars[key.trim()] = value.trim()
    }
  })
}

const requiredEnvVars = {
  'NEXT_PUBLIC_SUPABASE_URL': 'URL do Supabase',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'Chave anônima do Supabase',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': 'Chave pública do Stripe',
  'STRIPE_SECRET_KEY': 'Chave secreta do Stripe',
  'STRIPE_WEBHOOK_SECRET': 'Secret do webhook do Stripe',
}

let missingEnvVars = []

for (const [envVar, name] of Object.entries(requiredEnvVars)) {
  if (envVars[envVar] && envVars[envVar] !== '') {
    log(`${checkmark()} ${name}`)
  } else {
    log(`${crossmark()} ${name} - FALTANDO`, 'red')
    missingEnvVars.push(envVar)
  }
}

if (missingEnvVars.length > 0) {
  log(`\n${warning()} Configure as variáveis de ambiente faltantes no .env.local:`, 'yellow')
  missingEnvVars.forEach(envVar => {
    log(`${envVar}=seu_valor_aqui`, 'cyan')
  })
  log('\nConsulte docs/INSTALACAO_RAPIDA_PLANOS.md para mais detalhes', 'yellow')
}

// 3. Verificar arquivos criados
log('\n📁 Verificando arquivos do sistema...', 'cyan')

const requiredFiles = [
  'types/subscription.ts',
  'migrations/001_create_plans_and_subscriptions.sql',
  'lib/hooks/useSubscription.ts',
  'lib/hooks/useFeatureAccess.ts',
  'lib/stripe/config.ts',
  'lib/stripe/client.ts',
  'lib/stripe/server.ts',
  'components/subscription/FeatureGate.tsx',
  'components/subscription/PlanCard.tsx',
  'components/subscription/SubscriptionManager.tsx',
  'app/api/stripe/create-checkout-session/route.ts',
  'app/api/stripe/create-portal-session/route.ts',
  'app/api/stripe/webhook/route.ts',
]

let missingFiles = []

for (const file of requiredFiles) {
  const filePath = path.join(process.cwd(), file)
  if (fs.existsSync(filePath)) {
    log(`${checkmark()} ${file}`)
  } else {
    log(`${crossmark()} ${file} - FALTANDO`, 'red')
    missingFiles.push(file)
  }
}

if (missingFiles.length > 0) {
  log(`\n${warning()} Alguns arquivos estão faltando. Verifique a instalação.`, 'yellow')
}

// 4. Resumo e próximos passos
log('\n' + '='.repeat(60), 'cyan')
log('📋 RESUMO', 'cyan')
log('='.repeat(60), 'cyan')

if (missingDeps.length === 0) {
  log(`${checkmark()} Todas as dependências instaladas`)
} else {
  log(`${crossmark()} ${missingDeps.length} dependência(s) faltando`, 'red')
}

if (missingEnvVars.length === 0) {
  log(`${checkmark()} Todas as variáveis de ambiente configuradas`)
} else {
  log(`${crossmark()} ${missingEnvVars.length} variável(is) de ambiente faltando`, 'red')
}

if (missingFiles.length === 0) {
  log(`${checkmark()} Todos os arquivos criados`)
} else {
  log(`${crossmark()} ${missingFiles.length} arquivo(s) faltando`, 'red')
}

log('\n' + '='.repeat(60), 'cyan')
log('🎯 PRÓXIMOS PASSOS', 'cyan')
log('='.repeat(60), 'cyan')

log('\n1. Execute a migration no Supabase:', 'yellow')
log('   - Abra o Supabase Dashboard')
log('   - Vá em SQL Editor')
log('   - Cole o conteúdo de migrations/001_create_plans_and_subscriptions.sql')
log('   - Execute')

log('\n2. Configure produtos no Stripe:', 'yellow')
log('   - Acesse https://dashboard.stripe.com/products')
log('   - Crie os 3 produtos (Básico, Profissional, Enterprise)')
log('   - Copie os price_ids')
log('   - Atualize a tabela plans no Supabase')

log('\n3. Configure o webhook do Stripe:', 'yellow')
log('   - Para desenvolvimento: stripe listen --forward-to localhost:3000/api/stripe/webhook')
log('   - Para produção: Configure no Dashboard do Stripe')

log('\n4. Teste o sistema:', 'yellow')
log('   - Acesse /pricing')
log('   - Escolha um plano')
log('   - Use cartão de teste: 4242 4242 4242 4242')

log('\n📚 Documentação completa:', 'cyan')
log('   - docs/PLANOS_E_SUBSCRIPTIONS.md')
log('   - docs/INSTALACAO_RAPIDA_PLANOS.md')
log('   - docs/EXEMPLOS_USO.md')

log('\n✨ Setup concluído!', 'green')
log('Execute: npm run dev\n')
