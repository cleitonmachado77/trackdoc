/**
 * Script de instalação da funcionalidade Biblioteca Pública
 * 
 * Este script configura a tabela e políticas necessárias no Supabase
 * para a funcionalidade de Biblioteca Pública.
 * 
 * Uso: node scripts/setup-biblioteca-publica.js
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando configuração da Biblioteca Pública...\n');

// Ler o arquivo SQL
const sqlFilePath = path.join(__dirname, '..', 'sql', 'create_public_library.sql');

try {
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
  
  console.log('✅ Arquivo SQL carregado com sucesso!\n');
  console.log('📋 Próximos passos:\n');
  console.log('1. Acesse o Supabase Dashboard: https://app.supabase.com');
  console.log('2. Selecione seu projeto');
  console.log('3. Vá para "SQL Editor"');
  console.log('4. Clique em "New Query"');
  console.log('5. Cole o conteúdo do arquivo: sql/create_public_library.sql');
  console.log('6. Execute a query (Ctrl/Cmd + Enter)\n');
  
  console.log('📄 Conteúdo do SQL:\n');
  console.log('─'.repeat(80));
  console.log(sqlContent);
  console.log('─'.repeat(80));
  console.log('\n✨ Após executar o SQL, a funcionalidade estará pronta para uso!\n');
  
  console.log('🔗 Links úteis:');
  console.log('- Documentação: docs/biblioteca-publica.md');
  console.log('- Página de gerenciamento: /biblioteca');
  console.log('- Página pública: /biblioteca-publica/[slug]\n');
  
} catch (error) {
  console.error('❌ Erro ao ler arquivo SQL:', error.message);
  process.exit(1);
}
