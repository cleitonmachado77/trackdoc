const fs = require('fs')
const path = require('path')

function nuclearCacheClean() {
    console.log('🧹 LIMPEZA NUCLEAR DE CACHE - REMOVENDO TUDO\n')
    
    const itemsToRemove = [
        '.next',
        'node_modules/.cache',
        'node_modules/.vite',
        'node_modules/@next',
        '.eslintcache'
    ]
    
    itemsToRemove.forEach(item => {
        if (fs.existsSync(item)) {
            try {
                console.log(`🗑️ Removendo ${item}...`)
                fs.rmSync(item, { recursive: true, force: true })
                console.log(`✅ ${item} removido`)
            } catch (error) {
                console.log(`⚠️ Erro ao remover ${item}: ${error.message}`)
            }
        } else {
            console.log(`ℹ️ ${item} não existe`)
        }
    })
    
    console.log('\n🔍 Verificando se ainda existem referências problemáticas...')
    
    // Verificar se ainda há arquivos problemáticos
    const problematicFiles = [
        'lib/contexts/auth-context.tsx',
        'lib/contexts/hybrid-auth-context.tsx', 
        'lib/hooks/use-unified-auth.ts',
        'app/components/unified-notification-bell.tsx'
    ]
    
    let foundProblematic = false
    problematicFiles.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`❌ ARQUIVO PROBLEMÁTICO AINDA EXISTE: ${file}`)
            foundProblematic = true
        } else {
            console.log(`✅ ${file} - removido`)
        }
    })
    
    if (!foundProblematic) {
        console.log('\n🎉 Todos os arquivos problemáticos foram removidos!')
    }
    
    console.log('\n📋 PRÓXIMOS PASSOS:')
    console.log('1. npm install')
    console.log('2. npm run build')
    console.log('3. npm run dev')
    
    console.log('\n🧹 Limpeza nuclear concluída!')
}

nuclearCacheClean()