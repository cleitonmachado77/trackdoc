/**
 * Script para corrigir todas as importações do useAuth
 * Substitui importações do hybrid-auth-context pelo hook unificado
 */

const fs = require('fs')
const path = require('path')

// Lista de arquivos que precisam ser corrigidos
const filesToFix = [
  'app/test-connection/page.tsx',
  'app/system-status/page.tsx',
  'app/status/page.tsx',
  'app/reset-password/page.tsx',
  'app/register/page.tsx',
  'app/pricing/page.tsx',
  'app/minha-conta/page.tsx',
  'app/login/page.tsx',
  'app/hooks/use-chat.ts',
  'app/demo/page.tsx',
  'app/components/sidebar.tsx',
  'app/components/landing-redirect.tsx',
  'app/components/chat/use-chat.ts',
  'app/components/chat/chat-messages.tsx',
  'app/components/auth-guard.tsx',
  'app/components/access-guard.tsx',
  'app/choose-plan/page.tsx'
]

function fixAuthImports() {
  console.log('🔧 Corrigindo importações do useAuth...\n')
  
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
      
      // Remover importação do HybridAuthProvider se existir (exceto no layout)
      if (!filePath.includes('layout.tsx')) {
        content = content.replace(
          /import\s*{\s*HybridAuthProvider\s*}\s*from\s*['"]@\/lib\/contexts\/hybrid-auth-context['"]\s*\n?/g,
          ''
        )
      }
      
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
  
  console.log(`\n🎉 Correção concluída! ${fixedCount} arquivos foram corrigidos.`)
}

// Executar correção
fixAuthImports()