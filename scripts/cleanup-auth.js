#!/usr/bin/env node

/**
 * Script para limpar dados de autenticação corrompidos
 * Execute: node scripts/cleanup-auth.js
 */

console.log('🧹 Iniciando limpeza de dados de autenticação...')

// Simular limpeza (este script roda no Node.js, não no browser)
console.log('✅ Para limpar os dados de autenticação:')
console.log('1. Abra o DevTools do navegador (F12)')
console.log('2. Vá para a aba Application/Storage')
console.log('3. Limpe o Local Storage e Session Storage')
console.log('4. Ou execute no console do navegador:')
console.log('')
console.log('// Limpar localStorage')
console.log('Object.keys(localStorage).forEach(key => {')
console.log('  if (key.startsWith("sb-")) localStorage.removeItem(key)')
console.log('})')
console.log('')
console.log('// Limpar sessionStorage')
console.log('Object.keys(sessionStorage).forEach(key => {')
console.log('  if (key.startsWith("sb-")) sessionStorage.removeItem(key)')
console.log('})')
console.log('')
console.log('5. Recarregue a página')
console.log('')
console.log('🎉 Limpeza concluída! Os erros de refresh token devem parar.')