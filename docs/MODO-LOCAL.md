# 🔄 Sistema de Proxy - TrackDoc

## Problema Resolvido

Este sistema resolve o problema de **redes com proxy corporativo** que bloqueiam conexões diretas com o Supabase. O TrackDoc agora usa um proxy local para contornar essas limitações mantendo todos os dados reais.

## Como Funciona

### Detecção Automática de Conexão
O sistema tenta automaticamente:
1. **Conexão Direta**: Tenta conectar diretamente ao Supabase
2. **Proxy Local**: Se falhar, usa proxy através do servidor Next.js
3. **Indicador Visual**: Mostra qual método está sendo usado

### Recursos do Sistema de Proxy

✅ **Dados Reais do Supabase**
- Todos os dados são reais, não simulados
- Autenticação completa com usuários reais
- Todas as funcionalidades disponíveis

✅ **Contorna Proxy Corporativo**
- Redireciona chamadas através do servidor Next.js
- Funciona em redes restritivas
- Transparente para o usuário

✅ **Detecção Inteligente**
- Testa conexão direta primeiro
- Fallback automático para proxy
- Indicadores visuais do status

## Como Testar

1. **Inicie o projeto:**
   ```bash
   npm run dev
   ```

2. **Teste a conexão:**
   ```
   http://localhost:3000/test-connection
   ```

3. **Verifique os indicadores:**
   - ✅ Conexão Direta = Rede permite acesso direto
   - 🔄 Proxy Ativo = Usando proxy para contornar bloqueios
   - ❌ Sem Conexão = Problema de configuração

4. **Acesse o sistema:**
   ```
   http://localhost:3000/login
   ```

## Estrutura dos Arquivos

```
lib/
├── supabase-client.ts         # Cliente inteligente com fallback
├── supabase-proxy.ts          # Configuração do proxy
└── contexts/
    └── hybrid-auth-context.tsx # Contexto com detecção automática

app/
├── api/
│   └── supabase-proxy/
│       └── [...path]/
│           └── route.ts       # Proxy server-side
├── components/
│   └── auth-wrapper.tsx       # Indicadores visuais
└── test-connection/
    └── page.tsx               # Página de diagnóstico
```

## Configuração Necessária

Certifique-se de que o arquivo `.env.local` está configurado:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-de-servico
```

## Indicadores Visuais

### No canto inferior esquerdo da tela:

- **✅ Conexão Direta** (verde): Conectado diretamente ao Supabase
- **🔄 Proxy Ativo** (laranja): Usando proxy para contornar bloqueios
- **❌ Sem Conexão** (vermelho): Problema de configuração ou rede

## Vantagens

1. **Dados Reais**
   - Não usa dados simulados
   - Autenticação real do Supabase
   - Todas as funcionalidades disponíveis

2. **Funciona em Redes Restritivas**
   - Contorna proxies corporativos
   - Funciona em firewalls restritivos
   - Sem necessidade de configuração de rede

3. **Transparente**
   - Usuário não percebe diferença
   - Fallback automático
   - Performance similar

## Diagnóstico de Problemas

### Página de Teste: `/test-connection`

Esta página executa testes automáticos:

1. **Variáveis de Ambiente**: Verifica se estão configuradas
2. **Conexão Direta**: Testa acesso direto ao Supabase
3. **Proxy Local**: Testa se o proxy está funcionando

### Interpretação dos Resultados:

- **✅ Conexão Direta OK**: Sua rede permite acesso direto
- **❌ Direta ERRO + ✅ Proxy OK**: Proxy funcionando (situação ideal para redes com proxy)
- **❌ Ambos ERRO**: Problema de configuração

## Troubleshooting

### Problema: Ambos os testes falham
**Soluções:**
1. Verifique as variáveis de ambiente no `.env.local`
2. Confirme se as chaves do Supabase estão corretas
3. Teste em uma rede diferente

### Problema: Conexão lenta
**Causa:** Proxy adiciona uma camada extra
**Solução:** Normal quando usando proxy, ainda funcional

### Problema: Erro 500 no proxy
**Soluções:**
1. Verifique os logs do servidor Next.js
2. Confirme se `SUPABASE_SERVICE_ROLE_KEY` está configurada
3. Reinicie o servidor de desenvolvimento

## Suporte

Este sistema foi criado especificamente para redes corporativas com proxy. Para suporte:

1. Acesse `/test-connection` para diagnóstico
2. Verifique o console do navegador
3. Confirme as variáveis de ambiente
4. Teste em rede diferente se possível

## Migração Futura

Quando não houver mais restrições de rede, o sistema continuará funcionando normalmente, apenas mudará automaticamente para conexão direta (mais rápida).