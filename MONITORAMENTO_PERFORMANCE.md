# 📊 Monitoramento de Performance - Trackdoc

## 🎯 Objetivo
Monitorar e garantir que a aplicação continue rápida após as correções de cache.

---

## 🔍 Ferramentas de Monitoramento

### 1. Chrome DevTools (Desenvolvimento)

#### Network Tab
```
1. Abrir DevTools (F12)
2. Ir em Network tab
3. Recarregar página
4. Verificar:
   - Tempo total de carregamento
   - Tamanho dos recursos
   - Headers de cache
   - Requisições lentas (>1s)
```

#### Performance Tab
```
1. Abrir DevTools (F12)
2. Ir em Performance tab
3. Clicar em Record
4. Recarregar página
5. Parar gravação
6. Analisar:
   - Tempo de renderização
   - JavaScript execution
   - Layout shifts
```

#### Lighthouse
```
1. Abrir DevTools (F12)
2. Ir em Lighthouse tab
3. Selecionar "Performance"
4. Clicar em "Analyze page load"
5. Verificar score (deve ser >80)
```

---

### 2. Vercel Analytics (Produção)

#### Instalação
```bash
npm install @vercel/analytics
```

#### Configuração
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

#### Métricas Disponíveis
- **FCP** (First Contentful Paint) - Deve ser <1.8s
- **LCP** (Largest Contentful Paint) - Deve ser <2.5s
- **FID** (First Input Delay) - Deve ser <100ms
- **CLS** (Cumulative Layout Shift) - Deve ser <0.1
- **TTFB** (Time to First Byte) - Deve ser <600ms

---

### 3. Console Logs (Desenvolvimento)

#### Logs Importantes
```javascript
// Verificar no console do navegador:

✅ "[Auth] Carregamento finalizado" - Deve aparecer em <3s
✅ "[ProfileContext] Perfil carregado" - Deve aparecer em <5s
⚠️ "[ProfileContext] Usando perfil básico devido a timeout" - OK se conexão lenta
❌ Não deve ficar travado sem mensagens
```

#### Adicionar Logs Customizados
```typescript
// Adicionar em componentes críticos
console.time('ComponentLoad')
// ... código do componente
console.timeEnd('ComponentLoad')
```

---

### 4. Script de Teste Automatizado

#### Executar Teste
```bash
node scripts/test-performance.js
```

#### O que Testa
- ✅ Tempo de resposta das APIs
- ✅ Headers de cache
- ✅ Status codes
- ✅ Timeouts

---

## 📈 Métricas Alvo

### Carregamento Inicial
| Métrica | Alvo | Crítico |
|---------|------|---------|
| TTFB | <600ms | <1s |
| FCP | <1.8s | <3s |
| LCP | <2.5s | <4s |
| TTI | <3.8s | <7s |

### APIs
| Endpoint | Alvo | Crítico |
|----------|------|---------|
| /api/profile | <500ms | <1s |
| /api/health | <200ms | <500ms |
| Supabase queries | <300ms | <800ms |

### Cache
| Recurso | Cache | Revalidate |
|---------|-------|------------|
| /api/profile | 30s | 60s |
| Static assets | 1 ano | - |
| Images | 1 mês | - |

---

## 🚨 Alertas e Problemas

### Sinais de Problema

#### 1. Carregamento Lento (>5s)
**Possíveis Causas:**
- Supabase lento ou offline
- Queries não otimizadas
- Sem índices no banco
- Região do servidor longe

**Solução:**
```bash
# Verificar logs do Supabase
# Otimizar queries
# Adicionar índices
# Considerar Edge Functions
```

#### 2. Cache Não Funciona
**Possíveis Causas:**
- Headers não configurados
- Build não atualizado
- Browser cache desabilitado

**Solução:**
```bash
# Rebuild
rm -rf .next
npm run build

# Verificar headers no Network tab
# Limpar cache do browser
```

#### 3. Timeout Frequente
**Possíveis Causas:**
- Conexão instável
- Supabase sobrecarregado
- Queries muito pesadas

**Solução:**
```bash
# Aumentar timeout (se necessário)
# Otimizar queries
# Implementar retry logic
```

---

## 🔧 Comandos Úteis

### Análise de Bundle
```bash
# Instalar analyzer
npm install @next/bundle-analyzer

# Adicionar em next.config.mjs
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

# Executar análise
ANALYZE=true npm run build
```

### Teste de Carga
```bash
# Instalar autocannon
npm install -g autocannon

# Testar endpoint
autocannon -c 10 -d 30 http://localhost:3000/api/profile
```

### Monitorar Logs em Produção
```bash
# Vercel CLI
vercel logs

# Filtrar por erro
vercel logs --follow | grep ERROR
```

---

## 📊 Dashboard de Monitoramento

### Métricas para Acompanhar

#### Diariamente
- [ ] Tempo médio de carregamento
- [ ] Taxa de erro (deve ser <1%)
- [ ] Uptime (deve ser >99.9%)

#### Semanalmente
- [ ] Lighthouse score
- [ ] Bundle size
- [ ] Cache hit rate
- [ ] API response times

#### Mensalmente
- [ ] Core Web Vitals
- [ ] User satisfaction
- [ ] Performance trends
- [ ] Optimization opportunities

---

## 🎯 Metas de Performance

### Curto Prazo (1 mês)
- ✅ Carregamento <3s (95% das vezes)
- ✅ Zero travamentos
- ✅ Cache funcionando
- ✅ Lighthouse score >80

### Médio Prazo (3 meses)
- 🎯 Carregamento <2s (95% das vezes)
- 🎯 Lighthouse score >90
- 🎯 Core Web Vitals "Good"
- 🎯 Bundle size <1MB

### Longo Prazo (6 meses)
- 🚀 Carregamento <1s (95% das vezes)
- 🚀 Lighthouse score >95
- 🚀 PWA implementado
- 🚀 Offline support

---

## 📝 Checklist de Monitoramento

### Após Deploy
- [ ] Verificar que aplicação carrega
- [ ] Testar login/logout
- [ ] Verificar logs (sem erros críticos)
- [ ] Testar com conexão lenta
- [ ] Verificar cache no Network tab
- [ ] Executar Lighthouse
- [ ] Verificar Vercel Analytics

### Semanal
- [ ] Revisar métricas do Vercel
- [ ] Verificar logs de erro
- [ ] Testar performance
- [ ] Verificar bundle size
- [ ] Revisar feedback de usuários

### Mensal
- [ ] Análise completa de performance
- [ ] Otimizações necessárias
- [ ] Atualizar dependências
- [ ] Revisar estratégia de cache
- [ ] Planejar melhorias

---

## 🔗 Links Úteis

- [Vercel Analytics](https://vercel.com/analytics)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Web Vitals](https://web.dev/vitals/)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)

---

## 💡 Dicas Finais

1. **Monitore Constantemente** - Performance degrada com o tempo
2. **Teste em Produção** - Ambiente local é sempre mais rápido
3. **Ouça os Usuários** - Feedback real é valioso
4. **Otimize Gradualmente** - Não tente otimizar tudo de uma vez
5. **Documente Mudanças** - Mantenha registro do que funciona

---

## 🎉 Conclusão

Com monitoramento adequado, você pode:
- ✅ Detectar problemas antes dos usuários
- ✅ Manter performance consistente
- ✅ Identificar oportunidades de melhoria
- ✅ Garantir boa experiência do usuário
