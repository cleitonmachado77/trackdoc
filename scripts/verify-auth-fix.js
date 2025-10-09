const fs = require('fs')
const path = require('path')

function verifyAuthFix() {
    console.log('🔍 Verificando se todas as importações de auth estão corretas...\n')
    
    // Verificar se arquivos problemáticos foram removidos
    const problematicFiles = [
        'lib/contexts/auth-context.tsx',
        'lib/contexts/hybrid-auth-context.tsx',
        'lib/hooks/use-unified-auth.ts'
    ]
    
    let removedCount = 0
    problematicFiles.forEach(file => {
        if (!fs.existsSync(file)) {
            console.log(`✅ ${file} - REMOVIDO`)
            removedCount++
        } else {
            console.log(`❌ ${file} - AINDA EXISTE`)
        }
    })
    
    // Verificar se o novo arquivo existe
    if (fs.existsSync('lib/hooks/use-auth-final.ts')) {
        console.log('✅ lib/hooks/use-auth-final.ts - EXISTE')
    } else {
        console.log('❌ lib/hooks/use-auth-final.ts - NÃO ENCONTRADO')
    }
    
    // Verificar se ainda há importações problemáticas
    function scanForProblematicImports(dir) {
        const problematicImports = []
        
        function scanDirectory(currentDir) {
            const items = fs.readdirSync(currentDir)
            
            for (const item of items) {
                const fullPath = path.join(currentDir, item)
                const stat = fs.statSync(fullPath)
                
                if (stat.isDirectory()) {
                    if (!['node_modules', '.next', '.git', 'scripts'].includes(item)) {
                        scanDirectory(fullPath)
                    }
                } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf8')
                        if (content.includes('@/lib/contexts/auth-context') || 
                            content.includes('@/lib/contexts/hybrid-auth-context') ||
                            content.includes('@/lib/hooks/use-unified-auth')) {
                            problematicImports.push(fullPath)
                        }
                    } catch (error) {
                        // Ignorar erros de leitura
                    }
                }
            }
        }
        
        scanDirectory(dir)
        return problematicImports
    }
    
    const problematicImports = scanForProblematicImports('.')
    
    console.log(`\n📊 RESUMO:`)
    console.log(`- Arquivos problemáticos removidos: ${removedCount}/${problematicFiles.length}`)
    console.log(`- Importações problemáticas restantes: ${problematicImports.length}`)
    
    if (problematicImports.length > 0) {
        console.log(`\n⚠️ Importações problemáticas encontradas:`)
        problematicImports.forEach(file => console.log(`   - ${file}`))
    } else {
        console.log(`\n🎉 SUCESSO! Todas as importações estão corretas!`)
    }
}

verifyAuthFix()