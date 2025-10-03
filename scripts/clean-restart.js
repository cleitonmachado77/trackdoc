const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Limpando cache e reiniciando servidor...');

try {
  // Parar processos Node.js
  console.log('⏹️ Parando processos Node.js...');
  try {
    execSync('taskkill /F /IM node.exe', { stdio: 'ignore' });
  } catch (e) {
    // Ignorar erro se não houver processos para parar
  }

  // Limpar cache
  console.log('🗑️ Limpando cache...');
  const cacheDirs = ['.next', 'node_modules/.cache'];
  
  cacheDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`✅ Removido: ${dir}`);
    }
  });

  // Limpar cache do npm
  console.log('🧽 Limpando cache do npm...');
  execSync('npm cache clean --force', { stdio: 'inherit' });

  console.log('✅ Limpeza concluída!');
  console.log('🚀 Iniciando servidor...');
  
  // Iniciar servidor
  execSync('npm run dev', { stdio: 'inherit' });

} catch (error) {
  console.error('❌ Erro durante a limpeza:', error.message);
  process.exit(1);
}
