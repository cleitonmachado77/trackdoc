#!/usr/bin/env node

/**
 * Script para forçar limpeza completa de autenticação
 * Execute no console do navegador para limpar tudo
 */

console.log('🧹 LIMPEZA COMPLETA DE AUTENTICAÇÃO')
console.log('=' .repeat(50))

// Função para executar no console do navegador
const cleanupScript = `
// 🧹 LIMPEZA COMPLETA DE AUTENTICAÇÃO
console.log('🧹 Iniciando limpeza completa...')

// 1. Limpar localStorage
console.log('📦 Limpando localStorage...')
localStorage.clear()

// 2. Limpar sessionStorage  
console.log('📦 Limpando sessionStorage...')
sessionStorage.clear()

// 3. Limpar todos os cookies
console.log('🍪 Limpando cookies...')
document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});

// 4. Limpar cache do navegador (se possível)
console.log('💾 Tentando limpar cache...')
if ('caches' in window) {
    caches.keys().then(function(names) {
        names.forEach(function(name) {
            caches.delete(name);
        });
    });
}

// 5. Forçar reload da página
console.log('🔄 Forçando reload da página...')
setTimeout(() => {
    window.location.replace('/login')
}, 1000)

console.log('✅ Limpeza completa concluída!')
`

console.log('\n📋 INSTRUÇÕES:')
console.log('1. Abra o DevTools (F12)')
console.log('2. Vá para a aba Console')
console.log('3. Cole e execute o script abaixo:')
console.log('\n' + '='.repeat(50))
console.log(cleanupScript)
console.log('='.repeat(50))

console.log('\n🎯 OU execute diretamente:')
console.log('localStorage.clear(); sessionStorage.clear(); window.location.replace("/login")')

console.log('\n✅ Isso deve forçar o logout completo e redirecionar para login')