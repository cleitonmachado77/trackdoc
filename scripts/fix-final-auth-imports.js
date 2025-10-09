const fs = require('fs')
const path = require('path')

function findFilesWithUnifiedAuth(dir) {
    const files = []
    
    function scanDirectory(currentDir) {
        const items = fs.readdirSync(currentDir)
        
        for (const item of items) {
            const fullPath = path.join(currentDir, item)
            const stat = fs.statSync(fullPath)
            
            if (stat.isDirectory()) {
                // Pular node_modules, .next, .git
                if (!['node_modules', '.next', '.git', 'scripts'].includes(item)) {
                    scanDirectory(fullPath)
                }
            } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf8')
                    if (content.includes('@/lib/hooks/use-unified-auth')) {
                        files.push(fullPath)
                    }
                } catch (error) {
                    console.error(`Erro ao ler ${fullPath}:`, error.message)
                }
            }
        }
    }
    
    scanDirectory(dir)
    return files
}

function fixFinalAuthImports() {
    console.log('🔧 Atualizando todas as importações para use-auth-final...\n')
    
    const filesToFix = findFilesWithUnifiedAuth('.')
    let fixedCount = 0
    
    console.log(`📁 Encontrados ${filesToFix.length} arquivos com importações do use-unified-auth\n`)
    
    filesToFix.forEach(filePath => {
        try {
            let content = fs.readFileSync(filePath, 'utf8')
            const originalContent = content
            
            // Substituir importação do use-unified-auth
            content = content.replace(
                /import\s*{\s*useAuth\s*}\s*from\s*['"]@\/lib\/hooks\/use-unified-auth['"]/g,
                "import { useAuth } from '@/lib/hooks/use-auth-final'"
            )
            
            if (content !== originalContent) {
                fs.writeFileSync(filePath, content, 'utf8')
                console.log(`✅ ${filePath}`)
                fixedCount++
            }
        } catch (error) {
            console.error(`❌ Erro ao processar ${filePath}:`, error.message)
        }
    })
    
    console.log(`\n🎉 Processo concluído! ${fixedCount} arquivos foram atualizados.`)
}

fixFinalAuthImports()