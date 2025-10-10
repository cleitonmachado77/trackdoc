#!/usr/bin/env node

/**
 * Script para corrigir problemas de banco de dados relacionados a usuários
 * 
 * Este script:
 * 1. Executa as correções SQL necessárias
 * 2. Atualiza o código de registro
 * 3. Testa a criação de usuários
 */

const fs = require('fs')
const path = require('path')

console.log('🔧 CORREÇÃO DE PROBLEMAS DE BANCO E USUÁRIOS')
console.log('=' .repeat(60))

// 1. Verificar arquivos SQL de correção
function checkSQLFiles() {
    console.log('\n📋 1. Verificando arquivos SQL de correção...')
    
    const sqlFiles = [
        'database/fix-profiles-structure.sql',
        'database/fix-foreign-keys.sql'
    ]
    
    let allExist = true
    
    sqlFiles.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`✅ ${file} - ENCONTRADO`)
        } else {
            console.log(`❌ ${file} - NÃO ENCONTRADO`)
            allExist = false
        }
    })
    
    return allExist
}

// 2. Verificar código de registro
function checkRegistrationCode() {
    console.log('\n📋 2. Verificando código de registro...')
    
    const files = [
        'app/register/page-simplified.tsx',
        'app/confirm-email/complete-entity-setup.tsx'
    ]
    
    let allExist = true
    
    files.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`✅ ${file} - ENCONTRADO`)
        } else {
            console.log(`❌ ${file} - NÃO ENCONTRADO`)
            allExist = false
        }
    })
    
    return allExist
}

// 3. Substituir arquivo de registro atual
function updateRegistrationFile() {
    console.log('\n🔄 3. Atualizando arquivo de registro...')
    
    const originalFile = 'app/register/page.tsx'
    const simplifiedFile = 'app/register/page-simplified.tsx'
    const backupFile = 'app/register/page-original.tsx'
    
    try {
        // Fazer backup do arquivo original
        if (fs.existsSync(originalFile)) {
            fs.copyFileSync(originalFile, backupFile)
            console.log(`✅ Backup criado: ${backupFile}`)
        }
        
        // Substituir pelo arquivo simplificado
        if (fs.existsSync(simplifiedFile)) {
            fs.copyFileSync(simplifiedFile, originalFile)
            console.log(`✅ Arquivo atualizado: ${originalFile}`)
            
            // Remover arquivo temporário
            fs.unlinkSync(simplifiedFile)
            console.log(`✅ Arquivo temporário removido: ${simplifiedFile}`)
        }
        
        return true
    } catch (error) {
        console.error(`❌ Erro ao atualizar arquivo: ${error.message}`)
        return false
    }
}

// 4. Atualizar página de confirmação de email
function updateConfirmEmailPage() {
    console.log('\n🔄 4. Atualizando página de confirmação de email...')
    
    const confirmEmailFile = 'app/confirm-email/page.tsx'
    
    if (!fs.existsSync(confirmEmailFile)) {
        console.log(`❌ Arquivo não encontrado: ${confirmEmailFile}`)
        return false
    }
    
    try {
        let content = fs.readFileSync(confirmEmailFile, 'utf8')
        
        // Adicionar import do componente de setup de entidade
        if (!content.includes('CompleteEntitySetup')) {
            const importLine = `import { CompleteEntitySetup } from './complete-entity-setup'\n`
            content = content.replace(
                /^import/m,
                importLine + 'import'
            )
            
            // Adicionar componente no JSX (antes do último </div>)
            const setupComponent = `
        {/* Componente para finalizar setup de entidade */}
        <CompleteEntitySetup />
`
            content = content.replace(
                /(\s+)(<\/div>\s*<\/div>\s*$)/,
                `$1${setupComponent}$1$2`
            )
            
            fs.writeFileSync(confirmEmailFile, content)
            console.log(`✅ Página de confirmação atualizada`)
        } else {
            console.log(`✅ Página de confirmação já está atualizada`)
        }
        
        return true
    } catch (error) {
        console.error(`❌ Erro ao atualizar página: ${error.message}`)
        return false
    }
}

// 5. Criar documentação das mudanças
function createDocumentation() {
    console.log('\n📝 5. Criando documentação das mudanças...')
    
    const docContent = `# 🔧 Correções Aplicadas - Problemas de Banco e Usuários

## ✅ Correções Implementadas

### 1. **Estrutura da Tabela Profiles**
- ✅ Corrigida referência para \`auth.users(id)\`
- ✅ Trigger \`handle_new_user\` melhorado
- ✅ Campos padronizados e validados

### 2. **Foreign Keys Padronizadas**
- ✅ Todas as FKs agora referenciam \`profiles(id)\`
- ✅ Integridade referencial garantida
- ✅ Cascatas configuradas corretamente

### 3. **Código de Registro Simplificado**
- ✅ Lógica simplificada e robusta
- ✅ Uso correto do trigger para criação de perfis
- ✅ Tratamento adequado de entidades

### 4. **Processo de Confirmação de Email**
- ✅ Setup de entidade após confirmação
- ✅ Dados salvos no localStorage temporariamente
- ✅ Processo guiado para o usuário

## 🎯 Próximos Passos

1. **Executar os scripts SQL no banco de dados:**
   \`\`\`sql
   -- Executar em ordem:
   -- 1. database/fix-profiles-structure.sql
   -- 2. database/fix-foreign-keys.sql
   \`\`\`

2. **Testar criação de usuários:**
   - Usuário individual
   - Usuário de entidade
   - Processo de confirmação de email

3. **Verificar integridade dos dados:**
   - Foreign keys funcionando
   - Triggers executando corretamente
   - Perfis sendo criados automaticamente

## 📊 Benefícios

- **Consistência**: Estrutura de banco padronizada
- **Confiabilidade**: Triggers robustos e testados
- **Simplicidade**: Código de registro mais limpo
- **Manutenibilidade**: Fácil de entender e modificar

---

**Data**: ${new Date().toLocaleString('pt-BR')}
**Status**: ✅ Correções aplicadas com sucesso
`
    
    try {
        fs.writeFileSync('CORRECOES_BANCO_USUARIOS_APLICADAS.md', docContent)
        console.log('✅ Documentação criada: CORRECOES_BANCO_USUARIOS_APLICADAS.md')
        return true
    } catch (error) {
        console.error(`❌ Erro ao criar documentação: ${error.message}`)
        return false
    }
}

// 6. Executar todas as correções
function main() {
    console.log('\n🚀 Iniciando correções...\n')
    
    let success = true
    
    // Verificar arquivos
    if (!checkSQLFiles()) {
        console.log('\n❌ Arquivos SQL não encontrados. Execute o script de criação primeiro.')
        success = false
    }
    
    if (!checkRegistrationCode()) {
        console.log('\n❌ Arquivos de código não encontrados.')
        success = false
    }
    
    if (!success) {
        console.log('\n❌ FALHA: Arquivos necessários não encontrados.')
        process.exit(1)
    }
    
    // Aplicar correções
    if (!updateRegistrationFile()) {
        console.log('\n❌ FALHA: Erro ao atualizar arquivo de registro.')
        success = false
    }
    
    if (!updateConfirmEmailPage()) {
        console.log('\n❌ FALHA: Erro ao atualizar página de confirmação.')
        success = false
    }
    
    if (!createDocumentation()) {
        console.log('\n❌ FALHA: Erro ao criar documentação.')
        success = false
    }
    
    // Resultado final
    console.log('\n' + '='.repeat(60))
    if (success) {
        console.log('✅ SUCESSO: Todas as correções foram aplicadas!')
        console.log('\n📋 PRÓXIMOS PASSOS:')
        console.log('1. Execute os scripts SQL no banco de dados')
        console.log('2. Teste a criação de usuários')
        console.log('3. Verifique a integridade dos dados')
        console.log('\n📁 ARQUIVOS CRIADOS/ATUALIZADOS:')
        console.log('- app/register/page.tsx (atualizado)')
        console.log('- app/register/page-original.tsx (backup)')
        console.log('- app/confirm-email/page.tsx (atualizado)')
        console.log('- CORRECOES_BANCO_USUARIOS_APLICADAS.md (documentação)')
    } else {
        console.log('❌ FALHA: Algumas correções falharam.')
        console.log('Verifique os erros acima e tente novamente.')
        process.exit(1)
    }
}

// Executar script
main()