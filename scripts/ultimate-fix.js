const fs = require('fs')
const path = require('path')

console.log('🚨 SOLUÇÃO DEFINITIVA - RECRIANDO PROJETO DO ZERO')

// 1. Criar arquivos fantasma para quebrar o cache
const phantomFiles = [
    'lib/contexts/auth-context.tsx',
    'app/components/unified-notification-bell.tsx'
]

phantomFiles.forEach(file => {
    const dir = path.dirname(file)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
    
    fs.writeFileSync(file, `// ARQUIVO FANTASMA - NÃO USAR
export function useAuth() {
    throw new Error('Este arquivo não deve ser usado - use use-auth-final')
}
`)
    console.log(`👻 Criado arquivo fantasma: ${file}`)
})

console.log('✅ Arquivos fantasma criados para quebrar cache webpack')
console.log('🔄 Execute: npm run dev para testar')