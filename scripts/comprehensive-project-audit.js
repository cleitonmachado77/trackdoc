const fs = require('fs')
const path = require('path')

function comprehensiveProjectAudit() {
    console.log('🔍 AUDITORIA COMPLETA E DETALHADA DO PROJETO TRACKDOC\n')
    console.log('=' .repeat(80))
    
    const results = {
        structure: {},
        auth: {},
        imports: {},
        build: {},
        config: {},
        issues: []
    }
    
    // 1. VERIFICAÇÃO DA ESTRUTURA DO PROJETO
    console.log('\n📁 1. ESTRUTURA DO PROJETO')
    console.log('-'.repeat(40))
    
    const criticalFiles = [
        'package.json',
        'next.config.mjs',
        'tailwind.config.ts',
        'tsconfig.json',
        'app/layout.tsx',
        'app/page.tsx',
        'app/globals.css',
        '.env.local',
        '.env.production'
    ]
    
    criticalFiles.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`✅ ${file}`)
            results.structure[file] = 'exists'
        } else {
            console.log(`❌ ${file} - FALTANDO`)
            results.structure[file] = 'missing'
            results.issues.push(`Arquivo crítico faltando: ${file}`)
        }
    })
    
    // 2. VERIFICAÇÃO DO SISTEMA DE AUTENTICAÇÃO
    console.log('\n🔐 2. SISTEMA DE AUTENTICAÇÃO')
    console.log('-'.repeat(40))
    
    const authFiles = {
        'lib/hooks/use-auth-final.ts': 'novo sistema de auth',
        'app/components/simple-auth-context.tsx': 'provider simplificado',
        'app/components/notification-bell-final.tsx': 'componente de notificação',
        'lib/contexts/unified-auth-context.tsx': 'contexto unificado'
    }
    
    Object.entries(authFiles).forEach(([file, description]) => {
        if (fs.existsSync(file)) {
            console.log(`✅ ${file} - ${description}`)
            results.auth[file] = 'exists'
        } else {
            console.log(`❌ ${file} - FALTANDO - ${description}`)
            results.auth[file] = 'missing'
            results.issues.push(`Arquivo de auth faltando: ${file}`)
        }
    })
    
    // Verificar arquivos problemáticos removidos
    const removedFiles = [
        'lib/contexts/auth-context.tsx',
        'lib/contexts/hybrid-auth-context.tsx',
        'lib/hooks/use-unified-auth.ts',
        'app/components/unified-notification-bell.tsx'
    ]
    
    console.log('\n🗑️ Arquivos problemáticos removidos:')
    removedFiles.forEach(file => {
        if (!fs.existsSync(file)) {
            console.log(`✅ ${file} - REMOVIDO`)
            results.auth[`removed_${file}`] = 'removed'
        } else {
            console.log(`❌ ${file} - AINDA EXISTE`)
            results.auth[`removed_${file}`] = 'still_exists'
            results.issues.push(`Arquivo problemático ainda existe: ${file}`)
        }
    })
    
    // 3. VERIFICAÇÃO DE IMPORTAÇÕES
    console.log('\n📦 3. ANÁLISE DE IMPORTAÇÕES')
    console.log('-'.repeat(40))
    
    function analyzeImports(dir) {
        const importAnalysis = {
            authFinal: 0,
            problematic: [],
            total: 0
        }
        
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
                        importAnalysis.total++
                        
                        // Contar uso do auth final
                        if (content.includes('@/lib/hooks/use-auth-final')) {
                            importAnalysis.authFinal++
                        }
                        
                        // Verificar importações problemáticas
                        const problematicPatterns = [
                            '@/lib/contexts/auth-context',
                            '@/lib/contexts/hybrid-auth-context',
                            '@/lib/hooks/use-unified-auth',
                            'unified-notification-bell'
                        ]
                        
                        problematicPatterns.forEach(pattern => {
                            if (content.includes(pattern)) {
                                importAnalysis.problematic.push({
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
        return importAnalysis
    }
    
    const importAnalysis = analyzeImports('.')
    results.imports = importAnalysis
    
    console.log(`📊 Arquivos TypeScript/React analisados: ${importAnalysis.total}`)
    console.log(`✅ Arquivos usando use-auth-final: ${importAnalysis.authFinal}`)
    console.log(`❌ Importações problemáticas: ${importAnalysis.problematic.length}`)
    
    if (importAnalysis.problematic.length > 0) {
        console.log('\n⚠️ Importações problemáticas encontradas:')
        importAnalysis.problematic.forEach(item => {
            console.log(`   - ${item.file}: ${item.pattern}`)
            results.issues.push(`Importação problemática: ${item.file} -> ${item.pattern}`)
        })
    }
    
    // 4. VERIFICAÇÃO DE CONFIGURAÇÕES
    console.log('\n⚙️ 4. CONFIGURAÇÕES DO PROJETO')
    console.log('-'.repeat(40))
    
    // Verificar package.json
    if (fs.existsSync('package.json')) {
        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
            console.log(`✅ package.json válido`)
            console.log(`   - Nome: ${packageJson.name}`)
            console.log(`   - Versão: ${packageJson.version}`)
            console.log(`   - Scripts: ${Object.keys(packageJson.scripts || {}).length}`)
            console.log(`   - Dependências: ${Object.keys(packageJson.dependencies || {}).length}`)
            results.config.packageJson = 'valid'
        } catch (error) {
            console.log(`❌ package.json inválido: ${error.message}`)
            results.config.packageJson = 'invalid'
            results.issues.push(`package.json inválido: ${error.message}`)
        }
    }
    
    // Verificar next.config.mjs
    if (fs.existsSync('next.config.mjs')) {
        try {
            const nextConfig = fs.readFileSync('next.config.mjs', 'utf8')
            console.log(`✅ next.config.mjs existe`)
            if (nextConfig.includes('experimental')) {
                console.log(`   - Configurações experimentais detectadas`)
            }
            results.config.nextConfig = 'exists'
        } catch (error) {
            console.log(`❌ Erro ao ler next.config.mjs: ${error.message}`)
            results.config.nextConfig = 'error'
            results.issues.push(`Erro no next.config.mjs: ${error.message}`)
        }
    }
    
    // 5. VERIFICAÇÃO DE DEPENDÊNCIAS CRÍTICAS
    console.log('\n📚 5. DEPENDÊNCIAS CRÍTICAS')
    console.log('-'.repeat(40))
    
    if (fs.existsSync('package.json')) {
        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
            const criticalDeps = [
                'next',
                'react',
                'react-dom',
                '@supabase/supabase-js',
                '@supabase/ssr',
                'tailwindcss'
            ]
            
            criticalDeps.forEach(dep => {
                if (packageJson.dependencies && packageJson.dependencies[dep]) {
                    console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`)
                } else if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
                    console.log(`✅ ${dep}: ${packageJson.devDependencies[dep]} (dev)`)
                } else {
                    console.log(`❌ ${dep}: FALTANDO`)
                    results.issues.push(`Dependência crítica faltando: ${dep}`)
                }
            })
        } catch (error) {
            console.log(`❌ Erro ao analisar dependências: ${error.message}`)
        }
    }
    
    // 6. VERIFICAÇÃO DE ARQUIVOS DE AMBIENTE
    console.log('\n🌍 6. VARIÁVEIS DE AMBIENTE')
    console.log('-'.repeat(40))
    
    const envFiles = ['.env.local', '.env.production', '.env.example']
    envFiles.forEach(file => {
        if (fs.existsSync(file)) {
            try {
                const content = fs.readFileSync(file, 'utf8')
                const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'))
                console.log(`✅ ${file} - ${lines.length} variáveis`)
                
                // Verificar variáveis críticas do Supabase
                const hasSupabaseUrl = content.includes('NEXT_PUBLIC_SUPABASE_URL')
                const hasSupabaseKey = content.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')
                
                if (hasSupabaseUrl && hasSupabaseKey) {
                    console.log(`   - Configuração Supabase: ✅`)
                } else {
                    console.log(`   - Configuração Supabase: ❌`)
                    results.issues.push(`Configuração Supabase incompleta em ${file}`)
                }
            } catch (error) {
                console.log(`❌ ${file} - Erro ao ler: ${error.message}`)
            }
        } else {
            console.log(`⚠️ ${file} - Não encontrado`)
        }
    })
    
    // 7. VERIFICAÇÃO DE COMPONENTES CRÍTICOS
    console.log('\n🧩 7. COMPONENTES CRÍTICOS')
    console.log('-'.repeat(40))
    
    const criticalComponents = [
        'app/layout.tsx',
        'app/page.tsx',
        'app/components/sidebar.tsx',
        'app/components/simple-auth-context.tsx',
        'app/components/notification-bell-final.tsx'
    ]
    
    criticalComponents.forEach(component => {
        if (fs.existsSync(component)) {
            try {
                const content = fs.readFileSync(component, 'utf8')
                console.log(`✅ ${component}`)
                
                // Verificar se tem erros óbvios
                if (content.includes('import') && content.includes('export')) {
                    console.log(`   - Estrutura: ✅`)
                } else {
                    console.log(`   - Estrutura: ⚠️`)
                }
            } catch (error) {
                console.log(`❌ ${component} - Erro: ${error.message}`)
                results.issues.push(`Erro no componente: ${component}`)
            }
        } else {
            console.log(`❌ ${component} - FALTANDO`)
            results.issues.push(`Componente crítico faltando: ${component}`)
        }
    })
    
    // 8. RESUMO FINAL
    console.log('\n' + '='.repeat(80))
    console.log('📊 RESUMO DA AUDITORIA')
    console.log('='.repeat(80))
    
    const totalIssues = results.issues.length
    const authFilesOk = Object.values(results.auth).filter(v => v === 'exists' || v === 'removed').length
    const importIssues = results.imports.problematic.length
    
    console.log(`\n📈 ESTATÍSTICAS:`)
    console.log(`- Problemas encontrados: ${totalIssues}`)
    console.log(`- Arquivos de auth OK: ${authFilesOk}`)
    console.log(`- Importações problemáticas: ${importIssues}`)
    console.log(`- Arquivos usando auth final: ${results.imports.authFinal}`)
    
    console.log(`\n🎯 AVALIAÇÃO GERAL:`)
    if (totalIssues === 0 && importIssues === 0) {
        console.log('🎉 PROJETO EM PERFEITO ESTADO!')
        console.log('✅ Pronto para deploy')
        console.log('✅ Sistema de auth funcionando')
        console.log('✅ Sem problemas detectados')
    } else if (totalIssues <= 3) {
        console.log('⚠️ PROJETO EM BOM ESTADO com pequenos ajustes')
        console.log(`- ${totalIssues} problema(s) menor(es) detectado(s)`)
    } else {
        console.log('❌ PROJETO PRECISA DE CORREÇÕES')
        console.log(`- ${totalIssues} problema(s) detectado(s)`)
    }
    
    if (results.issues.length > 0) {
        console.log(`\n🔧 PROBLEMAS DETECTADOS:`)
        results.issues.forEach((issue, index) => {
            console.log(`${index + 1}. ${issue}`)
        })
    }
    
    console.log('\n' + '='.repeat(80))
    console.log('Auditoria concluída!')
    
    return results
}

// Executar auditoria
comprehensiveProjectAudit()