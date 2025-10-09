/**
 * Script para corrigir todas as importações do useAuth do auth-context
 */

const fs = require('fs')
const path = require('path')

function findFilesWithAuthContext(dir, files = []) {
  const items = fs.readdirSync(dir)
  
  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.git') && !item.includes('.next')) {
      findFilesWithAuthContext(fullPath, files)
    } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8')
        if (content.includes('@/lib/contexts/auth-context')) {
          files.push(fullPath)
        }
      } catch (error) {
        // Ignorar arquivos que não podem ser lidos
      }
    }
  }
  
  return files
}

function fixAuthContextImports() {
  console.log('🔧 Procurando e corrigindo importações do auth-context...\n')
  
  const filesToFix = findFilesWithAuthContext('.')
  let fixedCount = 0
  
  console.log(`📁 Encontrados ${filesToFix.length} arquivos com importações do auth-context\n`)
  
  filesToFix.forEach(filePath => {
    try {
      let content = fs.readFileSync(filePath, 'utf8')
      const originalContent = content
      
      // Substituir importação do auth-context
      content = content.replace(
        /import\s*{\s*useAuth\s*}\s*from\s*['"]@\/lib\/contexts\/auth-context['"]/g,
        "import { useAuth } from '@/lib/hooks/use-unified-auth'"
      )
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8')
        console.log(`✅ Corrigido: ${filePath}`)
        fixedCount++
      }
      
    } catch (error) {
      console.error(`❌ Erro ao processar ${filePath}:`, error.message)
    }
  })
  
  console.log(`\n🎉 Correção concluída! ${fixedCount} arquivos foram corrigidos.`)
}

// Executar correção
fixAuthContextImports()