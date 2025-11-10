#!/usr/bin/env node

/**
 * Script para testar performance da aplicação
 * Mede tempo de carregamento e verifica cache
 */

const https = require('https');
const http = require('http');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(url, description) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const protocol = url.startsWith('https') ? https : http;
    
    log(`\n🔍 Testando: ${description}`, 'blue');
    log(`   URL: ${url}`, 'blue');
    
    const req = protocol.get(url, (res) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const cacheControl = res.headers['cache-control'] || 'none';
        
        log(`   Status: ${res.statusCode}`, res.statusCode === 200 ? 'green' : 'red');
        log(`   Tempo: ${duration}ms`, duration < 1000 ? 'green' : duration < 3000 ? 'yellow' : 'red');
        log(`   Cache: ${cacheControl}`, cacheControl.includes('max-age') ? 'green' : 'yellow');
        
        resolve({
          url,
          description,
          status: res.statusCode,
          duration,
          cacheControl,
          success: res.statusCode === 200 && duration < 5000
        });
      });
    });
    
    req.on('error', (error) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      log(`   ❌ Erro: ${error.message}`, 'red');
      log(`   Tempo: ${duration}ms`, 'red');
      
      resolve({
        url,
        description,
        status: 0,
        duration,
        error: error.message,
        success: false
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      log(`   ⏱️ Timeout (>10s)`, 'red');
      resolve({
        url,
        description,
        status: 0,
        duration: 10000,
        error: 'Timeout',
        success: false
      });
    });
  });
}

async function runTests() {
  log('\n🚀 Iniciando testes de performance...', 'blue');
  log('=' .repeat(60), 'blue');
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  const tests = [
    { url: `${baseUrl}/`, description: 'Página inicial' },
    { url: `${baseUrl}/api/health`, description: 'Health check' },
    { url: `${baseUrl}/login`, description: 'Página de login' },
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await testEndpoint(test.url, test.description);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500)); // Delay entre testes
  }
  
  // Resumo
  log('\n' + '='.repeat(60), 'blue');
  log('📊 RESUMO DOS TESTES', 'blue');
  log('='.repeat(60), 'blue');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgDuration = Math.round(results.reduce((sum, r) => sum + r.duration, 0) / results.length);
  
  log(`\n✅ Sucessos: ${successful}/${results.length}`, successful === results.length ? 'green' : 'yellow');
  log(`❌ Falhas: ${failed}/${results.length}`, failed === 0 ? 'green' : 'red');
  log(`⏱️  Tempo médio: ${avgDuration}ms`, avgDuration < 1000 ? 'green' : avgDuration < 3000 ? 'yellow' : 'red');
  
  // Recomendações
  log('\n💡 RECOMENDAÇÕES:', 'blue');
  
  if (avgDuration > 3000) {
    log('   ⚠️  Tempo de resposta alto. Considere:', 'yellow');
    log('      - Verificar conexão com Supabase', 'yellow');
    log('      - Otimizar queries do banco', 'yellow');
    log('      - Implementar mais cache', 'yellow');
  } else if (avgDuration > 1000) {
    log('   ✅ Performance aceitável, mas pode melhorar:', 'yellow');
    log('      - Implementar service worker', 'yellow');
    log('      - Lazy loading de componentes', 'yellow');
  } else {
    log('   ✅ Performance excelente!', 'green');
  }
  
  const withoutCache = results.filter(r => !r.cacheControl || r.cacheControl === 'none' || r.cacheControl.includes('no-store'));
  if (withoutCache.length > 0) {
    log('\n   ⚠️  Endpoints sem cache adequado:', 'yellow');
    withoutCache.forEach(r => {
      log(`      - ${r.description}: ${r.cacheControl}`, 'yellow');
    });
  }
  
  log('\n' + '='.repeat(60), 'blue');
  
  process.exit(failed > 0 ? 1 : 0);
}

// Executar testes
runTests().catch(error => {
  log(`\n❌ Erro ao executar testes: ${error.message}`, 'red');
  process.exit(1);
});
