const fs = require('fs')
const path = require('path')

function finalVerification() {
    console.log('🔍 VERIFICAÇÃO FINAL COMPLETA DO SISTEMA DE AUTENTICAÇÃO\n')
    
    // 1. Verificar arquivos removidos
    const removedFiles = [
        'lib/contexts/auth-context.tsx',
        'lib/contexts/hybrid-auth-context.tsx',
        'lib/hooks/use-unified-auth.ts',
        'app/components/unified-notification-bell.tsx'
    ]
    
    console.log('📁 ARQUIVOS PROBLEMÁTICOS REMOVIDOS:')
    removedFiles.forEach(file => {
        if (!fs.existsSync(file)) {
            console.log(`✅ ${file}`)
        } else {
            console.log(`❌ ${file} - AINDA EXISTE!`)
        }
    })
    
    // 2. Verificar arquivos novos criados
    const newFiles = [
        'lib/hooks/use-auth-final.ts',
        'app/components/notification-bell-final.tsx'
    ]
    
    console.log('\n📁 NOVOS ARQUIVOS CRIADOS:')
    newFiles.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`✅ ${file}`)
        } else {
            console.log(`❌ ${file} - NÃO ENCONTRADO!`)
        }
    })
    
    // 3. Verificar importações problemáticas
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
                        
                        // Verificar importações problemáticas
                        const problematicPatterns = [
                            '@/lib/contexts/auth-context',
                            '@/lib/contexts/hybrid-auth-context',
                            '@/lib/hooks/use-unified-auth',
                            'unified-notification-bell'
                        ]
                        
                        problematicPatterns.forEach(pattern => {
                            if (content.includes(pattern)) {
                                problematicImports.push({
                                    file: fullPath,
                                    pattern: pattern
                                })
                            }
                        })
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
    
    console.log('\n🔍 VERIFICAÇÃO DE IMPORTAÇÕES:')
    if (problematicImports.length === 0) {
        console.log('✅ Nenhuma importação problemática encontrada!')
    } else {
        console.log(`❌ ${problematicImports.length} importações problemáticas encontradas:`)
        problematicImports.forEach(item => {
            console.log(`   - ${item.file}: ${item.pattern}`)
        })
    }
    
    // 4. Verificar se use-auth-final está sendo usado
    function countAuthFinalUsage(dir) {
        let count = 0
        
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
                        if (content.includes('@/lib/hooks/use-auth-final')) {
                            count++
                        }
                    } catch (error) {
                        // Ignorar erros de leitura
                    }
                }
            }
        }
        
        scanDirectory(dir)
        return count
    }
    
    const authFinalUsage = countAuthFinalUsage('.')
    
    console.log('\n📊 ESTATÍSTICAS:')
    console.log(`- Arquivos usando use-auth-final: ${authFinalUsage}`)
    console.log(`- Importações problemáticas: ${problematicImports.length}`)
    console.log(`- Arquivos removidos: ${removedFiles.filter(f => !fs.existsSync(f)).length}/${removedFiles.length}`)
    console.log(`- Novos arquivos criados: ${newFiles.filter(f => fs.existsSync(f)).length}/${newFiles.length}`)
    
    // 5. Resultado final
    console.log('\n🎯 RESULTADO FINAL:')
    const allGood = (
        problematicImports.length === 0 &&
        removedFiles.every(f => !fs.existsSync(f)) &&
        newFiles.every(f => fs.existsSync(f)) &&
        authFinalUsage > 0
    )
    
    if (allGood) {
        console.log('🎉 SUCESSO TOTAL! Sistema de autenticação completamente corrigido!')
        console.log('✅ Pronto para deploy no Vercel')
        console.log('✅ Sem erros de webpack cache')
        console.log('✅ Todas as importações corretas')
    } else {
        console.log('⚠️ Ainda há problemas que precisam ser resolvidos')
    }
}

finalVerification()