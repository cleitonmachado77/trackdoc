#!/usr/bin/env node

/**
 * Script para gerar ícones do TrackDoc
 * 
 * Este script gera os ícones necessários para a landing page
 * baseado no logo SVG do TrackDoc
 */

const fs = require('fs');
const path = require('path');

// SVG base do favicon
const faviconSVG = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="16" cy="16" r="16" fill="#2563eb"/>
  
  <!-- Document icon -->
  <rect x="8" y="6" width="12" height="16" rx="2" fill="white"/>
  
  <!-- Document lines -->
  <rect x="10" y="9" width="8" height="1" fill="#2563eb"/>
  <rect x="10" y="11" width="6" height="1" fill="#2563eb"/>
  <rect x="10" y="13" width="8" height="1" fill="#2563eb"/>
  <rect x="10" y="15" width="4" height="1" fill="#2563eb"/>
  
  <!-- Checkmark -->
  <path d="M12 18L14 20L20 14" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// SVG para Open Graph (1200x630)
const ogSVG = `<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background gradient -->
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  
  <!-- Logo area -->
  <g transform="translate(100, 200)">
    <!-- Document icon -->
    <rect x="0" y="0" width="80" height="100" rx="8" fill="white"/>
    
    <!-- Document lines -->
    <rect x="10" y="20" width="60" height="4" fill="#2563eb"/>
    <rect x="10" y="30" width="40" height="4" fill="#2563eb"/>
    <rect x="10" y="40" width="60" height="4" fill="#2563eb"/>
    <rect x="10" y="50" width="30" height="4" fill="#2563eb"/>
    
    <!-- Checkmark -->
    <path d="M20 70L30 80L60 50" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  
  <!-- Text -->
  <text x="220" y="250" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white">
    TrackDoc
  </text>
  <text x="220" y="300" font-family="Arial, sans-serif" font-size="24" fill="white" opacity="0.9">
    Gestão Inteligente de Documentos com IA
  </text>
  <text x="220" y="330" font-family="Arial, sans-serif" font-size="18" fill="white" opacity="0.8">
    Assinatura Eletrônica • Gestão Inteligente • Dashboard Executivo
  </text>
</svg>`;

// Função para salvar arquivo
function saveFile(filename, content) {
  const publicDir = path.join(__dirname, '..', 'public');
  const filePath = path.join(publicDir, filename);
  
  try {
    fs.writeFileSync(filePath, content);
    console.log(`✅ ${filename} criado com sucesso`);
  } catch (error) {
    console.error(`❌ Erro ao criar ${filename}:`, error.message);
  }
}

// Gerar arquivos
console.log('🎨 Gerando ícones do TrackDoc...\n');

// Salvar SVG do favicon
saveFile('favicon.svg', faviconSVG);

// Salvar SVG do Open Graph
saveFile('og-image.svg', ogSVG);

console.log('\n📋 Próximos passos:');
console.log('1. Use um conversor online (como favicon.io) para converter favicon.svg para:');
console.log('   - favicon.ico');
console.log('   - favicon-16x16.png');
console.log('   - favicon-32x32.png');
console.log('   - apple-touch-icon.png');
console.log('   - android-chrome-192x192.png');
console.log('   - android-chrome-512x512.png');
console.log('\n2. Use um conversor online para converter og-image.svg para:');
console.log('   - og-image.png');
console.log('   - twitter-image.png');
console.log('\n3. Coloque todos os arquivos na pasta public/');
console.log('\n🚀 Após isso, a landing page estará 100% otimizada para SEO!');
