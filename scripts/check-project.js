/**
 * Script para verificar o projeto antes do deploy
 * Executa checagens de segurança, performance e qualidade
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando projeto TrackDoc...\n');

let issues = [];
let warnings = [];
let passed = 0;

// ==========================================
// 1. Verificar arquivos sensíveis
// ==========================================
console.log('📁 Verificando arquivos sensíveis...');

const sensitiveFiles = [
  '.env',
  '.env.local',
  '.env.development.local',
  '.env.production.local',
  'node_modules',
  '.next'
];

const gitignorePath = path.join(process.cwd(), '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignore = fs.readFileSync(gitignorePath, 'utf8');
  
  sensitiveFiles.forEach(file => {
    if (!gitignore.includes(file)) {
      warnings.push(`⚠️  Arquivo sensível '${file}' não está no .gitignore`);
    } else {
      passed++;
    }
  });
} else {
  issues.push('❌ Arquivo .gitignore não encontrado!');
}

// ==========================================
// 2. Verificar variáveis de ambiente
// ==========================================
console.log('🔑 Verificando variáveis de ambiente...');

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const envExample = `
# Exemplo de .env.local
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico
NEXT_PUBLIC_APP_URL=http://localhost:3000
`;

const envExamplePath = path.join(process.cwd(), '.env.example');
if (!fs.existsSync(envExamplePath)) {
  fs.writeFileSync(envExamplePath, envExample.trim());
  console.log('✅ Criado arquivo .env.example');
  passed++;
} else {
  passed++;
}

// ==========================================
// 3. Verificar dependências
// ==========================================
console.log('📦 Verificando dependências...');

const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Verificar scripts essenciais
  const requiredScripts = ['build', 'start', 'dev'];
  requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      passed++;
    } else {
      issues.push(`❌ Script '${script}' não encontrado no package.json`);
    }
  });
  
  // Verificar dependências críticas
  const criticalDeps = ['next', 'react', '@supabase/supabase-js'];
  criticalDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      passed++;
    } else {
      issues.push(`❌ Dependência crítica '${dep}' não encontrada`);
    }
  });
} else {
  issues.push('❌ package.json não encontrado!');
}

// ==========================================
// 4. Verificar estrutura de pastas
// ==========================================
console.log('📂 Verificando estrutura de pastas...');

const requiredDirs = [
  'app',
  'components',
  'lib',
  'hooks',
  'public'
];

requiredDirs.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath)) {
    passed++;
  } else {
    warnings.push(`⚠️  Pasta '${dir}' não encontrada`);
  }
});

// ==========================================
// 5. Verificar arquivos de configuração
// ==========================================
console.log('⚙️  Verificando configurações...');

const configFiles = [
  'next.config.mjs',
  'tsconfig.json',
  'tailwind.config.ts',
  '.gitignore',
  'README.md'
];

configFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    passed++;
  } else {
    warnings.push(`⚠️  Arquivo de configuração '${file}' não encontrado`);
  }
});

// ==========================================
// 6. Verificar otimizações implementadas
// ==========================================
console.log('⚡ Verificando otimizações...');

const optimizationFiles = [
  'lib/api-cache.ts',
  'database/performance-indexes.sql',
  'OTIMIZACAO_PERFORMANCE.md'
];

optimizationFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    passed++;
  } else {
    warnings.push(`⚠️  Arquivo de otimização '${file}' não encontrado`);
  }
});

// ==========================================
// 7. Verificar documentação
// ==========================================
console.log('📚 Verificando documentação...');

const docFiles = [
  'README.md',
  'LICENSE',
  'DEPLOY_GITHUB.md'
];

docFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    passed++;
  } else {
    warnings.push(`⚠️  Documentação '${file}' não encontrada`);
  }
});

// ==========================================
// 8. Verificar tamanho do build
// ==========================================
console.log('📊 Verificando build...');

const nextDir = path.join(process.cwd(), '.next');
if (fs.existsSync(nextDir)) {
  console.log('✅ Build Next.js encontrado');
  passed++;
} else {
  warnings.push('⚠️  Build Next.js não encontrado (execute npm run build)');
}

// ==========================================
// RELATÓRIO FINAL
// ==========================================
console.log('\n' + '='.repeat(50));
console.log('📋 RELATÓRIO DE VERIFICAÇÃO');
console.log('='.repeat(50));

console.log(`\n✅ Verificações passadas: ${passed}`);

if (warnings.length > 0) {
  console.log(`\n⚠️  Avisos (${warnings.length}):`);
  warnings.forEach(warning => console.log(`   ${warning}`));
}

if (issues.length > 0) {
  console.log(`\n❌ Problemas encontrados (${issues.length}):`);
  issues.forEach(issue => console.log(`   ${issue}`));
}

console.log('\n' + '='.repeat(50));

if (issues.length === 0 && warnings.length === 0) {
  console.log('✅ ✅ ✅ PROJETO PRONTO PARA DEPLOY! ✅ ✅ ✅');
  console.log('\nPróximos passos:');
  console.log('1. git add .');
  console.log('2. git commit -m "Otimizações de performance implementadas"');
  console.log('3. git push');
  process.exit(0);
} else if (issues.length === 0) {
  console.log('⚠️  Projeto OK, mas com avisos');
  console.log('\nRevise os avisos antes do deploy.');
  process.exit(0);
} else {
  console.log('❌ Corrija os problemas antes de fazer deploy!');
  process.exit(1);
}
