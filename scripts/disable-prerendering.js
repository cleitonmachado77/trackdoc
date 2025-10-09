/**
 * Script para desabilitar prerendering em páginas que usam autenticação
 */

const fs = require('fs')

// Lista de páginas que precisam desabilitar prerendering
const pagesToFix = [
  'app/choose-plan/page.tsx',
  'app/minha-conta/page.tsx', 
  'app/multi-signature-requests/page.tsx',
  'app/status/page.tsx',
  'app/system-status/page.tsx',
  'app/login/page.tsx',
  'app/register/page.tsx',
  'app/demo/page.tsx',
  'app/pricing/page.tsx',
  'app/reset-password/page.tsx',
  'app/test-connection/page.tsx',
  'app/chat/page.tsx',
  'app/page.tsx'
]

function disablePrerendering() {
  console.log('🔧 Desabilitando prerendering para páginas com autenticação...\n')
  
  let fixedCount = 0
  
  pagesToFix.forEach(filePath => {
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️ Arquivo não encontrado: ${filePath}`)
        return
      }
      
      let content = fs.readFileSync(filePath, 'utf8')
      const originalContent = content
      
      // Verificar se já tem export const dynamic
      if (content.includes('export const dynamic')) {
        console.log(`ℹ️ Já configurado: ${filePath}`)
        return
      }
      
      // Adicionar export const dynamic = 'force-dynamic' no final do arquivo
      if (!content.includes('export const dynamic')) {
        content = content + '\n\n// Desabilitar prerendering para páginas com autenticação\nexport const dynamic = \'force-dynamic\'\n'
      }
      
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
disablePrerendering()