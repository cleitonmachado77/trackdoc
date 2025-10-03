#!/usr/bin/env node

const http = require('http');
const { performance } = require('perf_hooks');

console.log('🚀 Testando performance das APIs...');

const testEndpoints = [
  '/api/health',
  '/api/chat/conversations',
  '/api/plans',
  '/api/signed-documents'
];

async function testEndpoint(endpoint) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    
    const req = http.get(`http://127.0.0.1:3000${endpoint}`, (res) => {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      resolve({
        endpoint,
        status: res.statusCode,
        duration: `${duration}ms`,
        success: res.statusCode < 400
      });
    });
    
    req.on('error', (error) => {
      reject({
        endpoint,
        error: error.message,
        success: false
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject({
        endpoint,
        error: 'Timeout',
        success: false
      });
    });
  });
}

async function runTests() {
  console.log('📊 Iniciando testes de performance...\n');
  
  const results = [];
  
  for (const endpoint of testEndpoints) {
    try {
      const result = await testEndpoint(endpoint);
      results.push(result);
      
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${endpoint}: ${result.duration} (${result.status})`);
    } catch (error) {
      results.push(error);
      console.log(`❌ ${endpoint}: ${error.error}`);
    }
  }
  
  console.log('\n📈 Resumo dos Testes:');
  console.log('====================');
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  const avgDuration = results
    .filter(r => r.duration)
    .reduce((sum, r) => sum + parseInt(r.duration), 0) / successful;
  
  console.log(`✅ Sucessos: ${successful}/${total}`);
  console.log(`⏱️  Duração média: ${Math.round(avgDuration)}ms`);
  console.log(`🚀 Performance: ${avgDuration < 1000 ? 'Excelente' : avgDuration < 2000 ? 'Boa' : 'Necessita otimização'}`);
  
  if (successful === total) {
    console.log('\n🎉 Todas as APIs estão respondendo rapidamente!');
  } else {
    console.log('\n⚠️  Algumas APIs precisam de atenção.');
  }
}

// Aguardar o servidor estar pronto
setTimeout(runTests, 2000);
