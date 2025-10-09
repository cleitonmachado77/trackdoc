/**
 * Script para corrigir todas as importações do useAuth nos hooks
 */

const fs = require('fs')

// Lista de arquivos que precisam ser corrigidos
const filesToFix = [
  'hooks/use-users.ts',
  'hooks/use-subscriptions.ts',
  'hooks/use-notifications.ts',
  'hooks/use-notification-counter-simple.ts',
  'hooks/use-multi-signature-requests.ts',
  'hooks/use-entity-stats.ts',
  'hooks/use-departments.ts',
  'hooks/use-database-data.ts',
  'hooks/use-chat.ts',
  'hooks/use-categories.ts',
  'hooks/use-approvals.ts',
  'hooks/use-access-status.ts'
]

function fixHooksImports() {
  console.log('🔧 Corrigindo importações do useAuth nos hooks...\n')
  
  let fixedCount = 0
  
  filesToFix.forEach(filePath => {
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️ Arquivo não encontrado: ${filePath}`)
        return
      }
      
      let content = fs.readFileSync(filePath, 'utf8')
      const originalContent = content
      
      // Substituir importação do hybrid-auth-context
      content = content.replace(
        /import\s*{\s*useAuth\s*}\s*from\s*['"]@\/lib\/contexts\/hybrid-auth-context['"]/g,
        "import { useAuth } from '@/lib/hooks/use-unified-auth'"
      )
      
      // Também corrigir importações com caminhos relativos
      content = content.replace(
        /import\s*{\s*useAuth\s*}\s*from\s*['"].*\/lib\/contexts\/hybrid-auth-context['"]/g,
        "import { useAuth } from '@/lib/hooks/use-unified-auth'"
      )
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8')
        console.log(`✅ Corrigido: ${filePath}`)
        fixedCount++
      } else {
        console.log(`ℹ️ Sem alterações: ${filePath}`)
      }
      
    } catch (error) {
      console.error(`❌ Erro ao processar ${filePath}:`, error.message)
    }
  })
  
  console.log(`\n🎉 Correção concluída! ${fixedCount} hooks foram corrigidos.`)
}

// Executar correção
fixHooksImports()