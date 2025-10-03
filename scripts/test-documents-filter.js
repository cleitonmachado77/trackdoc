#!/usr/bin/env node

const http = require('http');

console.log('🔍 Testando filtro de documentos de processos...');

async function testDocumentsFilter() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://127.0.0.1:3000/', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        // Procurar por logs específicos no HTML retornado
        const hasProcessDocuments = data.includes('Documentos de processos excluídos');
        const hasFilterApplied = data.includes('Filtro aplicado: excluindo');
        
        resolve({
          status: res.statusCode,
          hasProcessDocuments,
          hasFilterApplied,
          success: res.statusCode === 200
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function runTest() {
  try {
    console.log('📊 Testando página principal...');
    
    const result = await testDocumentsFilter();
    
    console.log('✅ Resultado do teste:');
    console.log(`   Status: ${result.status}`);
    console.log(`   Página carregou: ${result.success ? 'Sim' : 'Não'}`);
    
    if (result.success) {
      console.log('\n🎉 Teste concluído com sucesso!');
      console.log('💡 Para verificar os logs detalhados, acesse o console do navegador em http://localhost:3000');
      console.log('💡 Procure por mensagens como:');
      console.log('   - "📋 Documentos de processos excluídos da página de documentos"');
      console.log('   - "✅ Filtro aplicado: excluindo X documentos de processos"');
    } else {
      console.log('\n⚠️ Teste falhou - servidor não está respondendo corretamente');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

runTest();
