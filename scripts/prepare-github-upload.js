#!/usr/bin/env node

/**
 * Script para preparar upload para GitHub
 * Verifica arquivos, cria commit message e sugere comandos
 */

const fs = require('fs')
const path = require('path')

console.log('🚀 PREPARANDO UPLOAD PARA GITHUB')
console.log('=' .repeat(50))

// 1. Verificar arquivos principais modificados
function checkModifiedFiles() {
    console.log('\n📁 1. Verificando arquivos principais modificados...')
    
    const criticalFiles = [
        'app/api/profile/route.ts',
        'app/api/approvals/route.ts',
        'app/components/auth-guard.tsx',
        'hooks/use-database-data.ts',
        'app/register/page.tsx',
        'CHANGELOG_VERSAO_CORRIGIDA.md'
    ]
    
    let allExist = true
    
    criticalFiles.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`✅ ${file}`)
        } else {
            console.log(`❌ ${file} - NÃO ENCONTRADO`)
            allExist = false
        }
    })
    
    return allExist
}

// 2. Verificar scripts SQL
function checkSQLFiles() {
    console.log('\n📋 2. Verificando scripts SQL...')
    
    const sqlFiles = [
        'database/fix-profiles-structure-minimal.sql',
        'database/fix-foreign-keys-clean-unused.sql',
        'database/disable-auto-profile-creation.sql'
    ]
    
    sqlFiles.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`✅ ${file}`)
        } else {
            console.log(`⚠️ ${file} - Opcional`)
        }
    })
}

// 3. Verificar documentação
function checkDocumentation() {
    console.log('\n📚 3. Verificando documentação...')
    
    const docFiles = [
        'CHANGELOG_VERSAO_CORRIGIDA.md',
        'SOLUCAO_PROBLEMAS_BANCO_USUARIOS.md',
        'SOLUCAO_ERROS_CONSOLE.md',
        'SOLUCAO_DESABILITAR_CRIACAO_AUTOMATICA.md'
    ]
    
    docFiles.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`✅ ${file}`)
        } else {
            console.log(`⚠️ ${file} - Opcional`)
        }
    })
}

// 4. Gerar mensagem de commit
function generateCommitMessage() {
    console.log('\n💬 4. Mensagem de commit sugerida:')
    
    const commitMessage = `🔧 fix: Sistema de usuários e banco de dados corrigido

✅ Principais correções:
- Banco de dados consistente com foreign keys padronizadas
- Sistema de autenticação robusto com verificação de perfil
- Remoção de criação automática de perfis
- Limpeza de referências órfãs e tabelas não utilizadas
- APIs otimizadas e erros de console resolvidos

🎯 Benefícios:
- Maior segurança no controle de acesso
- Performance melhorada
- Console limpo sem erros
- Sistema estável para produção

📊 Arquivos principais:
- app/api/profile/route.ts - API segura sem criação automática
- app/components/auth-guard.tsx - Verificação de perfil
- hooks/use-database-data.ts - Logout automático
- database/ - Scripts de correção SQL

Closes: Problemas de banco e usuários órfãos
Fixes: Erros 500/401/400 no console`
    
    console.log('\n' + '='.repeat(60))
    console.log(commitMessage)
    console.log('='.repeat(60))
}

// 5. Sugerir comandos Git
function suggestGitCommands() {
    console.log('\n🔧 5. Comandos Git sugeridos:')
    
    console.log('\n# 1. Verificar status atual')
    console.log('git status')
    
    console.log('\n# 2. Adicionar arquivos principais')
    console.log('git add app/api/profile/route.ts')
    console.log('git add app/api/approvals/route.ts')
    console.log('git add app/components/auth-guard.tsx')
    console.log('git add hooks/use-database-data.ts')
    console.log('git add app/register/page.tsx')
    
    console.log('\n# 3. Adicionar documentação')
    console.log('git add CHANGELOG_VERSAO_CORRIGIDA.md')
    console.log('git add SOLUCAO_*.md')
    
    console.log('\n# 4. Adicionar scripts SQL (opcional)')
    console.log('git add database/fix-*.sql')
    console.log('git add database/disable-*.sql')
    
    console.log('\n# 5. Fazer commit')
    console.log('git commit -m "🔧 fix: Sistema de usuários e banco de dados corrigido"')
    
    console.log('\n# 6. Push para GitHub')
    console.log('git push origin main')
    console.log('# ou')
    console.log('git push origin master')
}

// 6. Verificar se há arquivos sensíveis
function checkSensitiveFiles() {
    console.log('\n🔒 6. Verificando arquivos sensíveis...')
    
    const sensitivePatterns = [
        '.env',
        '.env.local',
        'node_modules',
        '*.log',
        '.DS_Store'
    ]
    
    const gitignoreExists = fs.existsSync('.gitignore')
    
    if (gitignoreExists) {
        console.log('✅ .gitignore existe')
        
        const gitignoreContent = fs.readFileSync('.gitignore', 'utf8')
        
        sensitivePatterns.forEach(pattern => {
            if (gitignoreContent.includes(pattern)) {
                console.log(`✅ ${pattern} está no .gitignore`)
            } else {
                console.log(`⚠️ ${pattern} NÃO está no .gitignore`)
            }
        })
    } else {
        console.log('❌ .gitignore não encontrado')
    }
}

// 7. Executar todas as verificações
function main() {
    console.log('\n🚀 Iniciando verificações...\n')
    
    const filesOk = checkModifiedFiles()
    checkSQLFiles()
    checkDocumentation()
    checkSensitiveFiles()
    
    if (filesOk) {
        generateCommitMessage()
        suggestGitCommands()
        
        console.log('\n' + '='.repeat(50))
        console.log('✅ PRONTO PARA UPLOAD NO GITHUB!')
        console.log('\n📋 CHECKLIST FINAL:')
        console.log('□ Arquivos principais verificados')
        console.log('□ Documentação incluída')
        console.log('□ Scripts SQL opcionais')
        console.log('□ Mensagem de commit preparada')
        console.log('□ Comandos Git sugeridos')
        console.log('\n🎯 Execute os comandos Git acima para fazer o upload!')
    } else {
        console.log('\n❌ ALGUNS ARQUIVOS ESTÃO FALTANDO')
        console.log('Verifique os arquivos marcados como ❌ antes de continuar')
    }
}

// Executar script
main()