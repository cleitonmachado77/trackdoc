#!/usr/bin/env node

/**
 * Script para limpar dados de autenticação armazenados no localStorage
 * Execute este script quando houver problemas com refresh tokens inválidos
 */

console.log('🧹 Limpando dados de autenticação...')

// Instruções para o usuário
console.log(`
Para limpar os dados de autenticação do navegador, siga estes passos:

1. Abra o navegador e vá para: http://localhost:3000
2. Abra as Ferramentas do Desenvolvedor (F12)
3. Vá para a aba "Application" (Chrome) ou "Storage" (Firefox)
4. No painel esquerdo, encontre "Local Storage" e "Session Storage"
5. Clique em "http://localhost:3000"
6. Delete todas as chaves que começam com "supabase" ou "sb-"
7. Recarregue a página (F5)

OU execute este código no Console do navegador:

// Limpar localStorage
Object.keys(localStorage).forEach(key => {
  if (key.includes('supabase') || key.includes('sb-')) {
    localStorage.removeItem(key);
    console.log('Removido:', key);
  }
});

// Limpar sessionStorage
Object.keys(sessionStorage).forEach(key => {
  if (key.includes('supabase') || key.includes('sb-')) {
    sessionStorage.removeItem(key);
    console.log('Removido:', key);
  }
});

console.log('✅ Dados de autenticação limpos!');
location.reload();
`)

console.log('✅ Script executado. Siga as instruções acima.')