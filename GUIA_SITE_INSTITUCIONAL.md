# 🌐 Guia Completo - Implementação no Site Institucional

## 📋 O Que Você Precisa Fazer no trackdoc.com.br

### ✅ Resumo
- Adicionar JavaScript nos botões dos planos
- Configurar IDs nos botões
- Testar

**Tempo**: 10 minutos
**Dificuldade**: Fácil

---

## 🎯 Passo 1: Adicionar JavaScript

Adicione este código **ANTES do `</body>`** na página de preços:

```html
<script>
// URL da API (trackdoc.app.br)
const API_URL = 'https://www.trackdoc.app.br/api/stripe/create-checkout-public';

// Função para iniciar checkout
async function iniciarCheckout(planType, botao) {
  // Desabilitar botão
  botao.disabled = true;
  const textoOriginal = botao.textContent;
  botao.textContent = 'Processando...';
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planType: planType,
        includeTrial: true  // 14 dias grátis
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      alert('Erro: ' + data.error);
      return;
    }
    
    // Redirecionar para Stripe
    if (data.url) {
      window.location.href = data.url;
    }
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao processar. Tente novamente.');
    botao.disabled = false;
    botao.textContent = textoOriginal;
  }
}
</script>
```

---

## 🎯 Passo 2: Configurar Botões

Adicione **IDs e onclick** nos seus botões:

```html
<!-- Plano Básico -->
<button 
  id="btn-basico"
  onclick="iniciarCheckout('basico', this)"
>
  Começar agora
</button>

<!-- Plano Profissional -->
<button 
  id="btn-profissional"
  onclick="iniciarCheckout('profissional', this)"
>
  Começar teste grátis
</button>

<!-- Plano Enterprise -->
<button 
  id="btn-enterprise"
  onclick="iniciarCheckout('enterprise', this)"
>
  Começar agora
</button>
```

---

## 🎯 Passo 3: Testar

1. Abra: `https://www.trackdoc.com.br/#precos`
2. Clique em qualquer botão
3. Deve redirecionar para Stripe Checkout
4. Use cartão de teste: `4242 4242 4242 4242`

---

## ✅ Pronto! É Só Isso!

**Não precisa**:
- ❌ Configurar nada no Stripe Dashboard
- ❌ Criar páginas de checkout
- ❌ Adicionar links especiais
- ❌ Configurar webhooks no site institucional

**O sistema faz tudo automaticamente!**

---

## 🔍 Como Funciona

```
trackdoc.com.br
  ↓ Botão chama: iniciarCheckout('profissional')
  ↓ JavaScript faz: fetch(trackdoc.app.br/api/...)
  ↓ API retorna: { url: "checkout.stripe.com/..." }
  ↓ JavaScript redireciona para Stripe
  ↓ Usuário paga
  ↓ Stripe redireciona para: trackdoc.app.br/register
```

---

## 💡 Dicas

### Se quiser personalizar o texto do botão:
```html
<button onclick="iniciarCheckout('profissional', this)">
  🎉 Começar 14 dias grátis
</button>
```

### Se quiser adicionar loading visual:
```css
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

---

## 🆘 Troubleshooting

### Erro: "Failed to fetch"
**Causa**: API não está rodando
**Solução**: Inicie `npm run dev` no trackdoc.app.br

### Botão não faz nada
**Causa**: JavaScript não carregou
**Solução**: Verifique console do navegador (F12)

### CORS Error
**Causa**: API bloqueando origem
**Solução**: Já está configurado para aceitar trackdoc.com.br

---

**Tempo total**: 10 minutos
**Resultado**: Checkout funcionando! 🚀
