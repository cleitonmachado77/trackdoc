#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando desenvolvimento otimizado para Windows...');

// Configurar variáveis de ambiente para Windows
process.env.NODE_ENV = 'development';
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.TSC_NONPOLLING_WATCHER = 'true';
process.env.TS_NODE_TRANSPILE_ONLY = 'true';
process.env.WEBPACK_CACHE = 'true';
process.env.WEBPACK_PARALLEL = 'true';

// Configurar Node.js para performance
process.env.NODE_OPTIONS = '--max-old-space-size=4096 --max-semi-space-size=128';

console.log('✅ Variáveis de ambiente configuradas');
console.log('🔧 Iniciando Next.js com Turbo...');

// Executar Next.js com Turbo
const nextProcess = spawn('npx', ['next', 'dev', '--turbo', '--port', '3000'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

nextProcess.on('error', (error) => {
  console.error('❌ Erro ao iniciar Next.js:', error.message);
  process.exit(1);
});

nextProcess.on('close', (code) => {
  console.log(`📋 Next.js finalizado com código: ${code}`);
  process.exit(code);
});

// Capturar Ctrl+C para finalizar graciosamente
process.on('SIGINT', () => {
  console.log('\n🛑 Finalizando desenvolvimento...');
  nextProcess.kill('SIGINT');
});
