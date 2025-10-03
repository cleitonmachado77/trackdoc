const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando servidor Next.js ultra-rápido...');

// Configurações otimizadas para desenvolvimento
const env = {
  ...process.env,
  NODE_ENV: 'development',
  NODE_OPTIONS: '--max-old-space-size=4096 --inspect',
  NEXT_TELEMETRY_DISABLED: '1', // Desabilita telemetria para performance
  FAST_REFRESH: 'true',
  WATCHPACK_POLLING: 'true',
  CHOKIDAR_USEPOLLING: 'true',
  CHOKIDAR_INTERVAL: '500',
};

// Configurações do processo
const options = {
  cwd: process.cwd(),
  env,
  stdio: 'inherit',
  shell: true,
};

// Iniciar o servidor Next.js
const nextProcess = spawn('npx', ['next', 'dev', '--port', '3000'], options);

// Tratamento de sinais para limpeza
process.on('SIGINT', () => {
  console.log('\n🛑 Parando servidor...');
  nextProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Parando servidor...');
  nextProcess.kill('SIGTERM');
  process.exit(0);
});

// Tratamento de erros
nextProcess.on('error', (error) => {
  console.error('❌ Erro ao iniciar servidor:', error);
  process.exit(1);
});

nextProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Servidor finalizado com código: ${code}`);
    process.exit(code);
  }
});

console.log('✅ Servidor iniciado com otimizações de performance!');
console.log('🌐 Acesse: http://localhost:3000');
console.log('📊 Monitoramento de performance ativado');
