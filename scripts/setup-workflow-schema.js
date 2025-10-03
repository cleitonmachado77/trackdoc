const fs = require('fs')
const path = require('path')

// Script para executar o schema SQL da nova arquitetura de workflow
console.log('🚀 Iniciando configuração do schema de workflow...')

const schemaPath = path.join(__dirname, '..', 'workflow-schema-new.sql')

if (!fs.existsSync(schemaPath)) {
  console.error('❌ Arquivo workflow-schema-new.sql não encontrado')
  process.exit(1)
}

const schemaSQL = fs.readFileSync(schemaPath, 'utf8')

console.log('📄 Schema SQL carregado com sucesso')
console.log('📏 Tamanho do arquivo:', schemaSQL.length, 'caracteres')

console.log('\n📋 SEQUÊNCIA CORRETA DE EXECUÇÃO:')
console.log('1. ✅ Execute: workflow-schema-new.sql (cria tabelas e funções)')
console.log('2. 🔧 Execute: fix-workflow-rls.sql (corrige RLS)')
console.log('3. 🧪 Execute: test-workflow-basic.sql (verifica funcionamento)')
console.log('4. 📊 Execute: test-workflow-functions.sql (teste com dados)')

console.log('\n🔧 Correções aplicadas:')
console.log('- ✅ RLS habilitado em todas as tabelas workflow_*')
console.log('- ✅ Políticas antigas removidas, novas criadas')
console.log('- ✅ Tabela workflow_notifications adicionada')
console.log('- ✅ Scripts de teste simplificados')

console.log('\n📁 Arquivos SQL criados:')
console.log('📄 Schema principal:', schemaPath)
console.log('🔧 Correção RLS:', schemaPath.replace('workflow-schema-new.sql', 'fix-workflow-rls.sql'))
console.log('🧪 Teste básico:', schemaPath.replace('workflow-schema-new.sql', 'test-workflow-basic.sql'))
console.log('📊 Teste completo:', schemaPath.replace('workflow-schema-new.sql', 'test-workflow-functions.sql'))

console.log('\n⚠️  IMPORTANTE: Execute os arquivos na ordem acima!')
console.log('🚫 NÃO execute o script setup-workflow-schema.js no SQL Editor!')
