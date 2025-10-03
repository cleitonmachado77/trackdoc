#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Otimizando ambiente de desenvolvimento...');

// Configurar variáveis de ambiente para performance
const envConfig = `
# ✅ Configurações de Desenvolvimento Otimizadas
NODE_ENV=development

# ✅ Next.js Performance
NEXT_TELEMETRY_DISABLED=1
NEXT_PRIVATE_STANDALONE=false

# ✅ TypeScript Performance
TSC_NONPOLLING_WATCHER=true
TS_NODE_TRANSPILE_ONLY=true

# ✅ Webpack Performance
WEBPACK_CACHE=true
WEBPACK_PARALLEL=true

# ✅ Node.js Performance
NODE_OPTIONS="--max-old-space-size=4096 --max-semi-space-size=128"

# ✅ Development Flags
NEXT_DEV_FAST_REFRESH=true
NEXT_DEV_TURBO=true

# ✅ Cache Configuration
NEXT_CACHE_DIR=.next/cache
NEXT_TYPES_DIR=.next/types
`;

try {
  // Criar diretórios de cache se não existirem
  const cacheDir = path.join(process.cwd(), '.next', 'cache');
  const typesDir = path.join(process.cwd(), '.next', 'types');
  
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
    console.log('✅ Diretório de cache criado:', cacheDir);
  }
  
  if (!fs.existsSync(typesDir)) {
    fs.mkdirSync(typesDir, { recursive: true });
    console.log('✅ Diretório de tipos criado:', typesDir);
  }

  // Configurar cache do TypeScript
  const tsBuildInfo = path.join(cacheDir, 'tsconfig.tsbuildinfo');
  if (!fs.existsSync(tsBuildInfo)) {
    fs.writeFileSync(tsBuildInfo, '{}');
    console.log('✅ Arquivo de build info do TypeScript criado');
  }

  // Configurar cache do webpack
  const webpackCache = path.join(cacheDir, 'webpack');
  if (!fs.existsSync(webpackCache)) {
    fs.mkdirSync(webpackCache, { recursive: true });
    console.log('✅ Cache do webpack configurado');
  }

  console.log('✅ Otimização concluída!');
  console.log('💡 Use: npm run dev:fast para desenvolvimento otimizado');
  
} catch (error) {
  console.error('❌ Erro na otimização:', error.message);
  process.exit(1);
}
