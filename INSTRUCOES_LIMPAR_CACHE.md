# Instruções para Limpar Cache e Resolver Loop de Login/Logout

## Problema

O sistema está alternando entre logado e deslogado em loop infinito. Isso acontece porque o navegador está mantendo dados em cache que fazem o Supabase restaurar a sessão automaticamente.

## Solução Rápida

### Opção 1: Usar a Página de Limpeza (RECOMENDADO)

1. Acesse: `https://www.trackdoc.app.br/clear-cache.html`
2. Clique em "Limpar Tudo e Ir para Login"
3. Aguarde o redirecionamento
4. Faça login normalmente

### Opção 2: Limpar Manualmente no Navegador

#### Chrome/Edge:
1. Pressione `Ctrl + Shift + Delete` (Windows) ou `Cmd + Shift + Delete` (Mac)
2. Selecione "Todo o período"
3. Marque:
   - ✅ Cookies e outros dados do site
   - ✅ Imagens e arquivos em cache
4. Clique em "Limpar dados"
5. Feche TODAS as abas do TrackDoc
6. Abra uma nova aba e acesse `https://www.trackdoc.app.br/login`

#### Firefox:
1. Pressione `Ctrl + Shift + Delete` (Windows) ou `Cmd + Shift + Delete` (Mac)
2. Selecione "Tudo"
3. Marque:
   - ✅ Cookies
   - ✅ Cache
4. Clique em "Limpar agora"
5. Feche TODAS as abas do TrackDoc
6. Abra uma nova aba e acesse `https://www.trackdoc.app.br/login`

### Opção 3: Modo Anônimo/Privado (TESTE)

1. Abra uma janela anônima/privada
2. Acesse `https://www.trackdoc.app.br/login`
3. Faça login
4. Teste o logout

Se funcionar no modo anônimo, o problema é definitivamente cache. Use a Opção 1 ou 2.

## O que Foi Corrigido no Código

1. **Logout Síncrono**: Agora aguarda o Supabase completar o logout antes de continuar
2. **Limpeza de Cookies**: Remove todos os cookies do navegador
3. **Flag de Logout**: Marca quando acabou de fazer logout para não restaurar sessão
4. **Cache Busting**: Adiciona timestamp na URL para evitar cache
5. **Limpeza Total**: `localStorage.clear()` e `sessionStorage.clear()` removem tudo

## Verificação

Após limpar o cache, você deve conseguir:
- ✅ Fazer login normalmente
- ✅ Navegar pelo sistema
- ✅ Fazer logout sem loops
- ✅ Fazer login novamente sem problemas

## Se o Problema Persistir

1. Tente em outro navegador
2. Verifique se há extensões do navegador interferindo
3. Desabilite temporariamente antivírus/firewall
4. Limpe o cache do DNS: `ipconfig /flushdns` (Windows) ou `sudo dscacheutil -flushcache` (Mac)

## Logs para Debug

Abra o Console do Navegador (F12) e procure por:
- `🚪 [Auth] Iniciando logout...`
- `✅ [Auth] Logout no Supabase concluído`
- `🧹 [Auth] Limpando storage...`
- `✅ [Auth] Storage e cookies limpos`
- `🔄 [Auth] Redirecionando para /login`

Se algum desses logs não aparecer, há um problema no fluxo de logout.
